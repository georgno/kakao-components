# releases Specification

## Purpose
How kakao-components releases are cut and named, so that consumers and agents can pin a version and read what changed.

## Requirements

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

### Requirement: Upgrade note per version
Every version section in CHANGELOG.md, Unreleased included, SHALL start with an upgrade note: `**Upgrade:** none.` when nothing breaks, else `**Upgrade:**` followed by one bullet per breaking change that says what a consumer has to change. The detailed entries follow unchanged.

#### Scenario: A version without breaking changes
- **WHEN** an agent reads the section of a version that broke nothing
- **THEN** its first line is `**Upgrade:** none.`

#### Scenario: A renamed attribute
- **WHEN** a change renames an attribute, setting or state, removes one, or adds a load-order requirement
- **THEN** the version's upgrade note has a bullet naming the old and the new form, or the file to load
