import { handle, type IdContext } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseDancer } from "@/lib/validate";

export function PATCH(req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).updateDancer((await params).id, parseDancer(await req.json())));
}

export function DELETE(_req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).deleteDancer((await params).id));
}
