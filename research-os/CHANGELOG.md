# Research OS - Changelog

## 2026-03-03 — Initial Build

### What was built
- Full Next.js 16 app with 6 pages: Dashboard, Experiments, Graph, Datasets, Models, Tags
- Client-side architecture using localStorage + direct HuggingFace API calls
- Auto-sync: fetches all datasets (66) and models (64, grouped into 27 base models) from HF user `dopaul`
- Seed data: 4 hypotheses with 7 experiments pre-populated and linked to real HF assets
- Deployed to Vercel at https://research-os-theta.vercel.app

### Bug fixes
- Fixed `.gitignore` blocking `research-os/src/lib/` (root `lib/` pattern)
- Refactored from server-side filesystem storage to client-side localStorage (Vercel serverless has ephemeral disk)
- Fixed HF sync crash: Models API returns `createdAt` but not `lastModified` — added `getModelDate()` fallback

### Gap analysis (features to improve)
1. **Model config editing** — The `config` field on ModelIteration exists in types but has no UI for viewing/editing hyperparameters
2. **Tag assignment on datasets/models** — Tags are auto-assigned during sync but can't be manually assigned/removed from detail views
3. **Experiment inline editing** — Hypotheses are editable but experiment rows (name, notes, results, status, linked assets) are read-only
4. **Model iteration notes** — Notes field exists but has no edit UI per iteration
5. **trainedOn links** — ModelIteration.trainedOn is captured but not displayed in the model detail view
6. **Dataset-model linking in experiments** — Can't interactively add/remove dataset or model links to experiments

### Improvements being implemented
- Tag assignment picker on dataset and model detail views
- Experiment inline editing (name, notes, results, status)
- Model iteration notes and config editing
- trainedOn dataset links display
- Graph node click-to-navigate
- Reset all data button accessible from UI
