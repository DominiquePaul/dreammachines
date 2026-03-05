import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaperCitations } from "@/lib/semantic-scholar";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json().catch(() => ({}));
  const batchSize = body.batchSize || 5;

  // Get papers that have S2 IDs to check for citing papers
  const { data: papers, error } = await supabase
    .from("research_papers")
    .select("id, title, semantic_scholar_id")
    .not("semantic_scholar_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(batchSize);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!papers?.length) return NextResponse.json({ message: "No synced papers to check", discovered: 0 });

  // Get all existing paper arxiv_ids and discovery queue arxiv_ids to avoid duplicates
  const { data: existingPapers } = await supabase
    .from("research_papers")
    .select("arxiv_id, semantic_scholar_id");
  const existingS2Ids = new Set(
    (existingPapers || []).map((p) => p.semantic_scholar_id).filter(Boolean)
  );
  const existingArxivIds = new Set(
    (existingPapers || []).map((p) => p.arxiv_id).filter(Boolean)
  );

  const { data: existingDiscovery } = await supabase
    .from("research_discovery_queue")
    .select("arxiv_id");
  const discoveryArxivIds = new Set(
    (existingDiscovery || []).map((d) => d.arxiv_id).filter(Boolean)
  );

  let totalDiscovered = 0;

  for (const paper of papers) {
    await delay(300);
    const citations = await getPaperCitations(paper.semantic_scholar_id!, 50);

    for (const citing of citations) {
      if (!citing.paperId) continue;
      // Skip if already in collection or discovery queue
      if (existingS2Ids.has(citing.paperId)) continue;
      const arxivId = citing.externalIds?.ArXiv;
      if (arxivId && (existingArxivIds.has(arxivId) || discoveryArxivIds.has(arxivId))) continue;

      // Skip papers without useful metadata
      if (!citing.title) continue;

      // Add to discovery queue
      const { error: insertError } = await supabase
        .from("research_discovery_queue")
        .upsert(
          {
            paper_title: citing.title,
            arxiv_id: arxivId || null,
            authors: citing.authors?.map((a) => a.name).join(", ") || null,
            year: citing.year || null,
            abstract: citing.abstract || null,
            citing_paper_ids: [paper.id],
            status: "unread",
          },
          { onConflict: "arxiv_id", ignoreDuplicates: true }
        );

      if (!insertError) {
        totalDiscovered++;
        if (arxivId) discoveryArxivIds.add(arxivId);
      }
    }
  }

  return NextResponse.json({
    discovered: totalDiscovered,
    papersChecked: papers.length,
  });
}
