import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/session";
import { SONG_LIMIT } from "@/lib/songs";

// Gives the browser a short-lived token to upload a song straight to Vercel Blob.
// Songs skip this server because Vercel caps request bodies at 4.5 MB.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await currentAccount())) throw new Error("Sign in with Notion to upload songs");
        if (!pathname.startsWith("songs/")) throw new Error("Songs only");
        return { allowedContentTypes: ["audio/*"], maximumSizeInBytes: SONG_LIMIT, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
