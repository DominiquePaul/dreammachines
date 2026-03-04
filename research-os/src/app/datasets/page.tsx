"use client";

import { useState } from "react";
import { useData } from "@/components/Shell";
import {
  ExternalLink,
  Search,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Tag as TagIcon,
  Eye,
} from "lucide-react";

function visualizerUrl(hfId: string): string {
  return `https://huggingface.co/spaces/lerobot/visualize_dataset?path=%2F${encodeURIComponent(hfId)}%2Fepisode_0`;
}

export default function DatasetsPage() {
  const ctx = useData();
  const { data } = ctx;
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [editMeta, setEditMeta] = useState({
    collectionConditions: "",
    teleoperatorInstructions: "",
    knownIssues: "",
    notes: "",
    estimatedHours: 0,
    episodeCount: 0,
  });

  const tagMap = new Map(data.tags.map((t) => [t.id, t]));

  const filtered = data.datasets.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterTag && !d.tags.includes(filterTag)) return false;
    return true;
  });

  const startEdit = (d: (typeof data.datasets)[0]) => {
    setEditing(d.id);
    setEditMeta({
      collectionConditions: d.metadata.collectionConditions,
      teleoperatorInstructions: d.metadata.teleoperatorInstructions,
      knownIssues: d.metadata.knownIssues.join("\n"),
      notes: d.metadata.notes,
      estimatedHours: d.metadata.estimatedHours,
      episodeCount: d.metadata.episodeCount,
    });
  };

  const saveEdit = (id: string) => {
    ctx.updateDataset(id, {
      metadata: {
        ...editMeta,
        knownIssues: editMeta.knownIssues.split("\n").filter((s) => s.trim()),
      },
    });
    setEditing(null);
  };

  const toggleTag = (datasetId: string, tagId: string) => {
    const ds = data.datasets.find((d) => d.id === datasetId);
    if (!ds) return;
    const newTags = ds.tags.includes(tagId)
      ? ds.tags.filter((t) => t !== tagId)
      : [...ds.tags, tagId];
    ctx.updateDataset(datasetId, { tags: newTags });
  };

  const handleDeleteDataset = (id: string) => {
    if (!confirm("Remove this dataset from Research OS? (Does not delete from HuggingFace)")) return;
    ctx.deleteDataset(id);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Datasets</h1>
        <p className="text-gray-400 text-sm mt-1">
          {data.datasets.length} datasets synced from HuggingFace
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
          />
        </div>
        <select
          value={filterTag || ""}
          onChange={(e) => setFilterTag(e.target.value || null)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All tags</option>
          {data.tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dataset list */}
      <div className="space-y-2">
        {filtered.map((d) => {
          const isExpanded = expandedId === d.id;
          const isEditing = editing === d.id;

          return (
            <div
              key={d.id}
              className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
            >
              <div
                className="p-3 md:p-4 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() =>
                  setExpandedId(isExpanded ? null : d.id)
                }
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-500 shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium truncate">
                      {d.name}
                    </span>
                    {d.metadata.knownIssues.length > 0 && (
                      <AlertTriangle
                        size={14}
                        className="text-amber-400 shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {d.metadata.episodeCount} eps
                    </span>
                    <span className="text-xs text-gray-500">
                      {d.metadata.estimatedHours}h
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {d.downloads} downloads
                    </span>
                    {d.tags.map((tid) => {
                      const tag = tagMap.get(tid);
                      return tag ? (
                        <span
                          key={tid}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: tag.color + "22",
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={visualizerUrl(d.hfId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-emerald-400"
                    title="Visualize dataset"
                  >
                    <Eye size={14} />
                  </a>
                  <a
                    href={d.hfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-blue-400"
                    title="View on HuggingFace"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => handleDeleteDataset(d.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 p-3 md:p-4 space-y-4">
                  {/* Visualizer link */}
                  <div className="flex gap-2">
                    <a
                      href={visualizerUrl(d.hfId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-900/30 text-emerald-400 rounded-lg hover:bg-emerald-900/50 transition-colors"
                    >
                      <Eye size={12} /> Open in LeRobot Visualizer
                    </a>
                    <a
                      href={d.hfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 transition-colors"
                    >
                      <ExternalLink size={12} /> View on HuggingFace
                    </a>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Field
                        label="Collection Conditions"
                        value={editMeta.collectionConditions}
                        onChange={(v) =>
                          setEditMeta({ ...editMeta, collectionConditions: v })
                        }
                      />
                      <Field
                        label="Teleoperator Instructions"
                        value={editMeta.teleoperatorInstructions}
                        onChange={(v) =>
                          setEditMeta({
                            ...editMeta,
                            teleoperatorInstructions: v,
                          })
                        }
                      />
                      <Field
                        label="Known Issues (one per line)"
                        value={editMeta.knownIssues}
                        onChange={(v) =>
                          setEditMeta({ ...editMeta, knownIssues: v })
                        }
                        textarea
                      />
                      <Field
                        label="Notes"
                        value={editMeta.notes}
                        onChange={(v) =>
                          setEditMeta({ ...editMeta, notes: v })
                        }
                        textarea
                      />
                      <div className="flex gap-4">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">
                            Estimated Hours
                          </label>
                          <input
                            type="number"
                            value={editMeta.estimatedHours}
                            onChange={(e) =>
                              setEditMeta({
                                ...editMeta,
                                estimatedHours: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="block w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">
                            Episode Count
                          </label>
                          <input
                            type="number"
                            value={editMeta.episodeCount}
                            onChange={(e) =>
                              setEditMeta({
                                ...editMeta,
                                episodeCount: parseInt(e.target.value) || 0,
                              })
                            }
                            className="block w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(d.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded"
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <button
                          onClick={() => startEdit(d)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                        >
                          <Pencil size={12} /> Edit Metadata
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetaField
                          label="Collection Conditions"
                          value={d.metadata.collectionConditions}
                        />
                        <MetaField
                          label="Teleoperator Instructions"
                          value={d.metadata.teleoperatorInstructions}
                        />
                      </div>
                      {d.metadata.knownIssues.length > 0 && (
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase">
                            Known Issues
                          </span>
                          <div className="mt-1 space-y-1">
                            {d.metadata.knownIssues.map((issue, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-xs text-amber-400"
                              >
                                <AlertTriangle size={12} />
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {d.metadata.notes && (
                        <MetaField label="Notes" value={d.metadata.notes} />
                      )}
                      {/* Tag assignment */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-gray-500 uppercase">Tags</span>
                          <button
                            onClick={() => setEditingTags(editingTags === d.id ? null : d.id)}
                            className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1"
                          >
                            <TagIcon size={10} />
                            {editingTags === d.id ? "Done" : "Edit"}
                          </button>
                        </div>
                        {editingTags === d.id ? (
                          <div className="flex flex-wrap gap-1.5">
                            {data.tags.map((tag) => {
                              const isActive = d.tags.includes(tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleTag(d.id, tag.id)}
                                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                                    isActive
                                      ? "border-transparent"
                                      : "border-gray-700 opacity-40 hover:opacity-70"
                                  }`}
                                  style={{
                                    backgroundColor: isActive ? tag.color + "33" : "transparent",
                                    color: tag.color,
                                  }}
                                >
                                  {isActive ? "\u2713 " : ""}{tag.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {d.tags.length === 0 && (
                              <span className="text-[10px] text-gray-600 italic">No tags</span>
                            )}
                            {d.tags.map((tid) => {
                              const tag = tagMap.get(tid);
                              return tag ? (
                                <span
                                  key={tid}
                                  className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: tag.color + "22", color: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-600">
                        HF ID: {d.hfId} &middot; Last modified:{" "}
                        {new Date(d.lastModified).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
      <p className="text-sm text-gray-300 mt-0.5">
        {value || <span className="text-gray-600 italic">Not set</span>}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="block w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white mt-0.5"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white mt-0.5"
        />
      )}
    </div>
  );
}
