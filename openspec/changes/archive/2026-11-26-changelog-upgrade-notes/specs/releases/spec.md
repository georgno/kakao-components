# Spec Delta

## ADDED Requirements

### Requirement: Upgrade note per version
Every version section in CHANGELOG.md, Unreleased included, SHALL start with an upgrade note: `**Upgrade:** none.` when nothing breaks, else `**Upgrade:**` followed by one bullet per breaking change that says what a consumer has to change. The detailed entries follow unchanged.

#### Scenario: A version without breaking changes
- **WHEN** an agent reads the section of a version that broke nothing
- **THEN** its first line is `**Upgrade:** none.`

#### Scenario: A renamed attribute
- **WHEN** a change renames an attribute, setting or state, removes one, or adds a load-order requirement
- **THEN** the version's upgrade note has a bullet naming the old and the new form, or the file to load
