import ICAL from "ical.js";

// Reads a calendar's private iCal link (Google, Apple or Outlook) so its events can show in tempoh.
// It's view only: tempoh never writes back to the calendar.

export interface CalendarEvent {
  id: string;
  title: string;
  /** An ISO time, or a plain YYYY-MM-DD date for all-day events. */
  start: string;
  end: string | null;
  allDay: boolean;
}

// Only calendar services, so the server never fetches an arbitrary address someone pastes in.
const ALLOWED_HOSTS = [
  /^calendar\.google\.com$/,
  /^([a-z0-9-]+\.)*icloud\.com$/,
  /^outlook\.office365\.com$/,
  /^outlook\.live\.com$/,
  /^outlook\.office\.com$/,
];

/** Cleans up a pasted link, or throws a message the person can act on. */
export function normalizeCalendarUrl(input: string) {
  const raw = input.trim().replace(/^webcals?:\/\//i, "https://");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a calendar link. Copy the secret address in iCal format.");
  }
  if (url.protocol !== "https:") throw new Error("Calendar links start with https://");
  if (!ALLOWED_HOSTS.some((h) => h.test(url.hostname))) {
    throw new Error("Use a Google, Apple or Outlook calendar link");
  }
  return url.toString();
}

const MAX_BYTES = 5 * 1024 * 1024;
const CACHE_MS = 2 * 60 * 1000;
const cache = new Map<string, { at: number; calendar: ICAL.Component }>();

async function load(url: string) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.calendar;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store", redirect: "follow" });
  if (!res.ok) throw new Error("tempoh couldn't open that calendar. Check the link is the secret address.");
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error("That calendar is too big to show");
  let calendar: ICAL.Component;
  try {
    calendar = new ICAL.Component(ICAL.parse(text));
  } catch {
    throw new Error("That link didn't return a calendar. Copy the secret address in iCal format.");
  }
  if (calendar.name !== "vcalendar") throw new Error("That link didn't return a calendar");
  cache.set(url, { at: Date.now(), calendar });
  if (cache.size > 50) cache.delete(cache.keys().next().value!);
  return calendar;
}

/** Fetches a calendar once to check the link works, and returns its name. */
export async function checkCalendar(url: string) {
  cache.delete(url);
  const calendar = await load(url);
  const name = calendar.getFirstPropertyValue("x-wr-calname");
  return typeof name === "string" && name.trim() ? name.trim() : "Your calendar";
}

const dateOnly = (t: ICAL.Time) =>
  `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;

function toEvent(id: string, title: string, start: ICAL.Time, end: ICAL.Time | null): CalendarEvent {
  const allDay = start.isDate;
  return {
    id,
    title: title || "Busy",
    start: allDay ? dateOnly(start) : start.toJSDate().toISOString(),
    end: end ? (allDay ? dateOnly(end) : end.toJSDate().toISOString()) : null,
    allDay,
  };
}

/** Every event that overlaps the window, with repeating events expanded. */
export async function calendarEvents(url: string, from: Date, to: Date) {
  const calendar = await load(url);
  const name = calendar.getFirstPropertyValue("x-wr-calname");
  const vevents = calendar.getAllSubcomponents("vevent");

  // Edited single occurrences of a repeating event arrive as their own entries.
  const byUid = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];
  for (const v of vevents) {
    const event = new ICAL.Event(v);
    if (v.hasProperty("recurrence-id")) exceptions.push(event);
    else byUid.set(event.uid, event);
  }
  for (const ex of exceptions) byUid.get(ex.uid)?.relateException(ex);

  const fromMs = from.getTime();
  const toMs = to.getTime();
  // All-day dates have no time zone, so compare them by calendar day around the window.
  const overlaps = (start: ICAL.Time, end: ICAL.Time | null) => {
    const s = start.toJSDate().getTime();
    const e = end ? end.toJSDate().getTime() : s + 1;
    const slack = start.isDate ? 14 * 3600 * 1000 : 0;
    return s < toMs + slack && e > fromMs - slack;
  };

  const out: CalendarEvent[] = [];
  for (const event of byUid.values()) {
    if (event.component.getFirstPropertyValue("status") === "CANCELLED") continue;
    if (!event.isRecurring()) {
      if (overlaps(event.startDate, event.endDate)) out.push(toEvent(event.uid, event.summary, event.startDate, event.endDate));
      continue;
    }
    const it = event.iterator();
    for (let i = 0, next = it.next(); next && i < 5000; i++, next = it.next()) {
      if (next.toJSDate().getTime() > toMs + 86400000) break;
      const details = event.getOccurrenceDetails(next);
      if (details.item.component.getFirstPropertyValue("status") === "CANCELLED") continue;
      if (overlaps(details.startDate, details.endDate)) {
        out.push(toEvent(`${event.uid}-${next.toString()}`, details.item.summary, details.startDate, details.endDate));
      }
    }
  }
  out.sort((a, b) => a.start.localeCompare(b.start));
  return { name: typeof name === "string" && name.trim() ? name.trim() : "Your calendar", events: out.slice(0, 400) };
}
