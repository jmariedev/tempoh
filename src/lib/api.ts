import { APIResponseError } from "@notionhq/client";
import { NextResponse } from "next/server";
import { SignedOutError } from "./store";

export type IdContext = { params: Promise<{ id: string }> };

/** Runs a route handler body and turns thrown errors into a JSON error response. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    return NextResponse.json(result ?? { ok: true });
  } catch (err) {
    if (err instanceof SignedOutError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    // Notion says the token is no good, for example after someone removes the connection.
    if (err instanceof APIResponseError && err.code === "unauthorized") {
      return NextResponse.json({ error: "Your Notion connection ended. Sign in again." }, { status: 401 });
    }
    console.error(err);
    const message =
      err instanceof APIResponseError
        ? `Notion: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
