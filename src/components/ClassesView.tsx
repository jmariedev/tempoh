"use client";

import { IconCheck, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useState, type CSSProperties } from "react";
import { formatDate } from "@/lib/derive";
import type { ClassItem, Combo } from "@/lib/types";
import DeleteButton from "./DeleteButton";
import { Spinner } from "./Loading";

interface Props {
  classes: ClassItem[];
  combos: Combo[];
  onAdd: (name: string) => Promise<void>;
  onRename: (item: ClassItem, name: string) => Promise<void>;
  onRemove: (item: ClassItem) => Promise<void>;
  onView: (item: ClassItem) => void;
}

export default function ClassesView({ classes, combos, onAdd, onRename, onRemove, onView }: Props) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const add = async () => {
    const name = draft.trim();
    if (!name) return setError("Type a class name first");
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) return setError("That class is already here");
    setError("");
    setAdding(true);
    try {
      await onAdd(name);
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const rename = async (item: ClassItem) => {
    const name = editing?.name.trim();
    if (!name || name === item.name) return setEditing(null);
    try {
      await onRename(item, name);
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const sorted = [...classes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <form
        className="add-class"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          aria-label="New class name"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          placeholder="New class name, like Senior lyrical"
        />
        <button className="btn-primary" type="submit" disabled={adding}>
          {adding ? <Spinner /> : null}
          Add class
          <span className="plus-dot small">
            <IconPlus size={13} stroke={2.6} />
          </span>
        </button>
      </form>
      {error && <p className="error notice">{error}</p>}

      {sorted.length === 0 ? (
        <div className="tile empty-state">Add the classes you teach, like Jazz 2 or Teen contemporary.</div>
      ) : (
        <div className="combo-grid">
          {sorted.map((c, i) => {
            const mine = combos
              .filter((x) => x.classId === c.id)
              .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
            const isEditing = editing?.id === c.id;
            return (
              <section key={c.id} className="tile combo-group class-card" style={{ "--i": i } as CSSProperties}>
                <div className="class-head">
                  {isEditing ? (
                    <form
                      className="rename"
                      onSubmit={(e) => {
                        e.preventDefault();
                        rename(c);
                      }}
                    >
                      <input
                        className="input"
                        autoFocus
                        aria-label={`New name for ${c.name}`}
                        value={editing.name}
                        onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                        onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                      />
                      <button className="icon-toggle" type="submit" aria-label="Save name">
                        <IconCheck size={16} />
                      </button>
                      <button className="icon-toggle" type="button" onClick={() => setEditing(null)} aria-label="Cancel">
                        <IconX size={16} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2>{c.name}</h2>
                        <span className="card-meta">{mine.length === 1 ? "1 combo" : `${mine.length} combos`}</span>
                      </div>
                      <button
                        className="icon-toggle"
                        onClick={() => setEditing({ id: c.id, name: c.name })}
                        aria-label={`Rename ${c.name}`}
                      >
                        <IconPencil size={15} />
                      </button>
                      <DeleteButton compact label={c.name} onDelete={() => onRemove(c)} />
                    </>
                  )}
                </div>
                <dl className="facts">
                  {mine.slice(0, 3).map((x) => (
                    <div key={x.id}>
                      <dt style={{ color: "var(--ink)", fontWeight: 500 }}>{x.name}</dt>
                      <dd className="faint">{x.date ? formatDate(x.date) : ""}</dd>
                    </div>
                  ))}
                </dl>
                {mine.length === 0 && <div className="combo-empty">No combos yet</div>}
                <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => onView(c)}>
                  View all combos
                </button>
              </section>
            );
          })}
        </div>
      )}
      <p className="demo-note">Removing a class keeps its combos. They move to Unsorted until you pick a new class.</p>
    </>
  );
}
