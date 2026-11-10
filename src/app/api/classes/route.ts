import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseClass } from "@/lib/validate";

export function POST(req: Request) {
  return handle(async () => (await getStore()).createClass(parseClass(await req.json())));
}
