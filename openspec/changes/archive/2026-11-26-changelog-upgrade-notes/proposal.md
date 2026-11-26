# Proposal

## Why

An agent deciding whether it can move a project to a newer version has to read the whole changelog today (about 900 lines) to find the few changes that break something. A short upgrade note per version answers that in about ten lines.

## What Changes

- Every version in CHANGELOG.md (and Unreleased) opens with `**Upgrade:** none.` or `**Upgrade:**` plus one bullet per breaking change saying what to change. The detailed entries below stay as they are.
- The changelog intro explains the line; AGENTS.md makes it part of every changelog entry and release.

## Capabilities

### New Capabilities

### Modified Capabilities
- `releases`: adds the upgrade note per version.

## Impact

CHANGELOG.md, AGENTS.md. changelog.html already renders a paragraph or list under a version heading.
