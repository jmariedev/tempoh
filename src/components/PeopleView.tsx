"use client";

import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { dancerAge, formatDate, STAGE_COLORS } from "@/lib/derive";
import type { Dance } from "@/lib/types";
import DeleteButton from "./DeleteButton";

interface Person {
  id: string;
  name: string;
  birthdate?: string | null;
  age?: number | null;
}

interface Props<P extends Person> {
  kind: "dancer" | "choreographer";
  people: P[];
  dancesFor: (person: P) => Dance[];
  onEdit: (person: P) => void;
  onDelete: (person: P) => Promise<void>;
}

export default function PeopleView<P extends Person>({ kind, people, dancesFor, onEdit, onDelete }: Props<P>) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const shown = people
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="filters">
        <input
          className="input"
          style={{ maxWidth: 280, border: "none" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={kind === "dancer" ? "Search dancers" : "Search choreographers"}
        />
      </div>

      {shown.length === 0 ? (
        <div className="tile empty-state">
          {people.length === 0 ? `Add your first ${kind} to get started.` : "Nobody matches that search."}
        </div>
      ) : (
        <div className="list">
          {shown.map((person) => {
            const dances = dancesFor(person);
            const age = dancerAge({ birthdate: person.birthdate ?? null, age: person.age ?? null });
            const sub =
              kind === "dancer"
                ? age === null
                  ? "No age yet"
                  : person.birthdate
                    ? `Age ${age}, born ${formatDate(person.birthdate, true)}`
                    : `Age ${age}`
                : `${dances.length} ${dances.length === 1 ? "dance" : "dances"}`;
            return (
              <div key={person.id} className="row">
                <div className="row-content person">
                  <div className="row-title">
                    <div>{person.name}</div>
                    <div className="card-meta">{sub}</div>
                  </div>
                  <div className="row-sub">
                    {dances.length === 0 ? (
                      <span className="faint">No dances yet</span>
                    ) : (
                      <span>
                        {dances.map((d, i) => (
                          <span key={d.id}>
                            {i > 0 && ", "}
                            {d.name} <span style={{ color: STAGE_COLORS[d.progress].fg }}>({d.progress.toLowerCase()})</span>
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="row-actions">
                    <button className="icon-toggle" onClick={() => onEdit(person)} aria-label={`Edit ${person.name}`}>
                      <IconPencil size={15} />
                    </button>
                    <DeleteButton compact label={person.name} onDelete={() => onDelete(person)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
