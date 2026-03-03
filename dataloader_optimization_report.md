# Data Loading Optimization Report (2026-03-02)

Investigation into training data loading bottleneck in the lerobot fork.
Machine: NVIDIA L4 GPU, 8 CPU cores, 31GB RAM. Dataset: `dopaul/pcb_placement_100x_1st_item` (65K frames, 3 cameras, 100 episodes).

## Root Cause

**94% of `__getitem__` time was H.264 video decoding.** Each sample took ~326ms, of which ~306ms was `decode_video_frames_torchcodec` seeking into mp4 files for 3 cameras.

The videos have only **82 keyframes across 17,733 frames** (~1 keyframe every 7 seconds / 216 frames). Random-access seek requires decoding from the nearest keyframe forward, so on average each sample decodes ~108 intermediate frames just to retrieve the 1 frame it wants. This makes random video access ~100x more expensive than it needs to be.

The fact that `data_s` was nearly identical for ACT and Diffusion Policy (despite completely different preprocessors) confirmed the bottleneck was in the DataLoader workers, not in main-thread preprocessing.

## Profiling Data

### Per-sample `__getitem__` timing (single-threaded, 50 random samples)

| Component | Mean | % of total |
|---|---|---|
| Full `__getitem__` | 326ms | 100% |
| Video decode (3 cameras) | 306ms | 94% |
| Everything else (parquet read, metadata) | 20ms | 6% |

### With image cache (JPEG pre-decoded)

| Component | Mean |
|---|---|
| Full `__getitem__` | 12ms |
| JPEG load (3 cameras) | ~10ms |

**27x faster per sample.**

## Experiments Run

All experiments: ACT policy, batch_size=16, 200 training steps, log_freq=25.
Metrics are averages after skipping first 2 log entries (warmup).

| Experiment | data_s | updt_s | Step time | Wall clock | Speedup |
|---|---|---|---|---|---|
| Baseline (num_workers=4) | 0.79s | 0.70s | 1.49s | 5:07 | — |
| num_workers=8 | 0.56s | 0.70s | 1.26s | 4:29 | 1.14x |
| nw=8 + persistent_workers | 0.55s | 0.70s | 1.25s | 4:26 | 1.15x |
| nw=8 + persistent_workers + prefetch_factor=4 | 0.55s | 0.71s | 1.26s | 4:29 | 1.14x |
| nw=8 + BackgroundPrefetcher (threading) | 0.56s | 0.72s | 1.28s | 4:31 | 1.13x |
| **nw=8 + persistent_workers + image cache** | **0.016s** | **0.70s** | **0.71s** | **2:28** | **2.1x** |

## What Worked

### 1. Pre-decoded image cache (massive win)

Pre-decoding all video frames to JPEG files and loading those instead of doing H.264 random seek. `data_s` dropped from 0.79s to 0.016s — effectively zero. Training became fully GPU-bound.

- Script: `scripts/predecode_videos.py`
- One-time cost: ~14 minutes for 196K frames (65K × 3 cameras)
- Disk: ~16GB of JPEG files at quality=95
- Transparent: `_query_image_cache()` in `lerobot_dataset.py` auto-detects the cache; falls back to video decode if absent

### 2. num_workers=8 (moderate win)

Doubling workers from 4 to 8 on an 8-core machine dropped `data_s` by 29% (0.79s → 0.56s). More workers = more parallel video decoding. Diminishing returns beyond core count.

### 3. persistent_workers=True (small win)

Avoids re-spawning worker processes between epochs. Small but free improvement, smooths out occasional `data_s` spikes at epoch boundaries.

## What Didn't Work

### BackgroundPrefetcher (threaded data/GPU overlap)

Attempted to overlap data loading with GPU training using a background thread + separate CUDA stream. The idea: `data_s + updt_s` (sequential) becomes `max(data_s, updt_s)` (overlapped).

**Result: no improvement.** Step times were identical to non-prefetched. The `data_s` metric (measuring `queue.get()` latency) remained ~0.56s, meaning the queue was always empty — the background thread couldn't produce batches concurrently with the main thread.

**Why it failed:** Python's GIL. While CUDA kernels and multiprocessing Queue waits release the GIL, the Python-level overhead between them (dict creation, iterator protocol, tensor attribute checks in both the preprocessor and update_policy) holds the GIL. The two threads effectively serialize. The background thread also slightly *increased* `updt_s` (0.72 vs 0.70) due to GIL contention.

**Lesson:** Threading-based GPU/data overlap in Python only works when both threads spend the vast majority of their time in GIL-releasing operations (C extensions, I/O). If there's meaningful Python control flow in either thread, the overlap collapses. True overlap would require `torch.multiprocessing` (separate processes with separate GILs) or a C-level solution like NVIDIA DALI.

### prefetch_factor=4 (no improvement)

Increasing the DataLoader's internal prefetch buffer from 2 to 4 batches per worker had no effect. The bottleneck was per-batch decode time in workers, not pipeline depth. With 8 workers and prefetch_factor=2, there were already up to 16 batches in flight.

## Key Insights for Future Work

1. **Always profile `__getitem__` before tuning DataLoader knobs.** The DataLoader parameters (num_workers, prefetch_factor, persistent_workers) only affect *parallelism of* the per-sample work. If the per-sample work is fundamentally expensive (like random-seek video decode), you need to eliminate that work entirely.

2. **Video datasets with infrequent keyframes are terrible for random-access training.** This is inherent to inter-frame compression (H.264, H.265, AV1). Options:
   - Pre-decode to image cache (what we did)
   - Re-encode with all-intra keyframes (every frame is a keyframe) — larger files but instant random access
   - Use NVIDIA NVDEC hardware decoder (torchcodec supports `device="cuda"`) — but can't be used in DataLoader workers due to CUDA init issues

3. **The lerobot training loop is strictly sequential** (`data_s + updt_s`). The GPU is idle during data loading. With the image cache, data loading is now <2% of step time, so this no longer matters. But for larger models or datasets where data loading creeps back up, the threading approach won't help (see GIL section above). A multiprocessing-based prefetcher or DALI integration would be needed.

4. **`data_s` being identical across policies (ACT vs Diffusion) was the key diagnostic clue.** It proved the bottleneck was in the workers (shared), not the main-thread preprocessor (policy-specific).

## Files Changed

| File | Change |
|---|---|
| `scripts/predecode_videos.py` | New: pre-decode all video frames to JPEG cache |
| `src/lerobot/datasets/lerobot_dataset.py` | Added `_query_image_cache()` — transparent JPEG cache fallback |
| `src/lerobot/scripts/lerobot_train.py` | Added `persistent_workers=True` to DataLoader |
| `configs/pcb100x_act.json` | Added `"num_workers": 8` |
| `configs/pcb100x_dp.json` | Changed `"num_workers": 0` → `8` |
| `ledream_changelog.md` | Documented changes |

## How to Use

```bash
# One-time: pre-decode video frames (~14 min, ~16GB disk)
python scripts/predecode_videos.py --repo-id dopaul/pcb_placement_100x_1st_item

# Then train normally — image cache is auto-detected
make train CONFIG=pcb100x_act
```

The cache lives at `{dataset_root}/image_cache/` alongside the videos. Delete it to revert to video decoding.
