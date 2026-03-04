# DreamHub - Application Specification

Living document tracking all decided features, architecture, and design decisions.

## Overview
DreamHub is an internal web app for Dream Machines (dream-machines.eu) to manage and visualize robotics experiments, datasets, and models. Currently focused on robotics data (may expand in the future).

**Live URL**: https://research-os-theta.vercel.app (to be moved to hub.dream-machines.eu)
**Repo location**: `research-os/` subdirectory of LeDream repo, branch `research-os`

## Branding
- **Name**: DreamHub
- **Style**: Dark theme, DM Mono font for logo, aligned with dream-machines.eu aesthetic
- **Domain**: Target `hub.dream-machines.eu` (custom domain on Vercel)

## Architecture

### Current (v1)
- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **Storage**: localStorage (browser-local)
- **HF Integration**: Direct browser-to-HuggingFace API calls
- **Deployment**: Vercel (static site, no serverless functions)
- **Auth**: None (public, HF token prompted on write operations)

### Planned (v2 — Supabase)
- **Database**: Supabase (Postgres) for all app metadata
- **Auth**: Email + password via Supabase Auth
- **HF Token**: Stored server-side, not exposed to browser
- **Multi-device**: Full sync across browsers/devices
- **Multi-user**: Row-level security for future team access

## Data Model

### Core Entities
- **Hypothesis**: Central entity. Status: exploring/active/confirmed/rejected
- **Experiment**: Tests a hypothesis, links to datasets and models. Status: planned/in-progress/completed/failed
- **Dataset**: Synced from HuggingFace. Has metadata, tags, visualizer links
- **Model**: Synced from HuggingFace. Grouped by base name, with iteration/checkpoint tracking
- **Tag**: Categorized as task/robot/status/custom

### Dataset Metadata
- Collection conditions (how variation was handled)
- Teleoperator instructions
- Known issues (e.g., "missing IR filter")
- Notes (free text)
- Estimated hours
- Episode count
- Tags (task type, robot form, manual/bimanual)

### Model Metadata
- Policy type (ACT, SmolVLA, Diffusion, YOLO)
- Description
- Iterations with: version, config JSON, notes, trainedOn dataset links, HF link, date
- Tags

### Default Tags
**Task**: chess, pcb-placement, grasping, object-interaction
**Robot**: SO-100, Phosphobot, single-manual, bimanual
**Policy**: ACT, SmolVLA, Diffusion, YOLO
**Status**: evaluation, training-data

## Pages / Views

### Dashboard
- Stat cards: datasets, models, checkpoints, experiments, total hours, total episodes
- Data hours by tag (progress bars)
- Episodes by tag (progress bars)
- Experiment status breakdown
- Active hypotheses (clickable)
- Recently updated datasets
- All stat cards link to relevant pages

### Experiments
- Hypothesis-centered accordion view
- Full CRUD for hypotheses (title, description, status)
- Full inline editing for experiments (name, notes, results, status)
- Dataset/model linking via search+select dropdowns
- Linked assets shown as colored pills with HF links and visualizer icons

### Relational Graph
- React Flow interactive canvas
- Node types: hypothesis (purple), experiment (amber), dataset (blue), model (green)
- Auto-layout: hypotheses left, experiments center, assets right
- Click-to-navigate to relevant page
- Mini-map, zoom controls, pan

### Datasets
- Search + tag filter
- Expandable detail view with full metadata editing
- Tag assignment (toggle UI)
- LeRobot visualizer links (Eye icon)
- HuggingFace links
- Rename on HuggingFace (via API)
- Delete from HuggingFace (double confirmation: confirm dialog + type name)
- Remove from DreamHub (local only)

### Models
- Search + tag filter
- Expandable detail view
- Description editing
- Tag assignment (toggle UI)
- Iteration list with: version, date, notes editing, config JSON editing, trainedOn links
- Show/hide config toggle

### Tags
- Create/edit/delete tags
- Category grouping (task, robot, status, custom)
- Color picker (12 presets)
- Usage count display

## HuggingFace Integration

### Sync (Read)
- Auto-sync on first load if never synced
- Manual sync via sidebar button
- Fetches from `https://huggingface.co/api/datasets?author=dopaul&limit=200`
- Fetches from `https://huggingface.co/api/models?author=dopaul&limit=200`
- Groups models by base name (strips checkpoint suffixes like `_20k`, `-002000`)
- Infers metadata from names: task type, robot form, episode counts, hours

### Write Operations
- **Rename dataset**: `POST /api/repos/move` with `{fromRepo, toRepo, type: "dataset"}`
- **Delete dataset**: `DELETE /api/repos/delete` with `{name, type: "dataset"}`
- HF token prompted on first write, stored in localStorage
- Planned: HF metadata push (tags, notes to repo cards)

## Data Management
- **Export**: Download all data as timestamped JSON backup
- **Import**: Restore from JSON backup file
- **Reset**: Clear all data with confirmation, triggers re-sync

## Responsive Design
- Mobile: hamburger menu sidebar, fixed top bar with sync button
- All pages: responsive grids, reduced padding, proper text sizing
- Touch-friendly tap targets

## HuggingFace User
- Username: `dopaul`
- Token: Write-capable, stored in `.env` (server) and localStorage (browser, temporary)
