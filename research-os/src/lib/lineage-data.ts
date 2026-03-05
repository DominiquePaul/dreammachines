import papersJson from "@/data/papers.json";

export interface PaperNode {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  authors: string;
  year: number | null;
  oneLiner: string;
}

export interface Edge {
  source: string;
  target: string;
}

// Build papers record from JSON
const rawPapers = papersJson.papers as Record<
  string,
  {
    title: string;
    slug: string | null;
    category: string;
    authors: string;
    year: number | null;
    oneLiner: string;
  }
>;

export const papers: Record<string, PaperNode> = {};
for (const [key, val] of Object.entries(rawPapers)) {
  papers[key] = {
    id: key,
    title: val.title,
    slug: val.slug,
    category: val.category,
    authors: val.authors,
    year: val.year,
    oneLiner: val.oneLiner,
  };
}

export const edges: Edge[] = papersJson.edges as Edge[];
