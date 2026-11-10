"use client";

import { Spinner } from "./Loading";
import {
  IconMusic,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRewindBackward5,
  IconRewindForward5,
} from "@tabler/icons-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { api, uploadSong } from "@/lib/client";
import { draggingFiles, droppedSong } from "@/lib/prefs";
import { STAGE_COLORS } from "@/lib/derive";
import type { AppData, Progress } from "@/lib/types";
import Modal from "./Modal";
import SongDropzone from "./SongDropzone";

interface Props {
  mode: AppData["mode"];
  /** A dance or a combo: anything with a song. Combos have no stage. */
  dance: { id: string; name: string; songName: string | null; progress?: Progress };
  subtitle: string;
  onClose: () => void;
  onUploaded: () => void;
}

const fmt = (s: number) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "--:--";

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

export default function PlayerModal({ mode, dance, subtitle, onClose, onUploaded }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "none" | "error">("loading");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  // A percentage while uploading, null while there's no percentage yet, false when idle.
  const [uploading, setUploading] = useState<number | null | false>(false);
  const [reload, setReload] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ song: { url: string } | null }>(`/api/dances/${dance.id}/song`)
      .then(({ song }) => {
        if (cancelled) return;
        setSrc(song?.url ?? null);
        setStatus(song ? "ready" : "none");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [dance.id, reload]);

  const seekTo = (seconds: number) => {
    const el = audio.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(duration, Math.max(0, seconds));
    setTime(el.currentTime);
  };

  const seekFromPointer = (e: PointerEvent) => {
    const rect = bar.current?.getBoundingClientRect();
    if (!rect) return;
    seekTo(((e.clientX - rect.left) / rect.width) * duration);
  };

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) el.play().catch((e: Error) => setError(e.message));
    else el.pause();
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(null);
    setError("");
    try {
      await uploadSong(dance.id, file, mode, setUploading);
      onUploaded();
      setStatus("loading");
      setReload((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const stage = dance.progress ? STAGE_COLORS[dance.progress] : null;
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <Modal title={dance.name} subtitle={subtitle} onClose={onClose} wide>
      <div
        className={`drop-zone${over ? " drop-over" : ""}`}
        onDragOver={(e) => {
          if (!draggingFiles(e.dataTransfer)) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = droppedSong(e.dataTransfer);
          if (file) upload(file);
          else setError("Drop an mp3 file to add it.");
        }}
      >
      {status === "none" ? (
        <SongDropzone mode={mode} uploading={uploading} onFile={upload} />
      ) : (
        <>
          <div className="track">
            <div className="track-icon">
              <IconMusic size={18} />
            </div>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dance.songName ?? "No song yet"}
            </span>
            <label className="btn" style={{ flexShrink: 0 }}>
              {uploading !== false ? `Uploading${uploading === null ? "" : ` ${uploading}%`}` : "Replace"}
              <input
                type="file"
                accept="audio/*,.mp3,.m4a"
                hidden
                disabled={uploading !== false}
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
          </div>
          {uploading !== false && (
            <div className={`upload-bar${uploading === null ? " waiting" : ""}`} role="progressbar" aria-label="Uploading song">
              <div style={{ width: `${uploading ?? 0}%` }} />
            </div>
          )}
        </>
      )}

      {status === "loading" && (
        <div className="song-loading" role="status">
          <span className="song-loading-icon">
            <Spinner />
          </span>
          <span className="song-loading-text">
            <span className="song-loading-title">Loading song</span>
            <span className="song-loading-sub">Getting it ready to play</span>
          </span>
          <span className="song-loading-bar" aria-hidden="true">
            <span />
          </span>
        </div>
      )}
      {status === "ready" && over && <p className="drop-hint">Drop to replace the song.</p>}

      {status === "ready" && src && (
        <>
          <audio
            ref={audio}
            src={src}
            preload="metadata"
            onLoadedMetadata={(e) => setDuration(finite(e.currentTarget.duration))}
            onDurationChange={(e) => setDuration(finite(e.currentTarget.duration))}
            onTimeUpdate={(e) => !dragging && setTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => {
              setError("This song couldn't be played. Try uploading it again.");
            }}
          />
          <div
            className={`seek${dragging ? " dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label="Song position"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={fmt(time)}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
              seekFromPointer(e);
            }}
            onPointerMove={(e) => dragging && seekFromPointer(e)}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") seekTo(time + 5);
              if (e.key === "ArrowLeft") seekTo(time - 5);
            }}
          >
            <div className="seek-bar" ref={bar}>
              <div className="seek-fill" style={{ width: `${pct}%` }} />
              <div className="seek-thumb" style={{ left: `${pct}%` }} />
            </div>
          </div>
          <div className="times">
            <span>{fmt(time)}</span>
            <span>{fmt(duration)}</span>
          </div>
          <div className="controls">
            <button className="skip" onClick={() => seekTo(time - 5)} aria-label="Back 5 seconds">
              <IconRewindBackward5 size={26} />
            </button>
            <button className="big-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <IconPlayerPauseFilled size={22} /> : <IconPlayerPlayFilled size={22} />}
            </button>
            <button className="skip" onClick={() => seekTo(time + 5)} aria-label="Forward 5 seconds">
              <IconRewindForward5 size={26} />
            </button>
          </div>
        </>
      )}

      {error && <p className="error">{error}</p>}
      </div>

      {stage && (
        <div className="player-stage">
          <span className="dot" style={{ background: stage.bg }} />
          {dance.progress}
        </div>
      )}
    </Modal>
  );
}
