"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useResearch } from "@/components/Shell";
import { CATEGORIES } from "@/lib/types";
import type { Paper } from "@/lib/types";

function SyncButton({ onDone }: { onDone: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/semantic-scholar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });
      const data = await res.json();
      setResult(`Synced ${data.synced}, ${data.notFound} not found`);
      onDone();
    } catch {
      setResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        style={{
          padding: "6px 14px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 6,
          color: "var(--text-secondary)",
          fontSize: "0.75rem",
          cursor: syncing ? "wait" : "pointer",
        }}
      >
        {syncing ? "Syncing..." : "Sync Citations"}
      </button>
      {result && (
        <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
          {result}
        </span>
      )}
    </div>
  );
}

function PaperCard({ paper }: { paper: Paper }) {
  const authorStr = paper.authors?.map((a) => a.name).join(", ") || "";
  const cat = CATEGORIES[paper.category];
  const href = paper.slug ? `/papers/${paper.slug}` : null;

  const card = (
    <div className="paper-card" data-category={paper.category}>
      <div className="paper-card__header">
        <span
          className="paper-card__cat"
          style={{ background: (cat?.color || "#638bd4") + "18", color: cat?.color || "#638bd4", borderColor: (cat?.color || "#638bd4") + "33" }}
        >
          {cat?.label || paper.category}
        </span>
        {paper.year && <span className="paper-card__year">{paper.year}</span>}
      </div>
      <h3 className="paper-card__title">{paper.title}</h3>
      {authorStr && <p className="paper-card__authors">{authorStr}</p>}
      {paper.one_liner && <p className="paper-card__oneliner">{paper.one_liner}</p>}
      {paper.tags && paper.tags.length > 0 && (
        <div className="paper-card__tags">
          {paper.tags.map((t) => (
            <span key={t.id} className="paper-card__tag" style={{ background: t.color + "22", color: t.color, borderColor: t.color + "44" }}>
              {t.name}
            </span>
          ))}
        </div>
      )}
      <div className="paper-card__footer">
        {paper.citation_count > 0 && (
          <span className="paper-card__citations">
            {paper.citation_count} citations
          </span>
        )}
        {paper.slug && (
          <span className="paper-card__viz-badge">Has visualization</span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{card}</Link>;
  }
  return card;
}

export default function CollectionPage() {
  const { papers, tags, loading, refresh } = useResearch();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = papers;

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags?.some((t) => t.id === selectedTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.one_liner?.toLowerCase().includes(q) ||
          p.authors?.some((a) => a.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [papers, search, selectedCategory, selectedTag]);

  // Category stats
  const catCounts = useMemo(() => {
    return papers.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
  }, [papers]);

  if (loading) {
    return (
      <div className="collection">
        <div className="collection__loading">Loading papers...</div>
      </div>
    );
  }

  return (
    <div className="collection">
      {/* Header */}
      <div className="collection__header">
        <h1>Research Collection</h1>
        <p className="collection__subtitle">
          {papers.length} papers tracked across {Object.keys(catCounts).length} categories
        </p>
        <SyncButton onDone={refresh} />
      </div>

      {/* Stats */}
      <div className="collection__stats">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`collection__stat ${selectedCategory === key ? "collection__stat--active" : ""}`}
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            style={{ borderColor: selectedCategory === key ? cat.color : undefined }}
          >
            <span className="collection__stat-count" style={{ color: cat.color }}>
              {catCounts[key] || 0}
            </span>
            <span className="collection__stat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="collection__filters">
        <input
          type="text"
          placeholder="Search papers, authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="collection__search"
        />
        {tags.length > 0 && (
          <div className="collection__tag-filters">
            {tags.map((t) => (
              <button
                key={t.id}
                className={`collection__tag-btn ${selectedTag === t.id ? "collection__tag-btn--active" : ""}`}
                onClick={() => setSelectedTag(selectedTag === t.id ? null : t.id)}
                style={{
                  background: selectedTag === t.id ? t.color + "22" : undefined,
                  color: selectedTag === t.id ? t.color : undefined,
                  borderColor: selectedTag === t.id ? t.color + "44" : undefined,
                }}
              >
                # {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="collection__count">
        {filtered.length} paper{filtered.length !== 1 ? "s" : ""}
        {(selectedCategory || selectedTag || search) && (
          <button
            className="collection__clear"
            onClick={() => { setSelectedCategory(null); setSelectedTag(null); setSearch(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="collection__grid">
        {filtered.map((p) => (
          <PaperCard key={p.id} paper={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="collection__empty">
          No papers match your filters.
        </div>
      )}
    </div>
  );
}
