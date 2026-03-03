import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readData, writeData } from "@/lib/storage";
import type { Hypothesis } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const now = new Date().toISOString();
  const hypothesis: Hypothesis = {
    id: uuid(),
    title: body.title || "New Hypothesis",
    description: body.description || "",
    status: body.status || "exploring",
    experimentIds: body.experimentIds || [],
    tags: body.tags || [],
    createdAt: now,
    updatedAt: now,
  };
  data.hypotheses.push(hypothesis);
  await writeData(data);
  return NextResponse.json(hypothesis);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const idx = data.hypotheses.findIndex(h => h.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  data.hypotheses[idx] = { ...data.hypotheses[idx], ...body, updatedAt: new Date().toISOString() };
  await writeData(data);
  return NextResponse.json(data.hypotheses[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const data = await readData();
  data.hypotheses = data.hypotheses.filter(h => h.id !== id);
  // Also remove associated experiments
  data.experiments = data.experiments.filter(e => e.hypothesisId !== id);
  await writeData(data);
  return NextResponse.json({ ok: true });
}
