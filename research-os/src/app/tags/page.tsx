"use client";

import { useState, useMemo } from "react";
import { useResearch } from "@/components/Shell";

const DEFAULT_COLORS = [
  "#4a9b7f", "#6b73b5", "#c4884d", "#638bd4",
  "#9b6b9b", "#6b9b9b", "#b5736b", "#7fb54a",
  "#b5a84a", "#4a7fb5", "#b54a7f", "#4ab5a8",
];

export default function TagsPage() {
  const { tags, papers, createTag, deleteTag } = useResearch();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Count papers per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    papers.forEach((p) => {
      p.tags?.forEach((t) => {
        counts[t.id] = (counts[t.id] || 0) + 1;
      });
    });
    return counts;
  }, [papers]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createTag(newName.trim(), newColor);
      setNewName("");
      setNewColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    } catch (err) {
      console.error("Failed to create tag:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"? This will remove it from all papers.`)) return;
    await deleteTag(id);
  };

  return (
    <div className="tags-page">
      <h1>Manage Tags</h1>

      <div className="tags-page__create">
        <input
          className="tags-page__input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name..."
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <input
          type="color"
          className="tags-page__color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />
        <button
          className="tags-page__add-btn"
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
        >
          {creating ? "..." : "Add Tag"}
        </button>
      </div>

      <div className="tags-page__list">
        {tags.length === 0 && (
          <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: 40 }}>
            No tags yet. Create one above.
          </p>
        )}
        {tags.map((t) => (
          <div key={t.id} className="tags-page__item">
            <div className="tags-page__item-color" style={{ background: t.color }} />
            <span className="tags-page__item-name">{t.name}</span>
            <span className="tags-page__item-count">{tagCounts[t.id] || 0} papers</span>
            <button
              className="tags-page__item-delete"
              onClick={() => handleDelete(t.id, t.name)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
