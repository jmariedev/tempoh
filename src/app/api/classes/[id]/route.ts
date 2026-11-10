import { handle, type IdContext } from "@/lib/api";
import { getStore } from "@/lib/store";
import { parseClass } from "@/lib/validate";

export function PATCH(req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).updateClass((await params).id, parseClass(await req.json())));
}

export function DELETE(_req: Request, { params }: IdContext) {
  return handle(async () => (await getStore()).deleteClass((await params).id));
}
