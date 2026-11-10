"use client";

import { Spinner } from "./Loading";
import { useState } from "react";
import { api } from "@/lib/client";
import Modal from "./Modal";

interface Props {
  kind: "dancer" | "choreographer";
  person: { id: string; name: string; birthdate?: string | null; age?: number | null } | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PersonForm({ kind, person, onClose, onSaved }: Props) {
  const [name, setName] = useState(person?.name ?? "");
  const [birthdate, setBirthdate] = useState(person?.birthdate ?? "");
  const [age, setAge] = useState(person?.age != null ? String(person.age) : "");
  // Use the age field when there's an age but no birthdate.
  const [useAge, setUseAge] = useState(!person?.birthdate && person?.age != null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const label = kind === "dancer" ? "dancer" : "choreographer";
  const base = kind === "dancer" ? "/api/dancers" : "/api/choreographers";

  const save = async () => {
    if (!name.trim()) return setError("Add a name");
    setSaving(true);
    setError("");
    const body =
      kind === "dancer"
        ? { name, birthdate: useAge ? null : birthdate || null, age: useAge && age ? Number(age) : null }
        : { name };
    try {
      if (person) await api.patch(`${base}/${person.id}`, body);
      else await api.post(base, body);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={person ? `Edit ${label}` : `New ${label}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Saving" : `Save ${label}`}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="label" htmlFor="person-name">Full name</label>
        <input
          id="person-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          autoFocus
        />
      </div>
      {kind === "dancer" && (
        <div className="field">
          <div className="label">
            <span>{useAge ? "Age" : "Birthdate"}</span>
            <button type="button" className="text-btn" onClick={() => setUseAge(!useAge)}>
              {useAge ? "Use birthdate instead" : "Don't know it? Set an age"}
            </button>
          </div>
          {useAge ? (
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              aria-label="Age"
              placeholder="12"
            />
          ) : (
            <input
              className="input"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              aria-label="Birthdate"
            />
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </Modal>
  );
}
