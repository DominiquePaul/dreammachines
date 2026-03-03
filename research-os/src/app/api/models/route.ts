import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/storage";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const idx = data.models.findIndex(m => m.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  data.models[idx] = {
    ...data.models[idx],
    ...body,
    hfId: data.models[idx].hfId,
    hfUrl: data.models[idx].hfUrl,
  };
  await writeData(data);
  return NextResponse.json(data.models[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const data = await readData();
  data.models = data.models.filter(m => m.id !== id);
  for (const e of data.experiments) {
    e.modelIds = e.modelIds.filter(mid => mid !== id);
  }
  await writeData(data);
  return NextResponse.json({ ok: true });
}
