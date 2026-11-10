import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseDance } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => (await getStore()).createDance(parseDance(await req.json())));
}
