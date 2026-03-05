import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { messages, sessionId, tagId, systemPrompt } = await request.json();
  const supabase = getSupabase();
  const client = new Anthropic({ apiKey });

  // Build context from capsule if tagId provided
  let context = "";
  if (tagId) {
    const { data: tag } = await supabase
      .from("research_tags")
      .select("name, description")
      .eq("id", tagId)
      .single();

    const { data: paperTags } = await supabase
      .from("research_paper_tags")
      .select("paper_id")
      .eq("tag_id", tagId);

    if (paperTags?.length) {
      const paperIds = paperTags.map((pt) => pt.paper_id);
      const { data: papers } = await supabase
        .from("research_papers")
        .select("title, year, one_liner, abstract, category")
        .in("id", paperIds);

      const { data: notes } = await supabase
        .from("research_notes")
        .select("paper_id, content, granularity")
        .in("paper_id", paperIds);

      const notesByPaper = new Map<string, string[]>();
      (notes || []).forEach((n) => {
        const arr = notesByPaper.get(n.paper_id) || [];
        arr.push(`[${n.granularity}] ${n.content}`);
        notesByPaper.set(n.paper_id, arr);
      });

      context = `\n\n## Research Context: Capsule "${tag?.name || "Unknown"}"\n${tag?.description || ""}\n\n### Papers in this capsule:\n`;
      (papers || []).forEach((p) => {
        context += `\n**${p.title}** (${p.year || "N/A"}, ${p.category})\n`;
        if (p.one_liner) context += `Summary: ${p.one_liner}\n`;
        if (p.abstract) context += `Abstract: ${p.abstract}\n`;
      });
    }
  }

  const system =
    (systemPrompt || "You are a research assistant for Dream Machines, a robotics company. You help analyze research papers, identify patterns across papers, and provide insights about reinforcement learning, world models, robotics, and related techniques. Be concise and technical.") +
    context;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save messages to DB if sessionId provided
    if (sessionId) {
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg) {
        await supabase.from("research_chat_messages").insert({
          session_id: sessionId,
          role: "user",
          content: lastUserMsg.content,
        });
      }
      await supabase.from("research_chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantMessage,
      });

      // Update session title from first message
      if (messages.length === 1) {
        const title =
          lastUserMsg.content.slice(0, 60) +
          (lastUserMsg.content.length > 60 ? "..." : "");
        await supabase
          .from("research_chat_sessions")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", sessionId);
      }
    }

    return NextResponse.json({ content: assistantMessage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
