"use client";

import { IconArrowRight, IconCalendar } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Settings } from "@/lib/types";
import { Spinner } from "./Loading";
import Modal from "./Modal";

interface Props {
  settings: Settings;
  onClose: () => void;
  onSaved: (settings: Settings) => void;
}

const SECTIONS: { key: "dances" | "combos"; name: string; desc: string }[] = [
  { key: "dances", name: "Dances", desc: "Competition dances, dancers, choreographers and solo payments" },
  { key: "combos", name: "Combos", desc: "Quick class combos with a date, song and notes, grouped by class" },
];

type Calendar = { status: "loading" } | { status: "off" } | { status: "on"; name: string };

function Switch({ on, label, onFlip }: { on: boolean; label: string; onFlip: () => void }) {
  return (
    <button type="button" role="switch" className="switch" aria-checked={on} aria-label={label} onClick={onFlip}>
      <span />
    </button>
  );
}

export default function SettingsModal({ settings, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState(settings);
  const [warn, setWarn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [calendar, setCalendar] = useState<Calendar>({ status: "loading" });
  const [link, setLink] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [calendarError, setCalendarError] = useState("");

  useEffect(() => {
    api
      .get<{ connected: boolean; name?: string }>("/api/calendar")
      .then((r) => setCalendar(r.connected ? { status: "on", name: r.name ?? "Your calendar" } : { status: "off" }))
      .catch(() => setCalendar({ status: "off" }));
  }, []);

  const flip = (key: "dances" | "combos") => {
    const next = { ...draft, [key]: !draft[key] };
    if (!next.dances && !next.combos) return setWarn(true);
    setWarn(false);
    setDraft(next);
  };

  const connect = async () => {
    if (!link.trim()) return setCalendarError("Paste your calendar's secret address first");
    setConnecting(true);
    setCalendarError("");
    try {
      const r = await api.patch<{ name: string }>("/api/calendar", { url: link });
      setCalendar({ status: "on", name: r.name });
      setLink("");
    } catch (e) {
      setCalendarError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setConnecting(true);
    setCalendarError("");
    try {
      await api.del("/api/calendar");
      setCalendar({ status: "off" });
    } catch (e) {
      setCalendarError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      onSaved(await api.patch<Settings>("/api/settings", draft));
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Settings"
      subtitle="Choose what tempoh tracks for you."
      onClose={onClose}
      headerAction={
        <a className="close help-btn" href="/guide" aria-label="How tempoh works" title="How tempoh works">
          ?
        </a>
      }
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Saving" : "Save"}
          </button>
        </>
      }
    >
      <h3 className="settings-label">Sections</h3>
      <div className="switch-list">
        {SECTIONS.map((s) => (
          <div key={s.key} className="switch-row">
            <span style={{ flex: 1 }}>
              <span className="switch-name">{s.name}</span>
              <span className="switch-desc">{s.desc}</span>
            </span>
            <Switch on={draft[s.key]} label={s.name} onFlip={() => flip(s.key)} />
          </div>
        ))}
      </div>
      <p className={warn ? "error" : "demo-note"} style={{ padding: "8px 4px 0", margin: 0 }}>
        {warn ? "Keep at least one section on." : "Turning a section off hides it. Nothing is deleted from Notion."}
      </p>

      <h3 className="settings-label">Calendar</h3>
      {calendar.status === "loading" && (
        <div className="switch-row">
          <Spinner />
          <span className="switch-desc" style={{ margin: 0 }}>
            Checking your calendar
          </span>
        </div>
      )}
      {calendar.status === "off" && (
        <form
          className="calendar-connect"
          onSubmit={(e) => {
            e.preventDefault();
            connect();
          }}
        >
          <div className="calendar-connect-head">
            <span className="switch-name">Show a calendar on Home</span>
            <a href="/guide#calendar" className="text-link">
              How to, with pictures
            </a>
          </div>
          <ol>
            <li>In Google Calendar, open the calendar&apos;s Settings and sharing.</li>
            <li>Under Integrate calendar, copy the Secret address in iCal format.</li>
            <li>Paste it here. Apple Calendar and Outlook links work too.</li>
          </ol>
          <div className="calendar-input">
            <input
              className="input"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setCalendarError("");
              }}
              placeholder="https://calendar.google.com/calendar/ical/..."
              aria-label="Calendar link"
            />
            <button className="btn-primary" type="submit" disabled={connecting}>
              {connecting && <Spinner />}
              Connect
            </button>
          </div>
          <span className="switch-desc">
            This link works like a password, so tempoh keeps it encrypted. You can reset it in Google any time.
          </span>
        </form>
      )}
      {calendar.status === "on" && (
        <div className="calendar-on">
          <div className="calendar-on-head">
            <span className="calendar-icon">
              <IconCalendar size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="switch-name">{calendar.name}</span>
              <span className="switch-desc">Shows on Home. View only.</span>
            </span>
            <button className="btn danger" onClick={disconnect} disabled={connecting}>
              {connecting && <Spinner />}
              Disconnect
            </button>
          </div>
          <div className="switch-row inner">
            <span style={{ flex: 1 }}>
              <span className="switch-name">Add tempoh due dates</span>
              <span className="switch-desc">Dance due dates show next to your calendar events</span>
            </span>
            <Switch
              on={draft.calendarDue}
              label="Add tempoh due dates"
              onFlip={() => setDraft({ ...draft, calendarDue: !draft.calendarDue })}
            />
          </div>
        </div>
      )}
      {calendarError && <p className="error">{calendarError}</p>}

      <a className="help-row" href="/guide">
        <span className="help-mark">?</span>
        <span style={{ flex: 1 }}>
          <span className="switch-name">Need a hand?</span>
          <span className="switch-desc">See how tempoh works, step by step.</span>
        </span>
        <IconArrowRight size={16} />
      </a>

      {error && <p className="error">{error}</p>}
    </Modal>
  );
}
