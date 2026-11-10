"use client";

import { IconUpload } from "@tabler/icons-react";
import { useState, type DragEvent } from "react";
import { draggingFiles, droppedSong } from "@/lib/prefs";
import { DEMO_SONG_LIMIT, SONG_LIMIT } from "@/lib/songs";
import type { AppData } from "@/lib/types";

interface Props {
  mode: AppData["mode"];
  /** A percentage while uploading, null while there's no percentage yet, false when idle. */
  uploading?: number | null | false;
  /** The chosen or current song, when there is one. */
  fileName?: string | null;
  hint?: string;
  onFile: (file: File) => void;
}

const isAudio = (file: File) => file.type.startsWith("audio/") || /\.(mp3|m4a)$/i.test(file.name);

export default function SongDropzone({ mode, uploading = false, fileName, hint, onFile }: Props) {
  const [over, setOver] = useState(false);
  const [refused, setRefused] = useState("");
  const limit = mode === "demo" ? DEMO_SONG_LIMIT : SONG_LIMIT;
  const limitLabel = `${Math.round(limit / 1024 / 1024)} MB`;
  const busy = uploading !== false;

  const take = (file: File | null | undefined) => {
    if (!file) return;
    if (!isAudio(file)) return setRefused("That isn't an audio file");
    if (file.size > limit) return setRefused(`That file is over ${limitLabel}`);
    setRefused("");
    onFile(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    if (busy) return;
    const file = droppedSong(e.dataTransfer);
    if (file) take(file);
    else if (e.dataTransfer.files.length > 0) setRefused("That isn't an audio file");
  };

  return (
    <label
      className={`dropzone${over ? " over" : ""}${refused ? " refused" : ""}${busy ? " busy" : ""}`}
      onDragOver={(e) => {
        if (!draggingFiles(e.dataTransfer)) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={onDrop}
      onAnimationEnd={() => setRefused("")}
    >
      <input
        className="dropzone-input"
        type="file"
        accept="audio/*,.mp3,.m4a"
        disabled={busy}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <span className="dropzone-icon">
        <IconUpload size={18} />
      </span>
      <span className="dropzone-title">
        {busy ? "Uploading song" : over ? "Drop to add it" : (fileName ?? "Drag a song here")}
      </span>
      <span className="dropzone-sub">
        {busy
          ? uploading === null
            ? "Almost there"
            : `${uploading}%`
          : refused || hint || `MP3 or M4A, up to ${limitLabel}. Or click to choose one.`}
      </span>
      {busy && (
        <span className={`upload-bar${uploading === null ? " waiting" : ""}`}>
          <span style={{ width: `${uploading ?? 0}%` }} />
        </span>
      )}
    </label>
  );
}
