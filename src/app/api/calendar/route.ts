import { connection } from "next/server";
import { handle } from "@/lib/api";
import { calendarEvents, checkCalendar, normalizeCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { currentAccount, currentDemoId, saveCalendarUrl } from "@/lib/session";
import { SignedOutError } from "@/lib/store";
import { demoCalendar, setDemoCalendar } from "@/lib/store/demo";

type Who = { kind: "account"; botId: string; url: string | null } | { kind: "demo"; id: string };

async function who(): Promise<Who> {
  const account = await currentAccount();
  if (account) return { kind: "account", botId: account.botId, url: account.calendarUrl };
  const demoId = await currentDemoId();
  if (demoId) return { kind: "demo", id: demoId };
  throw new SignedOutError();
}

/** A made-up weekly studio schedule for the demo, placed in the visitor's own week. */
function sampleWeek(start: string, tzOffset: number): CalendarEvent[] {
  const [y, m, d] = start.split("-").map(Number);
  const at = (day: number, hour: number, minute: number) =>
    new Date(Date.UTC(y, m - 1, d + day, hour, minute) + tzOffset * 60000).toISOString();
  const event = (id: string, title: string, day: number, hour: number, minute: number, length = 60) => {
    const s = at(day, hour, minute);
    return { id: `${start}-${id}`, title, start: s, end: new Date(Date.parse(s) + length * 60000).toISOString(), allDay: false };
  };
  return [
    event("a", "Jazz 2", 0, 16, 30),
    event("b", "Teen contemporary", 0, 18, 0, 75),
    event("c", "Mini hip hop", 1, 16, 0, 45),
    event("d", "Private lesson, Ava", 1, 19, 0, 30),
    event("e", "Jazz 2", 2, 16, 30),
    event("f", "Staff meeting", 2, 20, 0, 30),
    event("g", "Teen contemporary", 3, 18, 0, 75),
    event("h", "Midnight Bloom rehearsal", 4, 17, 0),
    event("i", "Group run through", 5, 10, 0, 120),
  ];
}

export async function GET(req: Request) {
  await connection();
  return handle(async () => {
    const params = new URL(req.url).searchParams;
    // Without a week, this just says whether a calendar is connected, for Settings.
    if (!params.has("start")) {
      const me = await who();
      if (me.kind === "demo") {
        const cal = demoCalendar(me.id);
        return cal ? { connected: true, name: cal.kind === "sample" ? "Studio schedule" : cal.name, sample: cal.kind === "sample" } : { connected: false };
      }
      if (!me.url) return { connected: false };
      return { connected: true, name: await checkCalendar(me.url).catch(() => "Your calendar") };
    }
    const from = new Date(params.get("from") ?? "");
    const to = new Date(params.get("to") ?? "");
    const start = params.get("start") ?? "";
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      throw new Error("Pick a week to show");
    }
    const me = await who();
    if (me.kind === "demo") {
      const cal = demoCalendar(me.id);
      if (!cal) return { connected: false };
      if (cal.kind === "sample") {
        const tz = Number(params.get("tz") ?? 0) || 0;
        return { connected: true, name: "Studio schedule", sample: true, events: sampleWeek(start, tz) };
      }
      return { connected: true, ...(await calendarEvents(cal.url, from, to)) };
    }
    if (!me.url) return { connected: false };
    return { connected: true, ...(await calendarEvents(me.url, from, to)) };
  });
}

export function PATCH(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { url?: unknown };
    const url = normalizeCalendarUrl(typeof body.url === "string" ? body.url : "");
    const name = await checkCalendar(url);
    const me = await who();
    if (me.kind === "demo") setDemoCalendar(me.id, { kind: "link", url, name });
    else await saveCalendarUrl(me.botId, url);
    return { connected: true, name };
  });
}

export function DELETE() {
  return handle(async () => {
    const me = await who();
    if (me.kind === "demo") setDemoCalendar(me.id, null);
    else await saveCalendarUrl(me.botId, null);
    return { connected: false };
  });
}
