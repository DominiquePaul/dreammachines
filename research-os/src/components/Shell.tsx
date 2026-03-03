"use client";

import { useResearchData } from "@/lib/hooks";
import Sidebar from "./Sidebar";
import type { ResearchData } from "@/lib/types";
import { createContext, useContext } from "react";

interface DataCtx {
  data: ResearchData;
  loading: boolean;
  syncing: boolean;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataCtx>({
  data: { hypotheses: [], experiments: [], datasets: [], models: [], tags: [], lastSynced: "" },
  loading: true,
  syncing: false,
  refresh: async () => {},
});

export const useData = () => useContext(DataContext);

export default function Shell({ children }: { children: React.ReactNode }) {
  const { data, loading, syncing, sync, refresh } = useResearchData();

  return (
    <DataContext.Provider value={{ data, loading, syncing, refresh }}>
      <div className="flex h-screen bg-gray-950 text-gray-100">
        <Sidebar syncing={syncing} lastSynced={data.lastSynced} onSync={sync} />
        <main className="flex-1 overflow-auto">
          {loading && data.lastSynced === "" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshSpinner />
                <p className="text-gray-400 mt-4">Loading &amp; syncing with HuggingFace...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </DataContext.Provider>
  );
}

function RefreshSpinner() {
  return (
    <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
  );
}
