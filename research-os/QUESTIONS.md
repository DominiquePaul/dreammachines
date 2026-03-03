# Questions for Review

These are open questions and design decisions I'd like your input on when you're back.

## Data & Architecture

1. **Database migration timing**: The app uses localStorage which means data is per-browser and lost if you clear storage. Should we move to a Supabase/Postgres backend soon, or is localStorage fine for now? (I noticed you have Supabase MCP tools available.)

2. **HF metadata push**: The spec mentions tags being "pushable to metadata" on HuggingFace. Should tags/notes you add in the app be pushed back to HF repo cards? This would require write access via the HF API.

3. **Multi-device sync**: Since localStorage is browser-local, data entered on one device won't appear on another. Is this a problem for your workflow, or do you mainly use one browser?

## Features & UX

4. **Model config format**: How do you want to enter model hyperparameters? Options:
   - Raw JSON editor (flexible but less friendly)
   - Structured form with known fields (learning_rate, batch_size, epochs, etc.)
   - Import from a config file on HuggingFace

5. **Experiment linking flow**: When adding datasets/models to an experiment, should there be a search/select dropdown, or would you prefer a drag-and-drop from the graph view?

6. **Data collection log**: Would it be useful to have a "collection log" page where you can quickly log a new data collection session (robot, task, hours, notes) that auto-creates the dataset entry before it's even uploaded to HF?

7. **Evaluation tracking**: The spec mentions evaluation datasets. Should there be a dedicated evaluation results view that compares model performance across datasets with charts/tables?

## Prioritization

8. **What matters most right now?** Given limited time, which of these would be most valuable:
   - a) Better model iteration tracking (configs, notes, diffs)
   - b) Better experiment workflow (linking assets, tracking progress)
   - c) Database backend for multi-device access
   - d) Evaluation results visualization
   - e) Something else entirely?

## Cosmetic / Polish

9. **Branding**: "Research OS" is the working name. Want to keep it or rename?

10. **Mobile**: Do you ever need to check this on your phone, or is it desktop-only?
