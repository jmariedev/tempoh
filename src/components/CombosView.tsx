"use client";

import { IconPencil, IconPlayerPlayFilled, IconTrash, IconUpload } from "@tabler/icons-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { dateTile } from "@/lib/derive";
import { readPref, writePref } from "@/lib/prefs";
import type { ClassItem, Combo } from "@/lib/types";

interface Props {
  combos: Combo[];
  classes: ClassItem[];
  onPlay: (combo: Combo) => void;
  onEdit: (combo: Combo) => void;
  onDelete: (combo: Combo) => Promise<void>;
  onNotice: (message: string) => void;
}

export const UNSORTED = "unsorted";
const UNDO_MS = 5000;

const newestFirst = (a: Combo, b: Combo) => (b.date ?? "").localeCompare(a.date ?? "") || a.name.localeCompare(b.name);

export default function CombosView({ combos, classes, onPlay, onEdit, onDelete, onNotice }: Props) {
  const [filter, setFilterState] = useState(() => readPref<string>("comboClass", null, "all"));
  // Removed combos hide right away and are only deleted once the undo window passes.
  const [pending, setPending] = useState<Combo | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFilter = (value: string) => {
    setFilterState(value);
    writePref("comboClass", value);
  };

  const finish = (combo: Combo) => {
    onDelete(combo).catch((e: Error) => onNotice(`Couldn't remove ${combo.name}. ${e.message}`));
  };

  const remove = (combo: Combo) => {
    if (timer.current) clearTimeout(timer.current);
    if (pending) finish(pending);
    setPending(combo);
    timer.current = setTimeout(() => {
      finish(combo);
      setPending(null);
    }, UNDO_MS);
  };

  const undo = () => {
    if (timer.current) clearTimeout(timer.current);
    setPending(null);
  };

  // Leaving the page still removes whatever was waiting.
  const latest = useRef({ pending, finish });
  useEffect(() => {
    latest.current = { pending, finish };
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      const { pending: left, finish: done } = latest.current;
      if (left) done(left);
    },
    [],
  );

  const known = new Set(classes.map((c) => c.id));
  const visible = combos.filter((c) => c.id !== pending?.id);
  const activeFilter = filter === "all" || filter === UNSORTED || known.has(filter) ? filter : "all";
  const groups = [
    ...classes.map((c) => ({ id: c.id, name: c.name, items: visible.filter((x) => x.classId === c.id) })),
    {
      id: UNSORTED,
      name: "Unsorted",
      items: visible.filter((x) => !x.classId || !known.has(x.classId)),
    },
  ]
    .filter((g) => (activeFilter === "all" ? g.items.length > 0 || g.id !== UNSORTED : g.id === activeFilter))
    .map((g) => ({ ...g, items: [...g.items].sort(newestFirst) }));

  const hasUnsorted = visible.some((x) => !x.classId || !known.has(x.classId));

  return (
    <>
      <div className="filter-row">
        <select
          className="filter-select"
          value={activeFilter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by class"
        >
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          {hasUnsorted && <option value={UNSORTED}>Unsorted</option>}
        </select>
      </div>

      {combos.length === 0 ? (
        <div className="tile empty-state">
          {classes.length === 0
            ? "Add a class under Classes, then add your first combo."
            : "Add your first combo with New combo."}
        </div>
      ) : (
        <div className="combo-grid" key={activeFilter}>
          {groups.map((g, i) => (
            <section key={g.id} className="tile combo-group" style={{ "--i": i } as CSSProperties}>
              <div className="combo-group-head">
                <h2>{g.name}</h2>
                <span>{g.items.length === 1 ? "1 combo" : `${g.items.length} combos`}</span>
              </div>
              {g.items.length === 0 && <div className="combo-empty">No combos yet</div>}
              {g.items.map((c) => {
                const tile = dateTile(c.date);
                const song = c.songTitle || c.songName;
                return (
                  <div key={c.id} className="combo-row">
                    <span className="date-tile" aria-label={c.date ?? "No date"}>
                      {tile ? (
                        <>
                          <span>{tile.month}</span>
                          <b>{tile.day}</b>
                        </>
                      ) : (
                        <span>NO DATE</span>
                      )}
                    </span>
                    <button className="combo-main" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}>
                      <span className="combo-name">{c.name}</span>
                      <span className="combo-song">{song || "No song yet"}</span>
                      {c.notes && <span className="combo-notes">{c.notes}</span>}
                    </button>
                    <button
                      className={`play small${c.songName ? "" : " empty"}`}
                      onClick={() => onPlay(c)}
                      aria-label={c.songName ? `Play ${c.name}` : `Add a song to ${c.name}`}
                    >
                      {c.songName ? <IconPlayerPlayFilled size={13} /> : <IconUpload size={14} />}
                    </button>
                    <button className="icon-toggle edit-combo" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}>
                      <IconPencil size={15} />
                    </button>
                    <button className="icon-toggle danger" onClick={() => remove(c)} aria-label={`Remove ${c.name}`}>
                      <IconTrash size={16} />
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {pending && (
        <div className="toast" role="status">
          <span>Removed {pending.name}</span>
          <button onClick={undo}>Undo</button>
        </div>
      )}
    </>
  );
}
