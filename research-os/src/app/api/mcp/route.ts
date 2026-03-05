import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

// MCP-like API for exposing Research OS data to Claude Code and other clients
// Tools: get_capsule_context, get_paper_notes, search_papers, list_papers_by_tag

export async function POST(request: Request) {
  const { tool, params } = await request.json();
  const supabase = getServerSupabase(request.headers.get("authorization"));

  switch (tool) {
    case "get_capsule_context": {
      const { tag_id, tag_name } = params;
      let tagId = tag_id;

      if (!tagId && tag_name) {
        const { data } = await supabase
          .from("research_tags")
          .select("id")
          .ilike("name", `%${tag_name}%`)
          .single();
        tagId = data?.id;
      }

      if (!tagId) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

      const { data: tag } = await supabase
        .from("research_tags")
        .select("name, description")
        .eq("id", tagId)
        .single();

      const { data: paperTags } = await supabase
        .from("research_paper_tags")
        .select("paper_id")
        .eq("tag_id", tagId);

      if (!paperTags?.length) return NextResponse.json({ context: `# Capsule: ${tag?.name}\n\nNo papers in this capsule.` });

      const paperIds = paperTags.map((pt) => pt.paper_id);
      const { data: papers } = await supabase
        .from("research_papers")
        .select("id, title, year, one_liner, abstract, category")
        .in("id", paperIds);

      const { data: notes } = await supabase
        .from("research_notes")
        .select("paper_id, content, granularity")
        .in("paper_id", paperIds);

      let context = `# Capsule: ${tag?.name}\n${tag?.description || ""}\n\n## Papers (${papers?.length || 0})\n\n`;

      (papers || []).forEach((p) => {
        context += `### ${p.title} (${p.year || "N/A"}, ${p.category})\n`;
        if (p.one_liner) context += `**Summary:** ${p.one_liner}\n`;
        if (p.abstract) context += `**Abstract:** ${p.abstract}\n`;

        const paperNotes = (notes || []).filter((n) => n.paper_id === p.id);
        paperNotes.forEach((n) => {
          context += `**${n.granularity === "oneliner" ? "One-liner" : "Notes"}:** ${n.content}\n`;
        });
        context += "\n";
      });

      return NextResponse.json({ context });
    }

    case "get_paper_notes": {
      const { slug } = params;
      const { data: paper } = await supabase
        .from("research_papers")
        .select("id, title, year, one_liner, abstract, category, citation_count")
        .eq("slug", slug)
        .single();

      if (!paper) return NextResponse.json({ error: "Paper not found" }, { status: 404 });

      const { data: notes } = await supabase
        .from("research_notes")
        .select("content, granularity")
        .eq("paper_id", paper.id);

      return NextResponse.json({ paper, notes: notes || [] });
    }

    case "search_papers": {
      const { query } = params;
      const { data: papers } = await supabase
        .from("research_papers")
        .select("id, slug, title, year, one_liner, category")
        .or(`title.ilike.%${query}%,one_liner.ilike.%${query}%,abstract.ilike.%${query}%`)
        .limit(20);

      return NextResponse.json({ papers: papers || [] });
    }

    case "list_papers_by_tag": {
      const { tag_name } = params;
      const { data: tag } = await supabase
        .from("research_tags")
        .select("id, name")
        .ilike("name", `%${tag_name}%`)
        .single();

      if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

      const { data: paperTags } = await supabase
        .from("research_paper_tags")
        .select("paper_id")
        .eq("tag_id", tag.id);

      const paperIds = (paperTags || []).map((pt) => pt.paper_id);
      if (!paperIds.length) return NextResponse.json({ tag: tag.name, papers: [] });

      const { data: papers } = await supabase
        .from("research_papers")
        .select("slug, title, year, one_liner, category")
        .in("id", paperIds);

      return NextResponse.json({ tag: tag.name, papers: papers || [] });
    }

    default:
      return NextResponse.json(
        {
          error: "Unknown tool",
          available_tools: [
            "get_capsule_context",
            "get_paper_notes",
            "search_papers",
            "list_papers_by_tag",
          ],
        },
        { status: 400 }
      );
  }
}
