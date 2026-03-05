import papersJson from "@/data/papers.json";

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

// Category mapping for the old sidebar
const categoryMap: Record<string, string> = {
  rl: "standard-rl",
  wm: "world-models",
  robotics: "robotics",
  technique: "techniques",
};

const iconClassMap: Record<string, string> = {
  rl: "rl",
  wm: "wm",
  robotics: "robotics",
  technique: "other",
};

export interface Method {
  slug: string;
  title: string;
  abbrev: string;
  category: string;
  iconClass: string;
  year: number;
  authors: string;
  description: string;
  tags: string[];
}

export const methods: Method[] = Object.entries(rawPapers)
  .filter(([, p]) => p.slug !== null)
  .map(([key, p]) => ({
    slug: p.slug!,
    title: p.title,
    abbrev: key.toUpperCase().slice(0, 4),
    category: categoryMap[p.category] || p.category,
    iconClass: iconClassMap[p.category] || "other",
    year: p.year || 0,
    authors: p.authors,
    description: p.oneLiner,
    tags: [p.category],
  }));

export interface Category {
  id: string;
  title: string;
}

export const categories: Category[] = [
  { id: "standard-rl", title: "Standard RL" },
  { id: "world-models", title: "World Models" },
  { id: "robotics", title: "Robotics Concepts" },
  { id: "techniques", title: "Techniques" },
];

export function getMethodsByCategory(categoryId: string): Method[] {
  return methods
    .filter((m) => m.category === categoryId)
    .sort((a, b) => a.year - b.year);
}
