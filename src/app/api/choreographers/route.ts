import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseChoreographer } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => (await getStore()).createChoreographer(parseChoreographer(await req.json())));
}
