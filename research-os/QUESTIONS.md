# DreamHub - Open Questions

Rolling log of open questions. Resolved questions are removed and decisions are captured in SPEC.md.

---

## Supabase Migration

1. **Supabase setup approach**: I presented the pros/cons above. If you want to proceed, I'd set up:
   - Supabase project with tables matching our data model (hypotheses, experiments, datasets, models, tags)
   - Supabase Auth with email+password (simple to set up, no OAuth headaches)
   - Row-level security so only authenticated users can read/write
   - HF token stored as a Supabase secret (not exposed in browser)
   - Migration path: export current localStorage data, import into Supabase

   **Question**: Should I go ahead and set this up? It would take one session. The app would require login, which also protects the HF write operations (rename/delete).

## HuggingFace Integration

2. **HF metadata push — what to push?** You want tags/notes pushed back to HF repo cards. The HF API allows updating the repo's README.md (which serves as the model/dataset card). Options:
   - Push tags as HF tags (shows up in HF filters/search)
   - Push notes/collection-conditions/known-issues into the dataset card README
   - Both?

   **Question**: Which metadata fields should be pushed to HF? Just tags, or also the full metadata (collection conditions, teleop instructions, known issues)?

3. **HF token security**: Currently the HF token is prompted in the browser and stored in localStorage. This works but isn't ideal — anyone with browser access can see it. With Supabase, the token would be stored server-side and all HF write operations would go through a Supabase Edge Function. **This is another reason to prioritize the Supabase migration.**

## Features

4. **Experiment linking flow — more context**: On the Experiments page, when you click the pencil icon to edit an experiment, you can now link datasets and models to it via a search dropdown. This is how you say "experiment X used datasets A, B and model C." These links then show up on the experiments page as colored pills and also appear in the relational graph. **Question**: Is this workflow clear enough, or would you prefer a different way to link them?

5. **Data collection log — more context**: The idea is: before you even upload a dataset to HuggingFace, you could log in DreamHub "I just collected 2 hours of rook movements on SO-100 with instructions X." This creates a placeholder entry. Later, when you upload to HF and sync, it would match up. This is useful if you want to log collection conditions immediately after recording (while fresh in memory) rather than retroactively. **Question**: Would this fit your workflow, or do you usually add metadata after uploading?

6. **Evaluation tracking — proposed workflow**: For manual robot rollout evals, I'd add:
   - An "Evaluations" tab or section within each experiment
   - Log individual rollouts: model version, dataset, outcome (success/partial/failure), notes, date
   - Summary stats: success rate per model version, comparison charts
   - Quick-log form: select model + task, tap success/partial/failure, optional notes
   - Could also work well on mobile for logging during live rollouts

   **Question**: Does this match how you'd want to log evals? How many rollouts do you typically do per evaluation (5? 10? 50?)? Do you need video links?

## Domain & Deployment

7. **Custom domain setup**: You want `hub.dream-machines.eu`. To set this up:
   - Add a CNAME record pointing `hub.dream-machines.eu` to `cname.vercel-dns.com` in your DNS provider
   - Add the custom domain in the Vercel project settings
   - **Question**: Do you manage DNS for dream-machines.eu yourself? Which DNS provider (Cloudflare, Namecheap, etc.)? I can do the Vercel side, but you'll need to add the DNS record.

## Data Model

8. **Dataset-model naming convention**: You mentioned it's hard to tell from names how datasets and models belong together. Would it help to:
   - Auto-detect and display dataset-model relationships based on naming patterns?
   - Add a "trained on" field to models that you can set manually?
   - Show a "related models" section on dataset detail views?
   - All of the above?

9. **Bimanual detection**: I added `single-manual` and `bimanual` as default tags. Currently these need to be manually assigned. **Question**: Is there a naming pattern in your HF repos that indicates bimanual vs single-manual? If so, I can auto-detect it during sync.

## New Questions from This Session

10. **Vercel project rename**: The Vercel project is still called "research-os". Should I rename it to "dreamhub" for consistency? This would change the default Vercel URL but the custom domain would stay the same.

11. **npm package name**: The `package.json` still says `"name": "research-os"`. Should I update this to `dreamhub`?
