# Tasks

## 1. Tags and rule

- [x] 1.1 Map each CHANGELOG version (0.2.0 … 0.10.0) to its release commit from the commit log; verify every mapped commit is a "Release" commit or the one that moved the entries; show the mapping to the maintainer.
- [x] 1.2 AGENTS.md: release rule says every release gets an annotated tag on its release commit, pushed with it, and consumers pin a tag, not a commit hash or branch. Verify by reading the diff.

## Workflow follow-up

- After the maintainer confirms the mapping: create the missing local tags (v0.2.0, v0.2.1, v0.2.2, v0.3.0, v0.10.0); push them only when asked.
