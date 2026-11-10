// Small per-browser settings (tab, view, filters). Storage can be blocked, so every read and write is guarded.

export function readPref<T extends string>(key: string, allowed: readonly T[] | null, fallback: T): T {
  try {
    const saved = localStorage.getItem(`choreo-hq:${key}`);
    if (saved !== null && (!allowed || (allowed as readonly string[]).includes(saved))) return saved as T;
  } catch {}
  return fallback;
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`choreo-hq:${key}`, value);
  } catch {}
}

/** The first audio file in a drag and drop, if there is one. */
export function droppedSong(data: DataTransfer): File | null {
  return [...data.files].find((f) => f.type.startsWith("audio/") || /\.mp3$/i.test(f.name)) ?? null;
}

export const draggingFiles = (data: DataTransfer) => data.types.includes("Files");
