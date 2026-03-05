# Research OS - Open Questions

Rolling log of open questions. Resolved items go to SPEC.md (decisions).

---

## Resolved (moved to SPEC.md)

- Q1: Content format -> **MDX** with DB-stored prose notes
- Q2: Database -> **Supabase**, same project as DreamHub, shared auth, research_ prefix tables, pgvector embeddings
- Q3: Deployment -> **research.dream-machines.eu**, separate Vercel project, password protected
- Q4/Q5: Editing -> **Hybrid**: in-browser markdown editor for notes (writes to DB) + MDX files editable via IDE/Claude Code. Both coexist.
- Q6: Context granularity -> **Two levels**: one-liners (always) + rich notes (unlimited, grow over time via LLM subagents). Plus capsule synthesis per tag group.
- Q7: LLM conversations -> **All three**: in-app chat (Phase 4), context export (Phase 3), MCP server for Claude Code (Phase 3)
- Q8: External APIs -> **Semantic Scholar** (free). Smart batched cron to stay within limits.
- Q9: Refresh -> Weekly citations, daily discovery, on-add author affiliation. Cron jobs.
- Q11: Research frontier -> Dropped
- Q12: DreamHub experiment links -> Deferred to Phase 5
- Q14: Semantic clustering -> Yes, via embeddings (Phase 4)
- Q15: Reading velocity dashboard -> Yes, mini version (Phase 4)
- Q16: Mobile -> Responsive design for mobile + tablet throughout

---

## Open Questions

1. **Shared Supabase project — same DB or separate schema?**
   Decision: same Supabase project as DreamHub for shared auth. But should research_* tables live in the `public` schema alongside DreamHub tables, or in a separate `research` schema? Separate schema is cleaner but adds complexity to queries. Same schema with prefix is simpler.
   --> Either is fine, I'd like to have the option to combine the two later somehow

2. **In-browser note editor — which component?**
   Options: CodeMirror (full-featured, markdown mode), Milkdown (WYSIWYG markdown), simple textarea with preview toggle. CodeMirror is battle-tested but heavier. Textarea + preview is simplest for v1.
   --> Either is fine. You choose. 

3. **Confirmed learnings detection — how to implement?**
   You liked the idea of detecting findings validated across multiple papers (opposite of contradiction detection). Approach: embed key claims from each paper's notes, cluster by similarity, then use LLM to synthesize "N papers confirm X." Runs periodically or on-demand. This avoids O(n^2) pairwise comparisons. Worth building in Phase 4?
   --> sounds good. 

4. **Paper PDF/arxiv ingestion — how to feed original papers to subagents?**
   When the LLM needs to read the original paper to augment notes, it needs access to the full text. Options:
   - Fetch arxiv HTML version (newer papers have this)
   - Download PDF and extract text (lossy but universal)
   - Use Semantic Scholar's TLDR + abstract as a lightweight fallback
   - Store full text in DB on first fetch
   Best approach is probably: try arxiv HTML first, fall back to PDF text extraction, cache the result.
   --> Sounds good.

5. **How to handle the existing 20 interactive visualization pages during migration?**
   These are 500-800 line React components (DreamerV3, SAC, etc.) with custom canvas code. Options:
   - Convert to MDX pages that import the visualization as a component (cleanest)
   - Keep as React pages alongside the new MDX system (pragmatic, no rewrite risk)
   - Gradual migration: keep React pages now, convert one-by-one as you revisit them
   Recommendation: keep as-is for Phase 1, convert gradually. No need to rewrite working code.
   --> Mdx sounds fine. 

6. **Vercel cron job costs?**
   Vercel hobby plan includes cron jobs but they run as serverless functions. For daily discovery + weekly citations, this should be well within free tier limits (~30 function invocations/day). Worth confirming you're on a plan that supports this, or if we should use an external cron (e.g., GitHub Actions).
   --> Yes, I'm on the pro plan so everything should be fine. Lets run as much as possible in vercel and not add other tools unnecessarily.
