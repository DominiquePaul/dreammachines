// Semantic Scholar API client
// Free API: 100 requests/sec, no auth required (but API key gets higher limits)

const S2_BASE = "https://api.semanticscholar.org/graph/v1";

interface S2Paper {
  paperId: string;
  externalIds?: { ArXiv?: string; DOI?: string };
  title: string;
  year?: number;
  abstract?: string;
  citationCount?: number;
  influentialCitationCount?: number;
  citations?: S2Citation[];
  references?: S2Citation[];
  authors?: S2Author[];
  url?: string;
}

interface S2Citation {
  paperId: string;
  title?: string;
  year?: number;
  externalIds?: { ArXiv?: string };
  authors?: { authorId: string; name: string }[];
  abstract?: string;
  citationCount?: number;
}

interface S2Author {
  authorId: string;
  name: string;
  affiliations?: string[];
  hIndex?: number;
  paperCount?: number;
  homepage?: string;
}

const PAPER_FIELDS = "paperId,externalIds,title,year,abstract,citationCount,influentialCitationCount,url,authors.authorId,authors.name,authors.affiliations,authors.hIndex,authors.paperCount,authors.homepage";

async function s2Fetch<T>(path: string): Promise<T | null> {
  const headers: Record<string, string> = {};
  const apiKey = process.env.S2_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(`${S2_BASE}${path}`, { headers });
  if (!res.ok) {
    console.error(`S2 API error: ${res.status} for ${path}`);
    return null;
  }
  return res.json();
}

export async function searchPaperByTitle(title: string): Promise<S2Paper | null> {
  const res = await fetch(
    `${S2_BASE}/paper/search?query=${encodeURIComponent(title)}&limit=1&fields=${PAPER_FIELDS}`,
    {
      headers: process.env.S2_API_KEY ? { "x-api-key": process.env.S2_API_KEY } : {},
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

export async function getPaperByArxivId(arxivId: string): Promise<S2Paper | null> {
  return s2Fetch<S2Paper>(`/paper/ArXiv:${arxivId}?fields=${PAPER_FIELDS}`);
}

export async function getPaperById(s2Id: string): Promise<S2Paper | null> {
  return s2Fetch<S2Paper>(`/paper/${s2Id}?fields=${PAPER_FIELDS}`);
}

export async function getPaperCitations(s2Id: string, limit = 100): Promise<S2Citation[]> {
  const res = await s2Fetch<{ data: S2Citation[] }>(
    `/paper/${s2Id}/citations?fields=paperId,title,year,externalIds,authors,abstract,citationCount&limit=${limit}`
  );
  return res?.data || [];
}

export async function getAuthorDetails(authorId: string): Promise<S2Author | null> {
  return s2Fetch<S2Author>(
    `/author/${authorId}?fields=authorId,name,affiliations,hIndex,paperCount,homepage`
  );
}

export type { S2Paper, S2Citation, S2Author };
