# Spec Delta

## Purpose

How kakao-components releases are cut and named, so that consumers and agents can pin a version and read what changed.

## ADDED Requirements

### Requirement: Every release is tagged
Every version in CHANGELOG.md SHALL have an annotated git tag `vX.Y.Z` on the commit that released it (the commit that moved the entries under the version and bumped the version on index.html).

#### Scenario: Cutting a release
- **WHEN** a release moves the Unreleased entries under a new version
- **THEN** the release commit gets the tag `vX.Y.Z` and the tag is pushed with it

#### Scenario: Older versions
- **WHEN** the changelog lists a version from 0.2.0 on
- **THEN** a tag of that version exists on its release commit

### Requirement: Consumers pin a tag
Documentation for consumers SHALL tell them to pin a release tag, never a commit hash or a branch.

#### Scenario: Vendoring the library
- **WHEN** a project copies or loads the library
- **THEN** the documented way pins a tag such as `v0.10.0`
