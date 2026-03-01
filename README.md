# LeDream - PCB Placement Training & Deployment

> Fork of [LeRobot](https://github.com/huggingface/lerobot) for PCB placement task training and evaluation. See [lerobot_readme.md](lerobot_readme.md) for the original LeRobot documentation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Naming Convention](#naming-convention)
- [Hugging Face Data & Model Management](#hugging-face-data--model-management)
- [Makefile Quick Reference](#makefile-quick-reference)
  - [Robot & Recording](#robot--recording)
  - [Training](#training)
  - [Quick Eval (real robot)](#quick-eval-real-robot)
  - [Job & Checkpoint Management](#job--checkpoint-management)
- [Training Configs](#training-configs)
  - [Config file format](#config-file-format)
  - [Creating a new config](#creating-a-new-config)
- [Raw Training Commands (reference)](#raw-training-commands-reference)
  - [ACT](#act)
  - [Diffusion Policy (DP)](#diffusion-policy-dp)
  - [pi0.5 (pi05)](#pi05-pi05)

## Prerequisites

```bash
hf auth login
```

## Naming Convention

All HF model repos follow this pattern going forward:

```
{dataset}_{policy}[-{variant}]-{checkpoint}
```

- **dataset** -- short alias for the training dataset (e.g. `pcb100x`, `pcb_v1`)
- **policy** -- policy type (e.g. `act`, `dp`, `pi05`)
- **variant** -- optional experiment tag (e.g. `novae`, `b32`, `kl10`)
- **checkpoint** -- zero-padded step number (e.g. `010000`)

Examples:

| Config name | HF model repo (with checkpoint) | Eval dataset |
|-------------|--------------------------------|--------------|
| `pcb100x_act` | `dopaul/pcb100x_act-010000` | `dopaul/eval_pcb100x_act-010000` |
| `pcb100x_dp` | `dopaul/pcb100x_dp-002000` | `dopaul/eval_pcb100x_dp-002000` |
| `pcb_v1_pi05` | `dopaul/pcb_v1_pi05-001000` | `dopaul/eval_pcb_v1_pi05-001000` |

The config filename doubles as the `job_name` and `output_dir` name, keeping everything aligned.

## Hugging Face Data & Model Management

Upload a dataset:

```bash
hf upload dopaul/pcb_placement_100x_1st_item ~/.cache/huggingface/lerobot/dopaul/pcb_placement_100x_1st_item . --repo-type dataset
```

Download a dataset:

```bash
hf download dopaul/DATASET_NAME --repo-type dataset --local-dir ~/.cache/huggingface/lerobot/dopaul/DATASET_NAME
```

## Makefile Quick Reference

All `make` commands should be run from the `ledream/` directory.

### Robot & Recording

| Command | Description |
|---------|-------------|
| `make biteleop` | Bimanual teleoperation (DK1 leader/follower) |
| `make birecord` | Bimanual recording with 3 cameras |
| `make birest` | Move arms to rest pose |
| `make teleop-arms` | SO-100 arm teleoperation |
| `make record-arms` | SO-100 arm recording |
| `make snapshot` | Capture a snapshot from all cameras |

Override defaults with variables, e.g.:

```bash
make birecord DATASET_REPO_ID=dopaul/my_dataset DATASET_NUM_EPISODES=50
```

### Training

Training configs live in `configs/*.json`. Each file defines a full experiment (dataset, policy type, hyperparameters).

List available configs:

```bash
make list-configs
```

```
CONFIG                    POLICY       DATASET
------                    ------       -------
pcb100x_act               act          dopaul/pcb_placement_100x_1st_item
pcb100x_dp                diffusion    dopaul/pcb_placement_100x_1st_item
pcb_v1_pi05               pi05         dopaul/pcb_placement_v1
```

Print the training command (for pasting into Lightning AI job UI):

```bash
make train-cmd CONFIG=pcb100x_act
```

Run training locally:

```bash
make train CONFIG=pcb100x_act
```

Override any parameter on the fly:

```bash
make train CONFIG=pcb100x_act OVERRIDES="--steps=50000 --batch_size=32"
```

### Quick Eval (real robot)

Run any HF model on the bimanual DK1 robot with a single command:

```bash
make eval MODEL=dopaul/pcb100x_act-010000
```

This auto-generates the eval dataset name (`dopaul/eval_pcb100x_act-010000`) and fills in all camera/port defaults.

For throwaway tests where you don't care about the eval dataset:

```bash
make eval MODEL=dopaul/pcb100x_act-010000 EPHEMERAL=true
```

`EPHEMERAL=true` deletes the local eval dataset before and after the run, avoiding "already exists" errors and saving disk space.

Other overrides:

```bash
make eval MODEL=dopaul/pcb100x_dp-002000 EVAL_EPISODES=5 EVAL_TIME_S=20 EVAL_VELOCITY=0.3
```

### Job & Checkpoint Management

List all training jobs and their latest checkpoint:

```bash
make list-jobs
```

```
JOB                            TRAIN_NAME                                         LATEST_CKPT
---                            ----------                                         -----------
100x-pcb-act-b16               pcb_placement_1st_item_act_48acl                   010000
100x-pcb-dp-0zxpw              pcb_placement_100x_1st_item_diffusion              002000
pi-pcb                         (no checkpoints)                                   -
```

List all checkpoints for a specific job:

```bash
make list-checkpoints JOB=100x-pcb-act-b16
```

Upload the latest checkpoint from a job to Hugging Face:

```bash
make upload-latest JOB=100x-pcb-act-b16
```

Upload a specific checkpoint or with a custom repo name:

```bash
make upload-latest JOB=100x-pcb-act-b16 CKPT=004000
make upload-latest JOB=100x-pcb-act-b16 REPO=pcb100x_act-010000
```

The default HF user is `dopaul`. Override with `HF_USER=someone_else`.

## Training Configs

### Config file format

Configs are minimal JSON files in `configs/`. They only contain the fields you care about -- everything else uses lerobot defaults. The format matches lerobot's `train_config.json` (draccus).

Example (`configs/pcb100x_act.json`):

```json
{
    "dataset": {
        "repo_id": "dopaul/pcb_placement_100x_1st_item"
    },
    "policy": {
        "type": "act",
        "device": "cuda",
        "use_amp": true,
        "chunk_size": 48,
        "n_action_steps": 30,
        "use_vae": true,
        "kl_weight": 10.0,
        "optimizer_lr": 3e-5,
        "optimizer_lr_backbone": 3e-5
    },
    "batch_size": 16,
    "steps": 10000,
    "save_checkpoint": true,
    "save_freq": 2000,
    "log_freq": 100,
    "wandb": { "enable": true }
}
```

The `output_dir` and `job_name` are auto-set by the Makefile to match the config filename (e.g. `pcb100x_act`), so they don't need to be in the JSON.

### Creating a new config

1. Copy an existing config and rename it following the naming convention:

```bash
cp configs/pcb100x_act.json configs/pcb100x_act_novae.json
```

2. Edit the fields you want to change (e.g. set `"use_vae": false`)
3. Verify with `make list-configs`
4. Generate the command with `make train-cmd CONFIG=pcb100x_act_novae`

You can also create a config from an existing checkpoint's `train_config.json` -- just strip it down to the fields you need.

## Raw Training Commands (reference)

The `make train` workflow above is preferred. These raw commands are kept as reference.

### ACT

```bash
HF_USER=dopaul
DATASET=pcb_placement_100x_1st_item
JOB_NAME=pcb_placement_1st_item_act_48acl
BASE_REPO=pcb_placement_1st_item_act_48acl

lerobot-train \
  --dataset.repo_id=${HF_USER}/${DATASET} \
  --policy.type=act \
  --output_dir=outputs/train/${JOB_NAME} \
  --job_name=${JOB_NAME} \
  --policy.device=cuda \
  --policy.use_amp=true \
  --policy.chunk_size=48 \
  --policy.n_action_steps=30 \
  --policy.use_vae=true \
  --policy.kl_weight=10 \
  --batch_size=16 \
  --policy.optimizer_lr=3e-5 \
  --policy.optimizer_lr_backbone=3e-5 \
  --steps=10000 \
  --log_freq=100 \
  --save_checkpoint=true \
  --save_freq=2000 \
  --wandb.enable=true \
  --policy.push_to_hub=true \
  --policy.repo_id=${HF_USER}/act_policy
```

### Diffusion Policy (DP)

```bash
HF_USER=dopaul
DATASET=pcb_placement_100x_1st_item
JOB_NAME=pcb_placement_100x_1st_item_diffusion

lerobot-train \
  --dataset.repo_id=${HF_USER}/${DATASET} \
  --policy.type=diffusion \
  --output_dir=outputs/train/${JOB_NAME} \
  --job_name=${JOB_NAME} \
  --policy.device=cuda \
  --policy.use_amp=true \
  --batch_size=64 \
  --num_workers=0 \
  --steps=5000 \
  --log_freq=100 \
  --save_checkpoint=true \
  --save_freq=1000 \
  --wandb.enable=true
```

### pi0.5 (pi05)

The guidelines provided by PI is between 1 to 20 hours of finetuning data for task adaptation.

```bash
# One-time setup (if needed)
# pip install -e ".[pi]"
# IMPORTANT: request and approve access to gated model:
# https://huggingface.co/google/paligemma-3b-pt-224

HF_USER=dopaul
DATASET=pcb_placement_v1
JOB_NAME=pcb_placement_v1_pi05

# Required for default QUANTILES normalization (q01/q99)
python src/lerobot/datasets/v30/augment_dataset_quantile_stats.py \
  --repo-id=${HF_USER}/${DATASET}

lerobot-train \
  --dataset.repo_id=${HF_USER}/${DATASET} \
  --policy.type=pi05 \
  --policy.pretrained_path=lerobot/pi05_base \
  --output_dir=outputs/train/${JOB_NAME} \
  --job_name=${JOB_NAME} \
  --policy.compile_model=true \
  --policy.gradient_checkpointing=true \
  --policy.dtype=bfloat16 \
  --policy.device=cuda \
  --batch_size=32 \
  --steps=3000 \
  --save_checkpoint=true \
  --save_freq=500 \
  --wandb.enable=true
```
