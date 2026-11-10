import { NextResponse } from "next/server";
import { handle, type IdContext } from "@/lib/api";
import { getStore } from "@/lib/store";
import { currentDemoId } from "@/lib/session";
import { demoSongBytes } from "@/lib/store/demo";
import { isBlobUrl } from "@/lib/songs";

export async function GET(req: Request, { params }: IdContext) {
  const { id } = await params;
  if (new URL(req.url).searchParams.has("raw")) {
    const demoId = await currentDemoId();
    const song = demoId ? demoSongBytes(demoId, id) : null;
    if (!song) return new NextResponse(null, { status: 404 });
    // Browsers need byte ranges to know a song's length and to seek within it.
    const size = song.data.byteLength;
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
    const headers = { "Content-Type": song.type, "Accept-Ranges": "bytes" };
    if (!range) {
      return new NextResponse(song.data, { headers: { ...headers, "Content-Length": String(size) } });
    }
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    return new NextResponse(song.data.slice(start, end + 1), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }
  return handle(async () => ({ song: await (await getStore()).songSource(id) }));
}

// Signed in: saves a song the browser already uploaded to Vercel Blob. Demo: receives the file itself.
export function POST(req: Request, { params }: IdContext) {
  return handle(async () => {
    const { id } = await params;
    const store = await getStore();
    if (req.headers.get("content-type")?.includes("application/json")) {
      const { url, name } = (await req.json()) as { url?: unknown; name?: unknown };
      if (typeof url !== "string" || !isBlobUrl(url)) throw new Error("That song link isn't valid");
      return store.linkSong(id, { url, name: typeof name === "string" && name ? name : "Song" });
    }
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new Error("No file was sent");
    await store.uploadSong(id, file);
  });
}

export function DELETE(_req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).removeSong((await params).id));
}
