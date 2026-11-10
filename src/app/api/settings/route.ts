import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseSettings } from "@/lib/validate";

export function PATCH(req: Request) {
  return handle(async () => (await getStore()).saveSettings(parseSettings(await req.json())));
}
