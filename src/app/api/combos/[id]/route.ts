import { handle, type IdContext } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseCombo } from "@/lib/validate";

export function PATCH(req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).updateCombo((await params).id, parseCombo(await req.json())));
}

export function DELETE(_req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).deleteCombo((await params).id));
}
