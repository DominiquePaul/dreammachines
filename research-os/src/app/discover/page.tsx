"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { DiscoveryItem } from "@/lib/types";

export default function DiscoverPage() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>("unread");
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const query = supabase
      .from("research_discovery_queue")
      .select("*")
      .order("discovered_at", { ascending: false });

    if (filter !== "all") {
      query.eq("status", filter);
    }

    const { data } = await query;
    setItems((data || []) as DiscoveryItem[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const runDiscovery = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/semantic-scholar/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 10 }),
      });
      const data = await res.json();
      setSyncResult(
        data.message || `Found ${data.discovered} new papers (checked ${data.papersChecked} papers)`
      );
      await loadItems();
    } catch {
      setSyncResult("Discovery failed");
    } finally {
      setSyncing(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: DiscoveryItem["status"]
  ) => {
    await supabase
      .from("research_discovery_queue")
      .update({ status })
      .eq("id", id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const statusTabs = [
    { key: "unread", label: "Unread" },
    { key: "to-read", label: "To Read" },
    { key: "added", label: "Added" },
    { key: "dismissed", label: "Dismissed" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="discover-page">
      <div className="discover-page__header">
        <div>
          <h1>Discovery Feed</h1>
          <p className="discover-page__subtitle">
            Papers citing your collection, discovered via Semantic Scholar
          </p>
        </div>
        <button
          className="discover-page__sync-btn"
          onClick={runDiscovery}
          disabled={syncing}
        >
          {syncing ? "Discovering..." : "Run Discovery"}
        </button>
      </div>

      {syncResult && (
        <div className="discover-page__sync-result">{syncResult}</div>
      )}

      <div className="discover-page__tabs">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`discover-page__tab ${filter === tab.key ? "discover-page__tab--active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", padding: "40px 0" }}>Loading...</p>
      ) : items.length === 0 ? (
        <div className="discover-page__empty">
          <p>No papers in this category.</p>
          <p style={{ fontSize: "0.8rem", marginTop: 8 }}>
            Click &quot;Run Discovery&quot; to find papers citing your collection.
            Make sure papers have been synced with Semantic Scholar first.
          </p>
        </div>
      ) : (
        <div className="discover-page__list">
          {items.map((item) => (
            <div key={item.id} className="discover-page__item">
              <div className="discover-page__item-header">
                <h3>{item.paper_title}</h3>
                {item.year && (
                  <span className="discover-page__item-year">{item.year}</span>
                )}
              </div>
              {item.authors && (
                <p className="discover-page__item-authors">{item.authors}</p>
              )}
              {item.abstract && (
                <p className="discover-page__item-abstract">
                  {item.abstract.length > 300
                    ? item.abstract.slice(0, 300) + "..."
                    : item.abstract}
                </p>
              )}
              <div className="discover-page__item-actions">
                {item.arxiv_id && (
                  <a
                    href={`https://arxiv.org/abs/${item.arxiv_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="discover-page__item-link"
                  >
                    arXiv
                  </a>
                )}
                {item.status !== "to-read" && (
                  <button onClick={() => updateStatus(item.id, "to-read")}>
                    To Read
                  </button>
                )}
                {item.status !== "dismissed" && (
                  <button onClick={() => updateStatus(item.id, "dismissed")}>
                    Dismiss
                  </button>
                )}
                {item.status !== "added" && (
                  <button onClick={() => updateStatus(item.id, "added")}>
                    Mark Added
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
