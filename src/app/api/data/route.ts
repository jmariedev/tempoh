import { connection } from "next/server";
import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function GET() {
  // Always read fresh data instead of prerendering this route at build time.
  await connection();
  return handle(async () => {
    const store = await getStore();
    return { mode: store.mode, who: store.who, ...(await store.load()) };
  });
}
