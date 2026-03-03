import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readData, writeData } from "@/lib/storage";
import type { Tag } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const tag: Tag = {
    id: uuid(),
    name: body.name || "New Tag",
    color: body.color || "#6B7280",
    category: body.category || "custom",
  };
  data.tags.push(tag);
  await writeData(data);
  return NextResponse.json(tag);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const idx = data.tags.findIndex(t => t.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  data.tags[idx] = { ...data.tags[idx], ...body };
  await writeData(data);
  return NextResponse.json(data.tags[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const data = await readData();
  data.tags = data.tags.filter(t => t.id !== id);
  // Remove tag from all entities
  for (const d of data.datasets) d.tags = d.tags.filter(t => t !== id);
  for (const m of data.models) m.tags = m.tags.filter(t => t !== id);
  for (const h of data.hypotheses) h.tags = h.tags.filter(t => t !== id);
  await writeData(data);
  return NextResponse.json({ ok: true });
}
