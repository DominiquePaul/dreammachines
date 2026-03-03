import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readData, writeData } from "@/lib/storage";
import type { Experiment } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const now = new Date().toISOString();
  const experiment: Experiment = {
    id: uuid(),
    name: body.name || "New Experiment",
    hypothesisId: body.hypothesisId || "",
    datasetIds: body.datasetIds || [],
    modelIds: body.modelIds || [],
    status: body.status || "planned",
    notes: body.notes || "",
    results: body.results || "",
    createdAt: now,
    updatedAt: now,
  };
  data.experiments.push(experiment);
  // Link to hypothesis
  const hyp = data.hypotheses.find(h => h.id === experiment.hypothesisId);
  if (hyp && !hyp.experimentIds.includes(experiment.id)) {
    hyp.experimentIds.push(experiment.id);
  }
  await writeData(data);
  return NextResponse.json(experiment);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  const idx = data.experiments.findIndex(e => e.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  data.experiments[idx] = { ...data.experiments[idx], ...body, updatedAt: new Date().toISOString() };
  await writeData(data);
  return NextResponse.json(data.experiments[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const data = await readData();
  data.experiments = data.experiments.filter(e => e.id !== id);
  // Remove from hypothesis references
  for (const h of data.hypotheses) {
    h.experimentIds = h.experimentIds.filter(eid => eid !== id);
  }
  await writeData(data);
  return NextResponse.json({ ok: true });
}
