"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useResearch } from "@/components/Shell";
import { fetchPapersByTag } from "@/lib/supabase-db";
import { CATEGORIES } from "@/lib/types";
import type { Paper, Tag } from "@/lib/types";

export default function CapsulePage() {
  const params = useParams();
  const tagId = params.tagId as string;
  const { tags, papers: allPapers } = useResearch();
  const [capsulePapers, setCapsulePapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const tag = useMemo(() => tags.find((t) => t.id === tagId), [tags, tagId]);

  useEffect(() => {
    fetchPapersByTag(tagId).then((p) => {
      setCapsulePapers(p);
      setLoading(false);
    });
  }, [tagId]);

  const exportContext = () => {
    if (capsulePapers.length === 0) return;

    const lines = [
      `# Capsule: ${tag?.name || "Unknown Tag"}`,
      `${capsulePapers.length} papers\n`,
      "## Papers\n",
      ...capsulePapers.map(
        (p) =>
          `- **${p.title}** (${p.authors?.map((a) => a.name).join(", ") || "Unknown"}, ${p.year || "N/A"}): ${p.one_liner || "No summary"}`
      ),
      "",
    ];

    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading capsule...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Link href="/" className="paper-detail__back">← Back to collection</Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        {tag && (
          <span style={{
            display: "inline-block",
            width: 12, height: 12,
            borderRadius: "50%",
            background: tag.color,
          }} />
        )}
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--text-heading)" }}>
          {tag?.name || "Capsule"}
        </h1>
      </div>

      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
        {capsulePapers.length} paper{capsulePapers.length !== 1 ? "s" : ""} in this capsule
      </p>

      {/* Export Context */}
      <button
        onClick={exportContext}
        style={{
          padding: "10px 20px",
          background: "var(--accent-muted)",
          border: "1px solid var(--border-emphasis)",
          borderRadius: 8,
          color: "var(--accent-primary)",
          fontSize: "0.85rem",
          fontWeight: 500,
          cursor: "pointer",
          marginBottom: 32,
        }}
      >
        {copied ? "Copied to clipboard!" : "Export Context for LLM"}
      </button>

      {/* Paper list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {capsulePapers.map((p) => {
          const cat = CATEGORIES[p.category];
          return (
            <div
              key={p.id}
              style={{
                padding: 16,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4,
                  background: (cat?.color || "#638bd4") + "18",
                  color: cat?.color || "#638bd4",
                  border: `1px solid ${(cat?.color || "#638bd4") + "33"}`,
                }}>
                  {cat?.label || p.category}
                </span>
                {p.year && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                    {p.year}
                  </span>
                )}
              </div>
              {p.slug ? (
                <Link href={`/papers/${p.slug}`} style={{ textDecoration: "none" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--accent-primary)", marginBottom: 4 }}>
                    {p.title}
                  </h3>
                </Link>
              ) : (
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-heading)", marginBottom: 4 }}>
                  {p.title}
                </h3>
              )}
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                {p.authors?.map((a) => a.name).join(", ")}
              </p>
              {p.one_liner && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {p.one_liner}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
