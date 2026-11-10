"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/derive";
import type { Dance } from "@/lib/types";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
}

type CalendarState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; connected: false }
  | { status: "ready"; connected: true; name: string; events: CalendarEvent[] };

interface Item {
  key: string;
  time: string;
  title: string;
  due: boolean;
  sort: string;
}

interface Props {
  dances: Dance[];
  showDue: boolean;
  onConnect: () => void;
}

const DAY_MS = 86400000;
const iso = (d: Date) => todayISO(d);

function mondayOf(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const timeOf = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");

/** "4:30 - 5:30 pm", or "11:30 am - 1:00 pm" when it crosses noon. */
function timeRange(start: string, end: string | null) {
  const from = timeOf(start);
  if (!end || end === start) return from;
  const to = timeOf(end);
  const [fromTime, fromHalf] = from.split(" ");
  const [, toHalf] = to.split(" ");
  return fromHalf === toHalf ? `${fromTime} - ${to}` : `${from} - ${to}`;
}

export default function WeekView({ dances, showDue, onConnect }: Props) {
  // Read the clock once, so the week doesn't shift while the page is open.
  const [now] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [cal, setCal] = useState<CalendarState>({ status: "loading" });
  const [picked, setPicked] = useState(() => iso(now));

  const today = iso(now);
  const monday = mondayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset * 7));
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const start = iso(days[0]);

  useEffect(() => {
    let live = true;
    const from = days[0];
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    const query = new URLSearchParams({
      start,
      from: from.toISOString(),
      to: to.toISOString(),
      tz: String(from.getTimezoneOffset()),
    });
    // Loading shows only after a moment, so quick week changes don't flash.
    const slow = setTimeout(() => live && setCal({ status: "loading" }), 250);
    api
      .get<{ connected: boolean; name?: string; events?: CalendarEvent[] }>(`/api/calendar?${query}`)
      .then((r) => {
        if (!live) return;
        setCal(
          r.connected ? { status: "ready", connected: true, name: r.name ?? "Your calendar", events: r.events ?? [] } : { status: "ready", connected: false },
        );
      })
      .catch((e: Error) => live && setCal({ status: "error", message: e.message }))
      .finally(() => clearTimeout(slow));
    return () => {
      live = false;
      clearTimeout(slow);
    };
    // The week's first day is the only thing that changes what to fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const itemsFor = (day: Date): Item[] => {
    const key = iso(day);
    const items: Item[] = [];
    if (cal.status === "ready" && cal.connected) {
      for (const e of cal.events) {
        if (e.allDay) {
          // All-day end dates are the day after the last day.
          const last = e.end ? iso(new Date(new Date(`${e.end}T00:00`).getTime() - DAY_MS)) : e.start;
          if (key >= e.start && key <= (last < e.start ? e.start : last)) {
            items.push({ key: `${e.id}-${key}`, time: "All day", title: e.title, due: false, sort: "0" });
          }
        } else if (iso(new Date(e.start)) === key) {
          items.push({ key: e.id, time: timeRange(e.start, e.end), title: e.title, due: false, sort: e.start });
        }
      }
    }
    if (showDue) {
      for (const d of dances) {
        if (d.dueDate === key) items.push({ key: `due-${d.id}`, time: "Due", title: d.name, due: true, sort: "1" });
      }
    }
    return items.sort((a, b) => a.sort.localeCompare(b.sort));
  };

  const heading = offset === 0 ? "This week" : offset === 1 ? "Next week" : offset === -1 ? "Last week" : `Week of ${shortDate(days[0])}`;
  const range = `${shortDate(days[0])} to ${days[6].getMonth() === days[0].getMonth() ? days[6].getDate() : shortDate(days[6])}`;
  const loading = cal.status === "loading";
  const connected = cal.status === "ready" && cal.connected;
  const pickedDay = days.find((d) => iso(d) === picked) ?? days[0];
  const pickedItems = itemsFor(pickedDay);

  const chip = (item: Item) => (
    <div key={item.key} className={`week-chip${item.due ? " due" : ""}`}>
      <span className="week-chip-time">
        <span className="week-chip-dot" />
        {item.time}
      </span>
      <span className="week-chip-title">{item.title}</span>
    </div>
  );

  return (
    <section className="tile week" aria-label={heading}>
      <div className="week-head">
        <h2>{heading}</h2>
        <span className="week-range">{range}</span>
        <span className="week-legend">
          {connected && (
            <span>
              <span className="week-key cal" />
              {cal.name}
            </span>
          )}
          {showDue && (
            <span>
              <span className="week-key due" />
              tempoh due dates
            </span>
          )}
        </span>
        <div className="week-nav">
          <button className="icon-toggle" onClick={() => setOffset(offset - 1)} aria-label="Previous week">
            <IconChevronLeft size={16} />
          </button>
          <button
            className="week-today"
            aria-pressed={offset === 0}
            onClick={() => {
              setOffset(0);
              setPicked(today);
            }}
          >
            Today
          </button>
          <button className="icon-toggle" onClick={() => setOffset(offset + 1)} aria-label="Next week">
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={`week-grid${loading ? " loading" : ""}`}>
        {days.map((day) => {
          const key = iso(day);
          const items = itemsFor(day);
          return (
            <div key={key} className={`week-day${key === today ? " today" : ""}`}>
              <div className="week-day-head">
                <span>{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <b>{day.getDate()}</b>
              </div>
              {items.map(chip)}
              {!loading && items.length === 0 && <span className="week-empty">Nothing planned</span>}
            </div>
          );
        })}
      </div>

      <div className="week-mobile">
        <div className="week-strip">
          {days.map((day) => {
            const key = iso(day);
            const items = itemsFor(day);
            return (
              <button
                key={key}
                className={`week-pick${key === today ? " today" : ""}`}
                aria-pressed={iso(pickedDay) === key}
                onClick={() => setPicked(key)}
                aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              >
                <span>{day.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                <b>{day.getDate()}</b>
                <span className="week-dots">
                  {items.slice(0, 3).map((it) => (
                    <i key={it.key} className={it.due ? "due" : ""} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className={`week-list${loading ? " loading" : ""}`}>
          {pickedItems.map(chip)}
          {!loading && pickedItems.length === 0 && <span className="week-empty">Nothing planned</span>}
        </div>
      </div>

      <div className="week-foot">
        {cal.status === "error" ? (
          <span className="error" style={{ margin: 0 }}>
            {cal.message}
          </span>
        ) : connected ? (
          <span>From {cal.name}. View only, so change events in your calendar app.</span>
        ) : cal.status === "ready" ? (
          <span>Connect your Google, Apple or Outlook calendar to see your classes here.</span>
        ) : (
          <span>Loading your calendar</span>
        )}
        <button className="text-link" onClick={onConnect}>
          {connected ? "Calendar settings" : "Connect a calendar"}
        </button>
      </div>
    </section>
  );
}
