// Song size limits. Signed-in songs go to Vercel Blob; demo songs pass through the server,
// which Vercel caps at 4.5 MB per request.
export const SONG_LIMIT = 100 * 1024 * 1024;
export const DEMO_SONG_LIMIT = 4 * 1024 * 1024;

/** Only links to this app's private Blob store are saved as songs. */
export const isBlobUrl = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
};

export const blobPathname = (url: string) => decodeURIComponent(new URL(url).pathname.slice(1));
