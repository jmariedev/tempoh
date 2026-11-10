import { handle, type IdContext } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseChoreographer } from "@/lib/validate";

export function PATCH(req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).updateChoreographer((await params).id, parseChoreographer(await req.json())));
}

export function DELETE(_req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).deleteChoreographer((await params).id));
}
