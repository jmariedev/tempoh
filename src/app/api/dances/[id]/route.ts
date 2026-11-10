import { handle, type IdContext } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseDance } from "@/lib/validate";

export function PATCH(req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).updateDance((await params).id, parseDance(await req.json())));
}

export function DELETE(_req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).deleteDance((await params).id));
}
