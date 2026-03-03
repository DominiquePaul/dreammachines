# Research OS - Changelog

## 2026-03-03 — Improvements Round 2

### Data Management
- **Export**: Download all Research OS data as a timestamped JSON backup
- **Import**: Restore from a JSON backup file
- **Reset**: Clear all data and re-sync from HuggingFace (with confirmation dialog)

### Dashboard
- Added **Episodes by Tag** breakdown alongside Hours by Tag
- Added **Experiment Status** breakdown (planned/in-progress/completed/failed)
- Added **Checkpoints** stat card showing total model iterations
- Stat cards are now **clickable** — navigate to relevant page
- Active hypotheses are now **clickable** — navigate to experiments page
- Added "View all" links to experiments and datasets pages

### Experiments Page
- **Full experiment editing**: click pencil icon to edit name, notes, results, status
- **Dataset linking**: search and select datasets to link to experiments
- **Model linking**: search and select models to link to experiments
- Linked assets shown as removable pills during editing

### Datasets Page
- **Tag assignment UI**: click "Edit" next to Tags to toggle tags on/off
- Tags shown as colored toggle buttons with checkmarks

### Models Page
- **Tag assignment UI**: same toggle interface as datasets
- **Model description editing**: click edit to add/change model group descriptions
- **Iteration notes editing**: pencil icon on each checkpoint to add/edit notes
- **Config JSON editing**: enter/edit hyperparameters as JSON per iteration
- **Show/hide config**: toggle to view config JSON for iterations that have it
- **trainedOn display**: shows linked training datasets on iterations

### Graph Page
- **Click-to-navigate**: clicking a node navigates to the relevant page
- Nodes now show pointer cursor to indicate interactivity
- Updated help text: "Click a node to navigate"

---

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
