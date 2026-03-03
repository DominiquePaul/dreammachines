import { NextResponse } from "next/server";
import { readData, writeData } from "@/lib/storage";
import { syncFromHuggingFace } from "@/lib/hf-sync";
import { seedData } from "@/lib/seed";

export async function POST() {
  try {
    let data = await readData();
    data = await syncFromHuggingFace(data);
    data = seedData(data);
    await writeData(data);
    return NextResponse.json({ ok: true, lastSynced: data.lastSynced });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
