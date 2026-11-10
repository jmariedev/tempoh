import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseCombo } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => (await getStore()).createCombo(parseCombo(await req.json())));
}
