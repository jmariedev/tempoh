import { upload } from "@vercel/blob/client";
import { DEMO_SONG_LIMIT, SONG_LIMIT } from "./songs";
import type { AppData } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  // A signed-out browser (expired session or removed Notion connection) goes back to the welcome page.
  // This runs outside React, so a full page load is the only option here.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (res.status === 401 && !url.startsWith("/api/auth/")) window.location.assign("/welcome");
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: unknown) => request<T>(url, json("POST", data)),
  patch: <T>(url: string, data: unknown) => request<T>(url, json("PATCH", data)),
  del: (url: string) => request(url, { method: "DELETE" }),
  upload: (url: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request(url, { method: "POST", body: form });
  },
};

const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** Uploads a song: straight to Vercel Blob when signed in, through the server in the demo. */
export async function uploadSong(
  danceId: string,
  file: File,
  mode: AppData["mode"],
  onProgress?: (percent: number | null) => void,
) {
  if (mode === "demo") {
    if (file.size > DEMO_SONG_LIMIT) {
      throw new Error(`Demo songs can be up to ${mb(DEMO_SONG_LIMIT)}. Sign in with Notion to add bigger ones.`);
    }
    // Demo songs are small and go through the server, so there's no percentage to show.
    onProgress?.(null);
    return api.upload(`/api/dances/${danceId}/song`, file);
  }
  if (file.size > SONG_LIMIT) throw new Error(`Songs can be up to ${mb(SONG_LIMIT)}`);
  onProgress?.(0);
  const blob = await upload(`songs/${danceId}/${file.name}`, file, {
    access: "private",
    handleUploadUrl: `/api/dances/${danceId}/song/upload`,
    contentType: file.type || "audio/mpeg",
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress?.(Math.min(99, Math.round(percentage))),
  });
  // The last step saves the song to Notion, which has no percentage either.
  onProgress?.(null);
  await api.post(`/api/dances/${danceId}/song`, { url: blob.url, name: file.name });
}
