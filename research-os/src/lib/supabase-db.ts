import { supabase } from "./supabase";
import type { Paper, Author, Tag, Note, PaperEdge } from "./types";

// ── Fetch all papers with joined authors ──────────────────────────────
export async function fetchPapers(): Promise<Paper[]> {
  const { data: papers, error } = await supabase
    .from("research_papers")
    .select("*")
    .order("year", { ascending: true, nullsFirst: false });

  if (error) throw error;

  // Fetch authors for all papers
  const { data: paperAuthors } = await supabase
    .from("research_paper_authors")
    .select("paper_id, author_id, position");

  const { data: authors } = await supabase
    .from("research_authors")
    .select("*");

  // Fetch tags for all papers
  const { data: paperTags } = await supabase
    .from("research_paper_tags")
    .select("paper_id, tag_id");

  const { data: tags } = await supabase
    .from("research_tags")
    .select("*");

  const authorMap = new Map((authors || []).map((a) => [a.id, a]));
  const tagMap = new Map((tags || []).map((t) => [t.id, t]));

  return (papers || []).map((p) => ({
    ...p,
    authors: (paperAuthors || [])
      .filter((pa) => pa.paper_id === p.id)
      .sort((a, b) => a.position - b.position)
      .map((pa) => authorMap.get(pa.author_id))
      .filter(Boolean) as Author[],
    tags: (paperTags || [])
      .filter((pt) => pt.paper_id === p.id)
      .map((pt) => tagMap.get(pt.tag_id))
      .filter(Boolean) as Tag[],
  }));
}

// ── Fetch single paper by slug ────────────────────────────────────────
export async function fetchPaperBySlug(slug: string): Promise<Paper | null> {
  const { data: paper, error } = await supabase
    .from("research_papers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !paper) return null;

  const { data: paperAuthors } = await supabase
    .from("research_paper_authors")
    .select("paper_id, author_id, position")
    .eq("paper_id", paper.id);

  const authorIds = (paperAuthors || []).map((pa) => pa.author_id);
  const { data: authors } = authorIds.length
    ? await supabase.from("research_authors").select("*").in("id", authorIds)
    : { data: [] };

  const { data: paperTags } = await supabase
    .from("research_paper_tags")
    .select("paper_id, tag_id")
    .eq("paper_id", paper.id);

  const tagIds = (paperTags || []).map((pt) => pt.tag_id);
  const { data: tags } = tagIds.length
    ? await supabase.from("research_tags").select("*").in("id", tagIds)
    : { data: [] };

  const { data: notes } = await supabase
    .from("research_notes")
    .select("*")
    .eq("paper_id", paper.id);

  const authorMap = new Map((authors || []).map((a) => [a.id, a]));
  const tagMap = new Map((tags || []).map((t) => [t.id, t]));

  return {
    ...paper,
    authors: (paperAuthors || [])
      .sort((a, b) => a.position - b.position)
      .map((pa) => authorMap.get(pa.author_id))
      .filter(Boolean) as Author[],
    tags: (paperTags || [])
      .map((pt) => tagMap.get(pt.tag_id))
      .filter(Boolean) as Tag[],
    notes: (notes || []) as Note[],
  };
}

// ── Fetch edges for lineage graph ─────────────────────────────────────
export async function fetchEdges(): Promise<PaperEdge[]> {
  const { data, error } = await supabase
    .from("research_paper_edges")
    .select("*");
  if (error) throw error;
  return data || [];
}

// ── Tags CRUD ─────────────────────────────────────────────────────────
export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("research_tags")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function createTag(
  name: string,
  color: string,
  description?: string
): Promise<Tag> {
  const { data, error } = await supabase
    .from("research_tags")
    .insert({ name, color, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTag(
  id: string,
  updates: Partial<Pick<Tag, "name" | "color" | "description">>
): Promise<void> {
  const { error } = await supabase
    .from("research_tags")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from("research_tags")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Paper-Tag assignment ──────────────────────────────────────────────
export async function addTagToPaper(
  paperId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from("research_paper_tags")
    .insert({ paper_id: paperId, tag_id: tagId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeTagFromPaper(
  paperId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from("research_paper_tags")
    .delete()
    .eq("paper_id", paperId)
    .eq("tag_id", tagId);
  if (error) throw error;
}

// ── Notes CRUD ────────────────────────────────────────────────────────
export async function upsertNote(
  paperId: string,
  content: string,
  granularity: "oneliner" | "rich" = "rich"
): Promise<Note> {
  // Check if note exists
  const { data: existing } = await supabase
    .from("research_notes")
    .select("id")
    .eq("paper_id", paperId)
    .eq("granularity", granularity)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("research_notes")
      .update({ content })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("research_notes")
      .insert({ paper_id: paperId, content, granularity })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ── Paper CRUD ────────────────────────────────────────────────────────
export async function updatePaper(
  id: string,
  updates: Partial<Pick<Paper, "title" | "year" | "arxiv_id" | "abstract" | "one_liner" | "category" | "slug">>
): Promise<void> {
  const { error } = await supabase
    .from("research_papers")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function createPaper(paper: {
  title: string;
  slug?: string;
  year?: number;
  category: string;
  one_liner?: string;
  arxiv_id?: string;
  abstract?: string;
}): Promise<Paper> {
  const { data, error } = await supabase
    .from("research_papers")
    .insert(paper)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Fetch papers by tag ───────────────────────────────────────────────
export async function fetchPapersByTag(tagId: string): Promise<Paper[]> {
  const { data: paperTags } = await supabase
    .from("research_paper_tags")
    .select("paper_id")
    .eq("tag_id", tagId);

  if (!paperTags?.length) return [];

  const paperIds = paperTags.map((pt) => pt.paper_id);
  const { data: papers, error } = await supabase
    .from("research_papers")
    .select("*")
    .in("id", paperIds)
    .order("year", { ascending: true });

  if (error) throw error;

  // Fetch authors
  const { data: pa } = await supabase
    .from("research_paper_authors")
    .select("paper_id, author_id, position")
    .in("paper_id", paperIds);

  const authorIds = [...new Set((pa || []).map((x) => x.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("research_authors").select("*").in("id", authorIds)
    : { data: [] };

  const authorMap = new Map((authors || []).map((a) => [a.id, a]));

  return (papers || []).map((p) => ({
    ...p,
    authors: (pa || [])
      .filter((x) => x.paper_id === p.id)
      .sort((a, b) => a.position - b.position)
      .map((x) => authorMap.get(x.author_id))
      .filter(Boolean) as Author[],
    tags: [],
  }));
}
