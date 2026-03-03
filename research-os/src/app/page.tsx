"use client";

import { useData } from "@/components/Shell";
import {
  Database,
  Box,
  FlaskConical,
  Lightbulb,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function Dashboard() {
  const { data } = useData();

  const totalHours = data.datasets.reduce(
    (sum, d) => sum + d.metadata.estimatedHours,
    0
  );
  const totalEpisodes = data.datasets.reduce(
    (sum, d) => sum + d.metadata.episodeCount,
    0
  );

  // Hours by tag
  const tagMap = new Map(data.tags.map((t) => [t.id, t]));
  const hoursByTag = new Map<string, number>();
  for (const ds of data.datasets) {
    for (const tid of ds.tags) {
      const tag = tagMap.get(tid);
      if (tag) {
        hoursByTag.set(
          tag.name,
          (hoursByTag.get(tag.name) || 0) + ds.metadata.estimatedHours
        );
      }
    }
  }

  const statCards = [
    {
      label: "Datasets",
      value: data.datasets.length,
      icon: Database,
      color: "text-blue-400",
    },
    {
      label: "Models",
      value: data.models.length,
      icon: Box,
      color: "text-emerald-400",
    },
    {
      label: "Experiments",
      value: data.experiments.length,
      icon: FlaskConical,
      color: "text-amber-400",
    },
    {
      label: "Hypotheses",
      value: data.hypotheses.length,
      icon: Lightbulb,
      color: "text-purple-400",
    },
    {
      label: "Total Hours",
      value: totalHours.toFixed(1),
      icon: Clock,
      color: "text-rose-400",
    },
    {
      label: "Total Episodes",
      value: totalEpisodes.toLocaleString(),
      icon: Database,
      color: "text-cyan-400",
    },
  ];

  // Recent datasets (last 5 modified)
  const recentDatasets = [...data.datasets]
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
    .slice(0, 5);

  // Active hypotheses
  const activeHypotheses = data.hypotheses.filter(
    (h) => h.status === "active" || h.status === "exploring"
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Overview of your robotics research
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-gray-900 rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Hours by Tag */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">
          Data Hours by Tag
        </h2>
        {hoursByTag.size === 0 ? (
          <p className="text-sm text-gray-500">No data yet</p>
        ) : (
          <div className="space-y-3">
            {Array.from(hoursByTag.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([name, hours]) => {
                const tag = data.tags.find((t) => t.name === name);
                const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span
                      className="inline-block w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag?.color || "#6B7280" }}
                    />
                    <span className="text-sm text-gray-300 w-32 truncate">
                      {name}
                    </span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: tag?.color || "#6B7280",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {hours.toFixed(1)}h
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Hypotheses */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Active Hypotheses
          </h2>
          {activeHypotheses.length === 0 ? (
            <p className="text-gray-500 text-sm">No active hypotheses</p>
          ) : (
            <div className="space-y-3">
              {activeHypotheses.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                >
                  <p className="text-sm text-white font-medium">{h.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        h.status === "active"
                          ? "bg-green-900/50 text-green-400"
                          : "bg-yellow-900/50 text-yellow-400"
                      }`}
                    >
                      {h.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {h.experimentIds.length} experiments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Datasets */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Recently Updated Datasets
          </h2>
          <div className="space-y-2">
            {recentDatasets.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{d.name}</p>
                  <p className="text-xs text-gray-500">
                    {d.metadata.episodeCount} episodes &middot;{" "}
                    {d.metadata.estimatedHours}h
                  </p>
                </div>
                <a
                  href={d.hfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
