import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/storage";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const idx = data.datasets.findIndex(d => d.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Preserve HF-sourced fields, allow updating local metadata
  data.datasets[idx] = {
    ...data.datasets[idx],
    ...body,
    hfId: data.datasets[idx].hfId, // never overwrite HF ID
    hfUrl: data.datasets[idx].hfUrl,
  };
  await writeData(data);
  return NextResponse.json(data.datasets[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const data = await readData();
  data.datasets = data.datasets.filter(d => d.id !== id);
  // Remove from experiment references
  for (const e of data.experiments) {
    e.datasetIds = e.datasetIds.filter(did => did !== id);
  }
  await writeData(data);
  return NextResponse.json({ ok: true });
}
