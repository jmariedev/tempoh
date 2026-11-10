"use client";

import { IconArrowRight, IconPlus } from "@tabler/icons-react";
import type { CSSProperties } from "react";
import { dateTile, formatDate, STAGE_COLORS, todayISO } from "@/lib/derive";
import { PROGRESS, type AppData } from "@/lib/types";
import WeekView from "./WeekView";

interface Props {
  data: AppData;
  firstName: string;
  onOpen: (section: "dances" | "combos") => void;
  onNew: (kind: "dance" | "combo" | "dancer") => void;
  onCalendar: () => void;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeView({ data, firstName, onOpen, onNew, onCalendar }: Props) {
  const { settings, dances, combos, classes } = data;
  const now = new Date();
  const today = todayISO(now);
  const upcoming = dances
    .filter((d) => d.dueDate && d.dueDate >= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 2);
  const latest = [...combos].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
  const latestTile = latest ? dateTile(latest.date) : null;
  const classCounts = classes
    .map((c) => ({ ...c, count: combos.filter((x) => x.classId === c.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="home">
      <div className="home-hello">
        <p>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>
          {greeting(now.getHours())}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {data.mode === "demo" && (
          <p className="home-demo">
            You&apos;re trying the demo with sample data.{" "}
            <a className="link" href="/api/auth/login">
              Sign in with Notion
            </a>{" "}
            to use your own.
          </p>
        )}
      </div>

      <div className="home-cards">
        {settings.dances && (
          <button className="tile home-card" onClick={() => onOpen("dances")} style={{ "--i": 0 } as CSSProperties}>
            <span className="home-card-head">
              Dances
              <span className="home-go">
                <IconArrowRight size={16} />
              </span>
            </span>
            <span className="home-count">
              <b>{dances.length}</b>
              {dances.length === 1 ? "dance this season" : "dances this season"}
            </span>
            <span className="home-stages" aria-label="Dances by stage">
              {PROGRESS.map((p) => {
                const count = dances.filter((d) => d.progress === p).length;
                return count ? <span key={p} style={{ flex: count, background: STAGE_COLORS[p].bg }} title={`${p}: ${count}`} /> : null;
              })}
              {dances.length === 0 && <span style={{ flex: 1, background: "var(--line)" }} />}
            </span>
            <span className="home-rows">
              {upcoming.map((d) => (
                <span key={d.id} className="home-row">
                  <b>{d.name}</b>
                  <span>Due {formatDate(d.dueDate)}</span>
                </span>
              ))}
              {upcoming.length === 0 && <span className="home-row faint">No dates coming up</span>}
            </span>
          </button>
        )}

        {settings.combos && (
          <button className="tile home-card" onClick={() => onOpen("combos")} style={{ "--i": 1 } as CSSProperties}>
            <span className="home-card-head">
              Combos
              <span className="home-go">
                <IconArrowRight size={16} />
              </span>
            </span>
            <span className="home-count">
              <b>{combos.length}</b>
              {`${combos.length === 1 ? "combo" : "combos"} across ${classes.length} ${classes.length === 1 ? "class" : "classes"}`}
            </span>
            <span className="home-chips">
              {classCounts.map((c) => (
                <span key={c.id}>
                  {c.name} <i>{c.count}</i>
                </span>
              ))}
            </span>
            {latest ? (
              <span className="home-latest">
                <span className="date-tile small">
                  {latestTile ? (
                    <>
                      <span>{latestTile.month}</span>
                      <b>{latestTile.day}</b>
                    </>
                  ) : (
                    <span>NEW</span>
                  )}
                </span>
                <span>
                  <b>{latest.name}</b>
                  <span>Latest{classes.find((c) => c.id === latest.classId) ? `, ${classes.find((c) => c.id === latest.classId)!.name}` : ""}</span>
                </span>
              </span>
            ) : (
              <span className="home-row faint">No combos yet</span>
            )}
          </button>
        )}

        <div className="home-card quick" style={{ "--i": 2 } as CSSProperties}>
          <span className="home-card-head">Quick add</span>
          <span className="quick-sub">Jump straight into something new.</span>
          {settings.dances && (
            <button onClick={() => onNew("dance")}>
              New dance
              <span>
                <IconPlus size={15} stroke={2.4} />
              </span>
            </button>
          )}
          {settings.combos && (
            <button onClick={() => onNew("combo")}>
              New combo
              <span>
                <IconPlus size={15} stroke={2.4} />
              </span>
            </button>
          )}
          {settings.dances && (
            <button onClick={() => onNew("dancer")}>
              New dancer
              <span>
                <IconPlus size={15} stroke={2.4} />
              </span>
            </button>
          )}
        </div>
      </div>

      <WeekView dances={settings.dances ? dances : []} showDue={settings.dances && settings.calendarDue} onConnect={onCalendar} />
    </div>
  );
}
