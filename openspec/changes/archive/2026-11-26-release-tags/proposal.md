# Proposal

## Why

Agents and other projects that use the library need a fixed point to pin, and today only some releases are tagged (v0.4.0, v0.5.0, v0.8.0, v0.9.0). A commit hash says nothing about what it contains; a tag names a release in the changelog.

## What Changes

- Every version in CHANGELOG.md from 0.2.0 on gets an annotated tag `vX.Y.Z` on its release commit (the mapping is checked against the commit log; tags are created locally once the maintainer confirms it).
- AGENTS.md: every release gets a tag on its release commit, and consumers pin a tag, never a commit hash or a branch.

## Capabilities

### New Capabilities
- `releases`: how a release is cut and named, and what consumers pin.

### Modified Capabilities

## Impact

AGENTS.md (release rule); git tags (local until confirmed). No component changes.
