import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  searchPaperByTitle,
  getPaperByArxivId,
  getAuthorDetails,
} from "@/lib/semantic-scholar";

// Use service-level client for API routes
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Rate limiting: wait between S2 API calls
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json().catch(() => ({}));
  const batchSize = body.batchSize || 10;

  // Fetch papers that haven't been synced yet (no semantic_scholar_id) or all if force
  const query = supabase
    .from("research_papers")
    .select("id, title, arxiv_id, semantic_scholar_id, citation_count")
    .order("updated_at", { ascending: true })
    .limit(batchSize);

  if (!body.force) {
    query.is("semantic_scholar_id", null);
  }

  const { data: papers, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!papers?.length) return NextResponse.json({ message: "All papers synced", synced: 0 });

  const results: { id: string; title: string; status: string; citationCount?: number }[] = [];

  for (const paper of papers) {
    await delay(200); // ~5 req/sec to be safe

    // Try arxiv ID first, then title search
    let s2Paper = paper.arxiv_id
      ? await getPaperByArxivId(paper.arxiv_id)
      : null;

    if (!s2Paper) {
      s2Paper = await searchPaperByTitle(paper.title);
    }

    if (!s2Paper) {
      results.push({ id: paper.id, title: paper.title, status: "not_found" });
      continue;
    }

    // Update paper with S2 data
    const updates: Record<string, unknown> = {
      semantic_scholar_id: s2Paper.paperId,
      citation_count: s2Paper.citationCount || 0,
      semantic_scholar_url: s2Paper.url || null,
      updated_at: new Date().toISOString(),
    };

    // Calculate citation velocity (change since last sync)
    if (paper.citation_count && s2Paper.citationCount) {
      updates.citation_velocity = s2Paper.citationCount - paper.citation_count;
    }

    // Fill in abstract if missing
    if (s2Paper.abstract) {
      const { data: current } = await supabase
        .from("research_papers")
        .select("abstract")
        .eq("id", paper.id)
        .single();
      if (!current?.abstract) {
        updates.abstract = s2Paper.abstract;
      }
    }

    await supabase.from("research_papers").update(updates).eq("id", paper.id);

    // Update author data from S2
    if (s2Paper.authors?.length) {
      for (const s2Author of s2Paper.authors.slice(0, 5)) {
        if (!s2Author.authorId) continue;

        await delay(100);

        // Find matching author in our DB by name
        const { data: dbAuthors } = await supabase
          .from("research_authors")
          .select("id, semantic_scholar_id")
          .ilike("name", `%${s2Author.name.split(" ").pop()}%`);

        const match = dbAuthors?.find((a) =>
          !a.semantic_scholar_id || a.semantic_scholar_id === s2Author.authorId
        );

        if (match) {
          const authorUpdates: Record<string, unknown> = {
            semantic_scholar_id: s2Author.authorId,
          };
          if (s2Author.affiliations?.[0]) {
            authorUpdates.affiliation = s2Author.affiliations[0];
          }
          if (s2Author.hIndex) authorUpdates.h_index = s2Author.hIndex;
          if (s2Author.paperCount) authorUpdates.paper_count = s2Author.paperCount;
          if (s2Author.homepage) authorUpdates.homepage_url = s2Author.homepage;

          await supabase
            .from("research_authors")
            .update(authorUpdates)
            .eq("id", match.id);
        }
      }
    }

    results.push({
      id: paper.id,
      title: paper.title,
      status: "synced",
      citationCount: s2Paper.citationCount,
    });
  }

  return NextResponse.json({
    synced: results.filter((r) => r.status === "synced").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    results,
  });
}
