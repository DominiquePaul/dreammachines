"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Network,
  Database,
  Box,
  Tags,
  RefreshCw,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/models", label: "Models", icon: Box },
  { href: "/tags", label: "Tags", icon: Tags },
];

export default function Sidebar({
  syncing,
  lastSynced,
  onSync,
}: {
  syncing: boolean;
  lastSynced: string;
  onSync: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-950 text-gray-300 flex flex-col border-r border-gray-800 shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Research OS
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Robotics Experiment Hub</p>
      </div>

      <nav className="flex-1 py-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-gray-800 text-white font-medium"
                  : "hover:bg-gray-900 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing HF..." : "Sync with HuggingFace"}
        </button>
        {lastSynced && (
          <p className="text-[10px] text-gray-600 mt-1">
            Last: {new Date(lastSynced).toLocaleString()}
          </p>
        )}
      </div>
    </aside>
  );
}
