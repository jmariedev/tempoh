"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Spinner } from "./Loading";
import { api, uploadSong } from "@/lib/client";
import { dancerAge, danceType, STAGE_COLORS } from "@/lib/derive";
import {
  CONTRACT,
  PAYMENT,
  PAYMENT_METHOD,
  PROGRESS,
  type AppData,
  type Choreographer,
  type Dance,
  type DanceInput,
  type Dancer,
} from "@/lib/types";
import Modal from "./Modal";
import RichTextEditor from "./RichTextEditor";
import SongDropzone from "./SongDropzone";

interface Props {
  mode: AppData["mode"];
  dance: Dance | null;
  dancers: Dancer[];
  choreographers: Choreographer[];
  onClose: () => void;
  onSaved: () => void;
}


export default function DanceForm({ mode, dance, dancers, choreographers, onClose, onSaved }: Props) {
  const [form, setForm] = useState<DanceInput>(() => ({
    name: dance?.name ?? "",
    choreographerId: dance?.choreographerId ?? choreographers[0]?.id ?? null,
    dancerIds: dance?.dancerIds ?? [],
    progress: dance?.progress ?? "Scheduled",
    dueDate: dance?.dueDate ?? null,
    notes: dance?.notes ?? [],
    songTitle: dance?.songTitle ?? "",
    costume: dance?.costume ?? [],
    contract: dance?.contract ?? null,
    contractDate: dance?.contractDate ?? null,
    payment: dance?.payment ?? null,
    amountPaid: dance?.amountPaid ?? null,
    paymentMethod: dance?.paymentMethod ?? null,
  }));
  const [roster, setRoster] = useState(dancers);
  const [search, setSearch] = useState("");
  const [newDancer, setNewDancer] = useState({ name: "", birthdate: "", age: "", useAge: false });
  const [song, setSong] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [songProgress, setSongProgress] = useState<number | null | false>(false);
  const [error, setError] = useState("");

  const set = <K extends keyof DanceInput>(key: K, value: DanceInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const type = danceType(form.dancerIds.length);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...roster]
      .filter((d) => !q || d.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, search]);

  const toggleDancer = (id: string) =>
    set(
      "dancerIds",
      form.dancerIds.includes(id) ? form.dancerIds.filter((x) => x !== id) : [...form.dancerIds, id],
    );

  const addDancer = async () => {
    if (!newDancer.name.trim()) return;
    setError("");
    try {
      const created = await api.post<Dancer>("/api/dancers", {
        name: newDancer.name,
        birthdate: newDancer.useAge ? null : newDancer.birthdate || null,
        age: newDancer.useAge && newDancer.age ? Number(newDancer.age) : null,
      });
      setRoster((r) => [...r, created]);
      set("dancerIds", [...form.dancerIds, created.id]);
      setNewDancer((n) => ({ ...n, name: "", birthdate: "", age: "" }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return setError("Give the dance a name");
    setSaving(true);
    setError("");
    try {
      const saved = dance
        ? await api.patch<Dance>(`/api/dances/${dance.id}`, form)
        : await api.post<Dance>("/api/dances", form);
      if (song) await uploadSong(saved.id, song, mode, setSongProgress);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      // A new dance may already exist even if the song upload failed.
      onSaved();
    } finally {
      setSaving(false);
      setSongProgress(false);
    }
  };

  return (
    <Modal
      title={dance ? "Edit dance" : "New dance"}
      wide
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
                : "Save dance"}
          </button>
        </>
      }
    >
      <section className="form-section">
        <h3>Basics</h3>
        <div className="field">
          <label className="label" htmlFor="dance-name">Dance name</label>
          <input
            id="dance-name"
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Midnight Bloom"
            autoFocus
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="dance-choreographer">Choreographer</label>
            <select
              id="dance-choreographer"
              className="input"
              value={form.choreographerId ?? ""}
              onChange={(e) => set("choreographerId", e.target.value || null)}
            >
              <option value="">None</option>
              {choreographers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="dance-due">
              <span>Performance date</span>
              <span>Optional</span>
            </label>
            <input
              id="dance-due"
              className="input"
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => set("dueDate", e.target.value || null)}
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head">
          <h3>Dancers</h3>
          <span className={`type-badge small ${type.toLowerCase()}`}>{type}</span>
          <span className="faint" style={{ marginLeft: "auto", fontSize: 12 }}>
            {form.dancerIds.length === 1 ? "1 selected" : `${form.dancerIds.length} selected`}
          </span>
        </div>
        {form.dancerIds.length > 0 && (
          <div className="picked">
            {form.dancerIds.map((id) => {
              const d = roster.find((x) => x.id === id);
              if (!d) return null;
              return (
                <button key={id} type="button" className="picked-chip" onClick={() => toggleDancer(id)} aria-label={`Remove ${d.name}`}>
                  {d.name}
                  <IconX size={12} stroke={2.4} />
                </button>
              );
            })}
          </div>
        )}
        <div className="picker-box">
          <label className="picker-search">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dancers"
              aria-label="Search dancers"
            />
          </label>
          <div className="picker">
            {visible.map((d) => {
              const age = dancerAge(d);
              const on = form.dancerIds.includes(d.id);
              return (
                <label key={d.id} className={`pick${on ? " on" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleDancer(d.id)} />
                  <span>{d.name}</span>
                  <span>{age !== null ? `Age ${age}` : ""}</span>
                </label>
              );
            })}
            {visible.length === 0 && <div className="pick">No dancers match.</div>}
          </div>
        </div>
        <div className="add-dancer">
          <div className="label">Add a new dancer</div>
          <div className="inline-add new-dancer">
            <input
              className="input"
              value={newDancer.name}
              onChange={(e) => setNewDancer((n) => ({ ...n, name: e.target.value }))}
              placeholder="Full name"
              aria-label="New dancer name"
            />
            <select
              className="input age-kind"
              value={newDancer.useAge ? "age" : "birthdate"}
              onChange={(e) => setNewDancer((n) => ({ ...n, useAge: e.target.value === "age" }))}
              aria-label="Birthdate or age"
            >
              <option value="birthdate">Birthdate</option>
              <option value="age">Age</option>
            </select>
            {newDancer.useAge ? (
              <input
                className="input age-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={newDancer.age}
                onChange={(e) => setNewDancer((n) => ({ ...n, age: e.target.value }))}
                aria-label="New dancer age"
                placeholder="Age"
              />
            ) : (
              <input
                className="input"
                type="date"
                value={newDancer.birthdate}
                onChange={(e) => setNewDancer((n) => ({ ...n, birthdate: e.target.value }))}
                aria-label="New dancer birthdate"
              />
            )}
            <button className="btn-primary" onClick={addDancer} type="button">
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Stage</h3>
        <div className="choices">
          {PROGRESS.map((p) => (
            <button
              key={p}
              type="button"
              className="choice stage-choice"
              aria-pressed={form.progress === p}
              onClick={() => set("progress", p)}
            >
              <span className="dot" style={{ background: STAGE_COLORS[p].bg }} />
              {p}
            </button>
          ))}
        </div>
      </section>

      {type === "Solo" && (
        <section className="form-section">
          <h3>Solo contract and payment</h3>
          <div className="form-grid">
            <div className="field">
              <div className="label">Contract</div>
              <div className="choices">
                {CONTRACT.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="choice"
                    aria-pressed={form.contract === c}
                    onClick={() => set("contract", form.contract === c ? null : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="dance-contract-date">
                <span>Contract date</span>
                <span>Optional</span>
              </label>
              <input
                id="dance-contract-date"
                className="input"
                type="date"
                value={form.contractDate ?? ""}
                onChange={(e) => set("contractDate", e.target.value || null)}
              />
            </div>
          </div>
          <div className="field">
            <div className="label">Payment</div>
            <div className="choices">
              {PAYMENT.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="choice"
                  aria-pressed={form.payment === p}
                  onClick={() => set("payment", form.payment === p ? null : p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="dance-amount">Amount paid</label>
              <input
                id="dance-amount"
                className="input"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                placeholder="$0"
                value={form.amountPaid ?? ""}
                onChange={(e) => set("amountPaid", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="dance-method">Paid with</label>
              <select
                id="dance-method"
                className="input"
                value={form.paymentMethod ?? ""}
                onChange={(e) => set("paymentMethod", (e.target.value || null) as DanceInput["paymentMethod"])}
              >
                <option value="">Not set</option>
                {PAYMENT_METHOD.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      <section className="form-section">
        <h3>Music</h3>
        <div className="field">
          <label className="label" htmlFor="dance-song-title">Song title</label>
          <input
            id="dance-song-title"
            className="input"
            value={form.songTitle}
            onChange={(e) => set("songTitle", e.target.value)}
            placeholder="Song name and artist"
          />
        </div>
        <div className="field">
          <div className="label">Song file</div>
          <SongDropzone
            mode={mode}
            uploading={songProgress}
            fileName={song?.name ?? dance?.songName}
            hint={song ? "Uploads when you save" : dance?.songName ? "Drag or choose a file to replace it" : undefined}
            onFile={setSong}
          />
        </div>
      </section>

      <section className="form-section">
        <h3>Costume and notes</h3>
        <div className="field">
          <label className="label" htmlFor="dance-costume">Costume</label>
          <RichTextEditor
            id="dance-costume"
            value={form.costume}
            onChange={(v) => set("costume", v)}
            placeholder="Pink shorts, or paste a link"
            compact
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="dance-notes">Notes</label>
          <RichTextEditor
            id="dance-notes"
            value={form.notes}
            onChange={(v) => set("notes", v)}
            placeholder="What to work on next"
          />
        </div>
      </section>

      {error && <p className="error">{error}</p>}
    </Modal>
  );
}
