"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useResearch } from "@/components/Shell";
import { CATEGORIES } from "@/lib/types";
import type { Author } from "@/lib/types";

interface AuthorWithPapers extends Author {
  paperIds: string[];
  paperTitles: string[];
  categories: string[];
}

export default function AuthorsPage() {
  const { papers } = useResearch();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"papers" | "name" | "hindex">("papers");
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const [minPapers, setMinPapers] = useState(1);

  // Build author map with paper associations
  const authors = useMemo(() => {
    const map = new Map<string, AuthorWithPapers>();
    papers.forEach((p) => {
      (p.authors || []).forEach((a) => {
        const existing = map.get(a.id);
        if (existing) {
          existing.paperIds.push(p.id);
          existing.paperTitles.push(p.title);
          if (!existing.categories.includes(p.category))
            existing.categories.push(p.category);
        } else {
          map.set(a.id, {
            ...a,
            paperIds: [p.id],
            paperTitles: [p.title],
            categories: [p.category],
          });
        }
      });
    });
    return Array.from(map.values());
  }, [papers]);

  // Get unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    authors.forEach((a) => {
      if (a.affiliation_country) set.add(a.affiliation_country);
    });
    return Array.from(set).sort();
  }, [authors]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = authors;

    if (minPapers > 1) {
      result = result.filter((a) => a.paperIds.length >= minPapers);
    }

    if (filterCountry) {
      result = result.filter((a) => a.affiliation_country === filterCountry);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.affiliation?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "papers") return b.paperIds.length - a.paperIds.length;
      if (sortBy === "hindex") return (b.h_index || 0) - (a.h_index || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [authors, search, sortBy, filterCountry, minPapers]);

  // Stats
  const stats = useMemo(() => {
    const withAffiliation = authors.filter((a) => a.affiliation);
    const europeanCountries = new Set([
      "Germany", "France", "UK", "United Kingdom", "Switzerland", "Netherlands",
      "Italy", "Spain", "Sweden", "Denmark", "Belgium", "Austria", "Finland",
      "Norway", "Poland", "Czech Republic", "Ireland", "Portugal",
    ]);
    const european = authors.filter(
      (a) => a.affiliation_country && europeanCountries.has(a.affiliation_country)
    );
    const multiPaper = authors.filter((a) => a.paperIds.length >= 3);
    return {
      total: authors.length,
      withAffiliation: withAffiliation.length,
      european: european.length,
      multiPaper: multiPaper.length,
    };
  }, [authors]);

  return (
    <div className="authors-page">
      <div className="authors-page__header">
        <h1>Author Network</h1>
        <p className="authors-page__subtitle">
          {stats.total} authors across your collection
        </p>
      </div>

      {/* Stats cards */}
      <div className="authors-page__stats">
        <div className="authors-page__stat">
          <span className="authors-page__stat-count">{stats.total}</span>
          <span className="authors-page__stat-label">Total Authors</span>
        </div>
        <div className="authors-page__stat">
          <span className="authors-page__stat-count">{stats.withAffiliation}</span>
          <span className="authors-page__stat-label">With Affiliation</span>
        </div>
        <div className="authors-page__stat">
          <span className="authors-page__stat-count">{stats.european}</span>
          <span className="authors-page__stat-label">European</span>
        </div>
        <div className="authors-page__stat">
          <span className="authors-page__stat-count">{stats.multiPaper}</span>
          <span className="authors-page__stat-label">3+ Papers</span>
        </div>
      </div>

      {/* Filters */}
      <div className="authors-page__filters">
        <input
          type="text"
          placeholder="Search authors, affiliations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="collection__search"
        />
        <div className="authors-page__filter-row">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="authors-page__select"
          >
            <option value="papers">Sort by paper count</option>
            <option value="hindex">Sort by h-index</option>
            <option value="name">Sort by name</option>
          </select>
          <select
            value={filterCountry || ""}
            onChange={(e) => setFilterCountry(e.target.value || null)}
            className="authors-page__select"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={minPapers}
            onChange={(e) => setMinPapers(Number(e.target.value))}
            className="authors-page__select"
          >
            <option value={1}>1+ papers</option>
            <option value={2}>2+ papers</option>
            <option value={3}>3+ papers</option>
            <option value={5}>5+ papers</option>
          </select>
        </div>
      </div>

      <p className="authors-page__count">
        {filtered.length} author{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Author list */}
      <div className="authors-page__list">
        {filtered.map((author) => (
          <div key={author.id} className="authors-page__card">
            <div className="authors-page__card-header">
              <h3>{author.name}</h3>
              <span className="authors-page__paper-count">
                {author.paperIds.length} paper{author.paperIds.length !== 1 ? "s" : ""}
              </span>
            </div>
            {author.affiliation && (
              <p className="authors-page__affiliation">
                {author.affiliation}
                {author.affiliation_country && (
                  <span className="authors-page__country">
                    {" "}({author.affiliation_country})
                  </span>
                )}
              </p>
            )}
            <div className="authors-page__meta-row">
              {author.h_index != null && (
                <span className="authors-page__meta-item">
                  h-index: {author.h_index}
                </span>
              )}
              {author.paper_count != null && (
                <span className="authors-page__meta-item">
                  {author.paper_count} total papers
                </span>
              )}
              {author.homepage_url && (
                <a
                  href={author.homepage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="authors-page__meta-link"
                >
                  Homepage
                </a>
              )}
            </div>
            <div className="authors-page__papers">
              {author.paperTitles.map((title, i) => {
                const paper = papers.find((p) => p.id === author.paperIds[i]);
                const cat = paper ? CATEGORIES[paper.category] : null;
                return (
                  <span
                    key={author.paperIds[i]}
                    className="authors-page__paper-badge"
                    style={{
                      background: (cat?.color || "#638bd4") + "15",
                      color: cat?.color || "#638bd4",
                      borderColor: (cat?.color || "#638bd4") + "30",
                    }}
                  >
                    {title}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
