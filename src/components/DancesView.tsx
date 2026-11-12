"use client";

import {
  IconMusic,
  IconPencil,
  IconPlayerPlayFilled,
  IconSelector,
  IconUpload,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { draggingFiles, droppedSong, readPref, writePref } from "@/lib/prefs";
import { averageAge, dancerAge, danceType, formatDate, STAGE_COLORS, STAGE_STEP } from "@/lib/derive";
import { PROGRESS, type Choreographer, type Dance, type Dancer, type Progress } from "@/lib/types";
import { isEmpty } from "@/lib/richtext";
import DeleteButton from "./DeleteButton";
import { Spinner } from "./Loading";
import RichTextView from "./RichTextView";

export type View = "cards" | "list";

interface Props {
  dances: Dance[];
  dancers: Dancer[];
  choreographers: Choreographer[];
  view: View;
  onPlay: (dance: Dance) => void;
  onStatus: (dance: Dance, progress: Progress) => Promise<void>;
  onDropSong: (dance: Dance, file: File, onProgress: (percent: number | null) => void) => Promise<void>;
  onEdit: (dance: Dance) => void;
  onDelete: (dance: Dance) => Promise<void>;
}

function sortDances(a: Dance, b: Dance) {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.name.localeCompare(b.name);
}

const FILTERS = ["All", ...PROGRESS] as const;
const TYPES = ["All", "Solo", "Duo", "Trio", "Group"] as const;
type TypeFilter = (typeof TYPES)[number];
// Payment and contract are only tracked on solos, so these filters show solos only.
// A blank payment reads as Unpaid and a blank contract as Not sent, matching the cards.
const PAYMENTS = ["All", "Not paid yet", "Unpaid", "Partial paid", "Paid"] as const;
type PaymentFilter = (typeof PAYMENTS)[number];
const CONTRACTS = ["All", "Not signed yet", "Not sent", "Sent", "Signed"] as const;
type ContractFilter = (typeof CONTRACTS)[number];

function paymentMatches(dance: Dance, f: PaymentFilter) {
  const payment = dance.payment ?? "Unpaid";
  if (f === "All") return true;
  if (f === "Not paid yet") return payment !== "Paid";
  return payment === f;
}

function contractMatches(dance: Dance, f: ContractFilter) {
  const contract = dance.contract ?? "Not sent";
  if (f === "All") return true;
  if (f === "Not signed yet") return contract !== "Signed";
  return contract === f;
}

export default function DancesView(props: Props) {
  const { dances, dancers, choreographers, view, onPlay, onStatus, onDropSong, onEdit, onDelete } = props;
  // This view only mounts after data loads in the browser, so saved settings can be read up front.
  const [filter, setFilterState] = useState<Progress | "All">(() => readPref("filter", FILTERS, "All"));
  const [choreographer, setChoreographerState] = useState<string>(() => readPref<string>("choreographer", null, ""));
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  // Dances whose new stage is still saving to Notion.
  const [saving, setSaving] = useState<string[]>([]);
  // Upload progress by dance id: a percentage, or null while there's no percentage to show.
  const [uploading, setUploading] = useState<Record<string, number | null>>({});

  const setFilter = (f: Progress | "All") => {
    setFilterState(f);
    writePref("filter", f);
  };
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>(() => readPref("type", TYPES, "All"));
  const setTypeFilter = (t: TypeFilter) => {
    setTypeFilterState(t);
    writePref("type", t);
  };
  const setChoreographer = (id: string) => {
    setChoreographerState(id);
    writePref("choreographer", id);
  };
  const [paymentFilter, setPaymentFilterState] = useState<PaymentFilter>(() => readPref("payment", PAYMENTS, "All"));
  const setPaymentFilter = (f: PaymentFilter) => {
    setPaymentFilterState(f);
    writePref("payment", f);
  };
  const [contractFilter, setContractFilterState] = useState<ContractFilter>(() =>
    readPref("contract", CONTRACTS, "All"),
  );
  const setContractFilter = (f: ContractFilter) => {
    setContractFilterState(f);
    writePref("contract", f);
  };

  const byId = new Map(dancers.map((d) => [d.id, d]));
  // A saved choreographer that was since deleted shouldn't hide every dance.
  const activeChoreographer = choreographers.some((c) => c.id === choreographer) ? choreographer : "";
  const soloOnly = paymentFilter !== "All" || contractFilter !== "All";
  const inScope = dances.filter(
    (d) =>
      (!activeChoreographer || d.choreographerId === activeChoreographer) &&
      (typeFilter === "All" || danceType(d.dancerIds.length) === typeFilter) &&
      (!soloOnly || danceType(d.dancerIds.length) === "Solo") &&
      paymentMatches(d, paymentFilter) &&
      contractMatches(d, contractFilter),
  );
  const hasSolos = dances.some((d) => danceType(d.dancerIds.length) === "Solo");
  const anyFilter = filter !== "All" || typeFilter !== "All" || !!activeChoreographer || soloOnly;
  const clearFilters = () => {
    setFilter("All");
    setTypeFilter("All");
    setChoreographer("");
    setPaymentFilter("All");
    setContractFilter("All");
  };
  const listKey = `${filter}-${typeFilter}-${activeChoreographer}-${paymentFilter}-${contractFilter}`;
  const shown = inScope.filter((d) => filter === "All" || d.progress === filter).sort(sortDances);

  const filters: { key: Progress | "All"; count: number; color: string }[] = [
    { key: "All", count: inScope.length, color: "#EDEDF0" },
    ...PROGRESS.map((p) => ({
      key: p,
      count: inScope.filter((d) => d.progress === p).length,
      color: STAGE_COLORS[p].bg,
    })),
  ];
  const info = (dance: Dance) => {
    const members = dance.dancerIds.map((id) => byId.get(id)).filter((d): d is Dancer => !!d);
    const type = danceType(dance.dancerIds.length);
    const meta = dance.dueDate ? `Due ${formatDate(dance.dueDate)}` : "No due date";
    const short =
      members.length === 1
        ? members[0].name
        : members.length > 3
          ? `${members.length} dancers`
          : members.map((m) => m.name.split(" ")[0]).join(", ");
    return { members, type, meta, short };
  };


  // Drop an mp3 on a card or row to add it as that dance's song.
  const dropProps = (dance: Dance) => ({
    onDragOver: (e: DragEvent) => {
      if (!draggingFiles(e.dataTransfer)) return;
      e.preventDefault();
      setDropTarget(dance.id);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(null);
    },
    onDrop: async (e: DragEvent) => {
      e.preventDefault();
      setDropTarget(null);
      const file = droppedSong(e.dataTransfer);
      if (!file) return;
      const progress = (percent: number | null) => setUploading((u) => ({ ...u, [dance.id]: percent }));
      progress(null);
      await onDropSong(dance, file, progress);
      setUploading((u) => {
        const rest = { ...u };
        delete rest[dance.id];
        return rest;
      });
    },
  });

  const dropClass = (dance: Dance) => (dropTarget === dance.id ? " drop-over" : "");
  const isUploading = (dance: Dance) => dance.id in uploading;
  const metaText = (dance: Dance, meta: string) => {
    if (isUploading(dance)) {
      const percent = uploading[dance.id];
      return percent === null ? "Uploading song" : `Uploading song, ${percent}%`;
    }
    return dropTarget === dance.id ? "Drop to add this song" : meta;
  };

  const uploadBar = (dance: Dance) => {
    if (!isUploading(dance)) return null;
    const percent = uploading[dance.id];
    return (
      <div
        className={`upload-bar${percent === null ? " waiting" : ""}`}
        role="progressbar"
        aria-label={`Uploading song for ${dance.name}`}
        aria-valuenow={percent ?? undefined}
      >
        <div style={{ width: `${percent ?? 0}%` }} />
      </div>
    );
  };

  const segments = (dance: Dance) => (
    <span className="segs" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{ "--n": i, ...(i <= STAGE_STEP[dance.progress] ? { background: STAGE_COLORS[dance.progress].bg } : {}) } as CSSProperties}
        />
      ))}
    </span>
  );

  const statusPicker = (dance: Dance) => (
    <label className="status-pick">
      <span key={dance.progress} className="dot pop" style={{ background: STAGE_COLORS[dance.progress].bg }} />
      <span>{dance.progress}</span>
      {saving.includes(dance.id) ? <Spinner label="Saving stage" /> : <IconSelector size={13} />}
      <select
        value={dance.progress}
        onChange={async (e) => {
          const next = e.target.value as Progress;
          setSaving((s) => [...s, dance.id]);
          try {
            await onStatus(dance, next);
          } finally {
            setSaving((s) => s.filter((id) => id !== dance.id));
          }
        }}
        aria-label={`Stage for ${dance.name}`}
      >
        {PROGRESS.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </label>
  );

  const playButton = (dance: Dance) => (
    <button
      className={`play${dance.songName ? "" : " empty"}`}
      onClick={(e) => {
        e.stopPropagation();
        onPlay(dance);
      }}
      aria-label={dance.songName ? `Play ${dance.name}` : `Add a song to ${dance.name}`}
    >
      {dance.songName ? <IconPlayerPlayFilled size={15} /> : <IconUpload size={16} />}
    </button>
  );

  // List rows already show the average age and song, so their details skip them.
  const details = (dance: Dance, members: Dancer[], inList = false) => {
    const avg = averageAge(members);
    const choreo = choreographers.find((c) => c.id === dance.choreographerId);
    const solo = members.length === 1;
    const song = dance.songTitle || dance.songName;
    // Only facts that are filled in; contract and payment always show for solos since they're tracked.
    const facts: [string, ReactNode, "wide"?][] = [];
    if (members.length > 0) {
      facts.push([
        solo ? "Dancer" : "Dancers",
        members.map((m) => {
          const age = dancerAge(m);
          return (
            <div key={m.id}>
              {m.name}
              {age !== null && <span className="faint">, {age}</span>}
            </div>
          );
        }),
      ]);
    }
    if (!solo && avg !== null && !inList) facts.push(["Avg age", avg]);
    // With only one choreographer, naming them on every card is just noise.
    if (choreo && choreographers.length > 1) facts.push(["Choreographer", choreo.name]);
    if (dance.dueDate) facts.push(["Due", formatDate(dance.dueDate)]);
    if (song && !inList) facts.push(["Song", song, "wide"]);
    if (solo) {
      facts.push(["Contract", [dance.contract ?? "Not sent", dance.contractDate && formatDate(dance.contractDate)].filter(Boolean).join(", ")]);
      facts.push([
        "Payment",
        [
          dance.payment ?? "Unpaid",
          typeof dance.amountPaid === "number" ? `$${dance.amountPaid.toLocaleString()}` : null,
          dance.paymentMethod ? `via ${dance.paymentMethod}` : null,
        ]
          .filter(Boolean)
          .join(", "),
      ]);
    }

    return (
      <div className="details">
        {facts.length > 0 && (
          <dl className="facts">
            {facts.map(([label, value, wide]) => (
              <div key={label} className={wide}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!isEmpty(dance.costume) && (
          <div className="note-block">
            <div className="note-label">Costume</div>
            <RichTextView value={dance.costume} className="notes" />
          </div>
        )}
        {!isEmpty(dance.notes) && (
          <div className="note-block">
            <div className="note-label">Notes</div>
            <RichTextView value={dance.notes} className="notes" />
          </div>
        )}
        <div className="actions">
          <button className="btn" onClick={() => onEdit(dance)}>
            <IconPencil size={13} />
            Edit
          </button>
          <DeleteButton compact label={dance.name} onDelete={() => onDelete(dance)} />
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="stat-row" aria-label="Filter by stage">
        {filters.map((f) => (
          <button key={f.key} className="stat" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            <span key={f.count} className="stat-count">
              {f.count}
            </span>
            <span className="stat-label">{f.key === "All" ? "All dances" : f.key}</span>
            <span className="stat-bar" style={{ background: f.key === "All" ? "currentColor" : f.color }} />
          </button>
        ))}
      </section>

      <div className="filter-row">
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          aria-label="Filter by type"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All types" : `${t}s`}
            </option>
          ))}
        </select>
        {choreographers.length > 1 && (
          <select
            className="filter-select"
            value={activeChoreographer}
            onChange={(e) => setChoreographer(e.target.value)}
            aria-label="Filter by choreographer"
          >
            <option value="">All choreographers</option>
            {choreographers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {(hasSolos || soloOnly) && (
          <>
            <select
              className="filter-select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              aria-label="Filter solos by payment"
            >
              {PAYMENTS.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "All payments" : p}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value as ContractFilter)}
              aria-label="Filter solos by contract"
            >
              {CONTRACTS.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All contracts" : c}
                </option>
              ))}
            </select>
          </>
        )}
        {anyFilter && (
          <button type="button" className="filter-clear" onClick={clearFilters}>
            <IconX size={14} stroke={2.4} aria-hidden />
            Clear
          </button>
        )}
      </div>

      {shown.length === 0 && (
        <div className="tile empty-state">
          {dances.length === 0 ? "Add your first dance to get started." : "No dances match these filters."}
        </div>
      )}

      {view === "cards" ? (
        <div className="grid" key={listKey}>
          {shown.map((dance, i) => {
            const { members, type } = info(dance);
            return (
              <div
                key={dance.id}
                className={`tile card${dropClass(dance)}`}
                style={{ "--i": Math.min(i, 8) } as CSSProperties}
                {...dropProps(dance)}
              >
                <div className="card-top">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card-tags">
                      <span className={`type-badge ${type.toLowerCase()}`}>{type}</span>
                      <span className="card-meta">{metaText(dance, "")}</span>
                    </div>
                    <div className="card-title">{dance.name}</div>
                  </div>
                  {playButton(dance)}
                </div>
                {uploadBar(dance)}
                {details(dance, members)}
                <div className="card-foot">
                  {statusPicker(dance)}
                  {segments(dance)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        shown.length > 0 && (
          <div className="list" key={listKey}>
            {shown.map((dance, i) => {
              const { members, short, type } = info(dance);
              const avg = averageAge(members);
              const song = dance.songTitle || dance.songName;
              return (
                <div
                  key={dance.id}
                  className={`row${dropClass(dance)}`}
                  style={{ "--i": Math.min(i, 8) } as CSSProperties}
                  {...dropProps(dance)}
                >
                  <div className="row-main">
                    <div className="row-content">
                      <div className="row-title">
                        <div>{dance.name}</div>
                        <div className="card-meta">
                          <span className={`type-badge small ${type.toLowerCase()}`}>{type}</span> {metaText(dance, "")}
                        </div>
                      </div>
                      <div className="row-sub">
                        <IconUsers size={13} />
                        {members.length ? (
                          <span>
                            {short}
                            {avg !== null && <span className="faint">, {members.length === 1 ? "age" : "avg"} {avg}</span>}
                          </span>
                        ) : (
                          <span className="faint">No dancers</span>
                        )}
                      </div>
                      <div className="row-sub">
                        <IconMusic size={13} />
                        <span className={song ? undefined : "faint"}>{song || "No song yet"}</span>
                      </div>
                      {playButton(dance)}
                    </div>
                    <div className="row-status">
                      {statusPicker(dance)}
                      {segments(dance)}
                    </div>
                  </div>
                  {uploadBar(dance)}
                  <div className="row-details">{details(dance, members, true)}</div>
                </div>
              );
            })}
          </div>
        )
      )}
    </>
  );
}
