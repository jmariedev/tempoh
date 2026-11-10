import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseDancer } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => (await getStore()).createDancer(parseDancer(await req.json())));
}
