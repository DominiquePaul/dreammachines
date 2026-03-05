"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useResearch } from "@/components/Shell";
import { fetchPaperBySlug } from "@/lib/supabase-db";
import { CATEGORIES } from "@/lib/types";
import type { Paper } from "@/lib/types";

function NoteEditor({ paper, onSave }: { paper: Paper; onSave: () => void }) {
  const { upsertNote } = useResearch();
  const richNote = paper.notes?.find((n) => n.granularity === "rich");
  const [content, setContent] = useState(richNote?.content || "");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await upsertNote(paper.id, content, "rich");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  }, [paper.id, content, upsertNote, onSave]);

  // Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <div className="note-editor">
      <div className="note-editor__tabs">
        <button
          className={`note-editor__tab ${tab === "edit" ? "note-editor__tab--active" : ""}`}
          onClick={() => setTab("edit")}
        >
          Edit
        </button>
        <button
          className={`note-editor__tab ${tab === "preview" ? "note-editor__tab--active" : ""}`}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
      </div>

      {tab === "edit" ? (
        <textarea
          className="note-editor__textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your notes in Markdown..."
        />
      ) : (
        <div className="note-editor__preview">
          {content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          ) : (
            <p style={{ color: "var(--text-tertiary)" }}>No notes yet. Switch to Edit to start writing.</p>
          )}
        </div>
      )}

      <div className="note-editor__actions">
        <button
          className="note-editor__save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <span className="note-editor__status">
          {saved ? "Saved!" : "Ctrl+S to save"}
        </span>
      </div>
    </div>
  );
}

function TagAssigner({ paper, onUpdate }: { paper: Paper; onUpdate: () => void }) {
  const { tags, addTagToPaper, removeTagFromPaper } = useResearch();
  const paperTagIds = new Set(paper.tags?.map((t) => t.id) || []);

  const handleToggle = async (tagId: string) => {
    if (paperTagIds.has(tagId)) {
      await removeTagFromPaper(paper.id, tagId);
    } else {
      await addTagToPaper(paper.id, tagId);
    }
    onUpdate();
  };

  if (tags.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <button
          key={t.id}
          onClick={() => handleToggle(t.id)}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            border: `1px solid ${paperTagIds.has(t.id) ? t.color + "66" : "var(--border-default)"}`,
            background: paperTagIds.has(t.id) ? t.color + "22" : "transparent",
            color: paperTagIds.has(t.id) ? t.color : "var(--text-secondary)",
            fontSize: "0.75rem",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
          }}
        >
          {paperTagIds.has(t.id) ? "✓ " : ""}#{t.name}
        </button>
      ))}
    </div>
  );
}

export default function PaperDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const { edges, papers } = useResearch();

  const loadPaper = useCallback(async () => {
    const p = await fetchPaperBySlug(slug);
    setPaper(p);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadPaper();
  }, [loadPaper]);

  if (loading) {
    return <div className="paper-detail"><p style={{ color: "var(--text-secondary)" }}>Loading...</p></div>;
  }

  if (!paper) {
    return (
      <div className="paper-detail">
        <Link href="/" className="paper-detail__back">← Back to collection</Link>
        <h1>Paper not found</h1>
        <p style={{ color: "var(--text-secondary)" }}>No paper with slug &quot;{slug}&quot;</p>
      </div>
    );
  }

  const cat = CATEGORIES[paper.category];
  const authorStr = paper.authors?.map((a) => a.name).join(", ") || "";

  // Find related papers from lineage graph
  const parentIds = edges
    .filter((e) => e.source_id === paper.id)
    .map((e) => e.target_id);
  const childIds = edges
    .filter((e) => e.target_id === paper.id)
    .map((e) => e.source_id);
  const parents = papers.filter((p) => parentIds.includes(p.id));
  const children = papers.filter((p) => childIds.includes(p.id));

  // Check if this paper has an interactive visualization page
  const hasVizPage = paper.slug && papers.find((p) => p.slug === paper.slug);

  return (
    <div className="paper-detail">
      <Link href="/" className="paper-detail__back">← Back to collection</Link>

      <div className="paper-detail__meta">
        {cat && (
          <span
            className="paper-card__cat"
            style={{ background: cat.color + "18", color: cat.color, borderColor: cat.color + "33" }}
          >
            {cat.label}
          </span>
        )}
        {paper.year && (
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {paper.year}
          </span>
        )}
        {paper.arxiv_id && (
          <a
            href={`https://arxiv.org/abs/${paper.arxiv_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.8rem", color: "var(--accent-primary)" }}
          >
            arXiv
          </a>
        )}
      </div>

      <h1>{paper.title}</h1>
      {authorStr && <p className="paper-detail__authors">{authorStr}</p>}
      {paper.one_liner && <div className="paper-detail__oneliner">{paper.one_liner}</div>}

      {/* Interactive Visualization Link */}
      {hasVizPage && (
        <Link
          href={`/methods/${paper.slug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "var(--accent-muted)",
            border: "1px solid var(--border-emphasis)",
            borderRadius: 8,
            color: "var(--accent-primary)",
            fontSize: "0.85rem",
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          ◆ View Interactive Visualization
        </Link>
      )}

      {/* Tags */}
      <div className="paper-detail__section">
        <h2>Tags</h2>
        <TagAssigner paper={paper} onUpdate={loadPaper} />
      </div>

      {/* Notes */}
      <div className="paper-detail__section">
        <h2>Notes</h2>
        <NoteEditor paper={paper} onSave={loadPaper} />
      </div>

      {/* Related Papers */}
      {(parents.length > 0 || children.length > 0) && (
        <div className="paper-detail__section">
          <h2>Related Papers</h2>
          <div className="lineage-grid">
            {parents.length > 0 && (
              <div className="lineage-group">
                <h4>Builds on</h4>
                {parents.map((p) => (
                  <div key={p.id} className="lineage-item" style={{ borderColor: CATEGORIES[p.category]?.color || "var(--border-default)" }}>
                    {p.slug ? (
                      <Link href={`/papers/${p.slug}`}>
                        <h5 style={{ color: "var(--accent-primary)" }}>{p.title}</h5>
                      </Link>
                    ) : (
                      <h5>{p.title}</h5>
                    )}
                    <p>{p.one_liner}</p>
                  </div>
                ))}
              </div>
            )}
            {children.length > 0 && (
              <div className="lineage-group">
                <h4>Built upon by</h4>
                {children.map((p) => (
                  <div key={p.id} className="lineage-item" style={{ borderColor: CATEGORIES[p.category]?.color || "var(--border-default)" }}>
                    {p.slug ? (
                      <Link href={`/papers/${p.slug}`}>
                        <h5 style={{ color: "var(--accent-primary)" }}>{p.title}</h5>
                      </Link>
                    ) : (
                      <h5>{p.title}</h5>
                    )}
                    <p>{p.one_liner}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
