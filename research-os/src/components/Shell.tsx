"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  fetchPapers,
  fetchTags,
  fetchEdges,
  createTag as dbCreateTag,
  updateTag as dbUpdateTag,
  deleteTag as dbDeleteTag,
  addTagToPaper as dbAddTagToPaper,
  removeTagFromPaper as dbRemoveTagFromPaper,
  upsertNote as dbUpsertNote,
  updatePaper as dbUpdatePaper,
  createPaper as dbCreatePaper,
} from "@/lib/supabase-db";
import type { Paper, Tag, PaperEdge, Note } from "@/lib/types";
import ResearchSidebar from "./ResearchSidebar";

// ── Context ───────────────────────────────────────────────────────────
interface ResearchCtx {
  papers: Paper[];
  tags: Tag[];
  edges: PaperEdge[];
  loading: boolean;
  session: Session | null;
  // Mutations
  refresh: () => Promise<void>;
  createTag: (name: string, color: string, description?: string) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Pick<Tag, "name" | "color" | "description">>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addTagToPaper: (paperId: string, tagId: string) => Promise<void>;
  removeTagFromPaper: (paperId: string, tagId: string) => Promise<void>;
  upsertNote: (paperId: string, content: string, granularity?: "oneliner" | "rich") => Promise<Note>;
  updatePaper: (id: string, updates: Partial<Paper>) => Promise<void>;
  createPaper: (paper: { title: string; slug?: string; year?: number; category: string; one_liner?: string }) => Promise<Paper>;
  signOut: () => Promise<void>;
}

const noop = async () => {};
const noopReturn = async () => ({}) as never;

const ResearchContext = createContext<ResearchCtx>({
  papers: [],
  tags: [],
  edges: [],
  loading: true,
  session: null,
  refresh: noop,
  createTag: noopReturn,
  updateTag: noop,
  deleteTag: noop,
  addTagToPaper: noop,
  removeTagFromPaper: noop,
  upsertNote: noopReturn,
  updatePaper: noop,
  createPaper: noopReturn,
  signOut: noop,
});

export const useResearch = () => useContext(ResearchContext);

// ── Login Form ────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "var(--bg-base)",
    }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: 700,
            color: "var(--text-heading)",
            fontFamily: "var(--font-mono)",
          }}>
            Research OS
          </h1>
          <p style={{
            fontSize: "0.75rem", color: "var(--text-tertiary)",
            marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            Dream Machines
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 12, padding: 24,
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-heading)" }}>
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          {error && (
            <div style={{
              fontSize: "0.85rem", color: "#f87171",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 8, padding: 12,
            }}>{error}</div>
          )}

          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={{
                display: "block", width: "100%",
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                borderRadius: 8, padding: "8px 12px", fontSize: "0.875rem",
                color: "var(--text-primary)", marginTop: 4, outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              placeholder="Min. 6 characters"
              style={{
                display: "block", width: "100%",
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                borderRadius: 8, padding: "8px 12px", fontSize: "0.875rem",
                color: "var(--text-primary)", marginTop: 4, outline: "none",
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "10px 0",
            background: "var(--accent-primary)", color: "#fff",
            fontSize: "0.875rem", fontWeight: 500, borderRadius: 8,
            border: "none", cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}>
            {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>

          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.75rem", color: "var(--text-tertiary)",
          }}>
            {isSignUp ? "Already have an account? Sign in" : "First time? Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Authenticated Shell ───────────────────────────────────────────────
function AuthenticatedShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [edges, setEdges] = useState<PaperEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [p, t, e] = await Promise.all([fetchPapers(), fetchTags(), fetchEdges()]);
      setPapers(p);
      setTags(t);
      setEdges(e);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ctx: ResearchCtx = {
    papers,
    tags,
    edges,
    loading,
    session,
    refresh: loadData,
    createTag: async (name, color, description) => {
      const tag = await dbCreateTag(name, color, description);
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      return tag;
    },
    updateTag: async (id, updates) => {
      await dbUpdateTag(id, updates);
      setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    deleteTag: async (id) => {
      await dbDeleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    },
    addTagToPaper: async (paperId, tagId) => {
      await dbAddTagToPaper(paperId, tagId);
      await loadData(); // Refresh to get updated joins
    },
    removeTagFromPaper: async (paperId, tagId) => {
      await dbRemoveTagFromPaper(paperId, tagId);
      await loadData();
    },
    upsertNote: async (paperId, content, granularity) => {
      const note = await dbUpsertNote(paperId, content, granularity);
      return note;
    },
    updatePaper: async (id, updates) => {
      await dbUpdatePaper(id, updates);
      setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    createPaper: async (paper) => {
      const newPaper = await dbCreatePaper(paper);
      setPapers((prev) => [...prev, newPaper]);
      return newPaper;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return (
    <ResearchContext.Provider value={ctx}>
      <ResearchSidebar />
      <main className="main-content">{children}</main>
    </ResearchContext.Provider>
  );
}

// ── Shell (auth gate) ─────────────────────────────────────────────────
export default function Shell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-secondary)",
      }}>
        Loading...
      </div>
    );
  }

  if (!session) return <LoginForm />;

  return <AuthenticatedShell session={session}>{children}</AuthenticatedShell>;
}
