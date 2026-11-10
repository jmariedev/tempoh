"use client";

import { useState } from "react";
import { api, uploadSong } from "@/lib/client";
import { todayISO } from "@/lib/derive";
import type { AppData, ClassItem, Combo, ComboInput } from "@/lib/types";
import { Spinner } from "./Loading";
import Modal from "./Modal";
import SongDropzone from "./SongDropzone";

interface Props {
  mode: AppData["mode"];
  combo: Combo | null;
  classes: ClassItem[];
  /** The class to start with for a new combo, usually the one being viewed. */
  classId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ComboForm({ mode, combo, classes, classId, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ComboInput>(() => ({
    name: combo?.name ?? "",
    date: combo?.date ?? todayISO(),
    classId: combo ? combo.classId : (classId ?? classes[0]?.id ?? null),
    songTitle: combo?.songTitle ?? "",
    notes: combo?.notes ?? "",
  }));
  const [song, setSong] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [songProgress, setSongProgress] = useState<number | null | false>(false);
  const [error, setError] = useState("");

  const set = <K extends keyof ComboInput>(key: K, value: ComboInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) return setError("Give the combo a name");
    setSaving(true);
    setError("");
    try {
      const saved = combo
        ? await api.patch<Combo>(`/api/combos/${combo.id}`, form)
        : await api.post<Combo>("/api/combos", form);
      if (song) await uploadSong(saved.id, song, mode, setSongProgress);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      // A new combo may already exist even if the song upload failed.
      onSaved();
    } finally {
      setSaving(false);
      setSongProgress(false);
    }
  };

  return (
    <Modal
      title={combo ? "Edit combo" : "New combo"}
      subtitle={combo ? undefined : "A name and class are all you need. The rest can wait."}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {(saving || songProgress !== false) && <Spinner />}
            {songProgress !== false
              ? `Uploading song${songProgress === null ? "" : ` ${songProgress}%`}`
              : saving
                ? "Saving"
                : combo
                  ? "Save combo"
                  : "Add combo"}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="field">
          <label className="label" htmlFor="combo-name">Combo name</label>
          <input
            id="combo-name"
            className="input"
            autoFocus
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Pirouette prep across the floor"
          />
        </div>

        <div className="field inline-add" style={{ marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="combo-class">Class</label>
            <select
              id="combo-class"
              className="input"
              value={form.classId ?? ""}
              onChange={(e) => set("classId", e.target.value || null)}
            >
              <option value="">No class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="combo-date">Date</label>
            <input
              id="combo-date"
              type="date"
              className="input"
              value={form.date ?? ""}
              onChange={(e) => set("date", e.target.value || null)}
            />
          </div>
        </div>

        <div className="field">
          <div className="label">Song, optional</div>
          <SongDropzone
            mode={mode}
            uploading={songProgress}
            fileName={song?.name ?? combo?.songName}
            hint={song ? "Uploads when you save" : combo?.songName ? "Drag or choose a file to replace it" : undefined}
            onFile={setSong}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="combo-song-title">Song title, optional</label>
          <input
            id="combo-song-title"
            className="input"
            value={form.songTitle}
            onChange={(e) => set("songTitle", e.target.value)}
            placeholder="Levitating, Dua Lipa"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="combo-notes">Notes, optional</label>
          <textarea
            id="combo-notes"
            className="input"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Counts 5 to 8 are the tricky part"
          />
        </div>
        {/* Lets Enter in the name field add the combo. */}
        <button type="submit" hidden />
      </form>

      {error && <p className="error">{error}</p>}
    </Modal>
  );
}
