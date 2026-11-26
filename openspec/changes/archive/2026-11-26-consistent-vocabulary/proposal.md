# Proposal

## Why

An agent in another project should be able to guess an attribute or event from one component and be right on the next. Today the badge and chip lack the warning tone, sizes and tones are written in forms the manifest can't read (so their values are missing from custom-elements.json and from the style checker's value table), only 5 headers have a SLOTS section, and a few names break the patterns the rest follow.

## What Changes

- The shared vocabulary is written down (spec `vocabulary`) and guarded by a test that reads custom-elements.json: tones, sizes, `*-label` / `*-text` names, event names, `list-data`.
- badge and chip get the `warning` tone (setting `--kakao-badge-warning` / `--kakao-chip-warning`).
- kakao-button accepts `type="reset"` (nine demos used it, and it rendered a plain button).
- kakao-setting accepts `layout="stacked"`, the name table and description-list use; `stack` keeps working.
- range-slider: `low-label` / `high-label` (the `<thing>-label` order every other component uses); `label-low` / `label-high` keep working, deprecated.
- Headers: SLOTS sections for every component with slots; enumerated values (size, tone, shape, side, layout, …) written as `a (default) · b · c` so the manifest types them; aside-menu's and stack's methods and events moved out of ATTRIBUTES; the checker-only `force` is no longer listed as a real attribute (toc, tooltip).
- tools/manifest.js: an entry with several names may continue on the next line (combobox's and password-input's form attributes were lost).
- Style checker: VALUES covers every enumerated attribute in the manifest; a test keeps the two equal.
- Breaking renames (event names, `hide-*` booleans) are listed, not done: see the vocabulary spec's "known exceptions" and the report.

## Capabilities

### New Capabilities
- `vocabulary`: the names components share and the test that checks them.

### Modified Capabilities
- `badge`: warning tone.
- `range-slider`: thumb label attribute names.
- `button`: type reset.
- `settings-group`: layout stacked.
- `style-checker`: the value table follows the manifest.
- `custom-elements-manifest`: multi-name entries, SLOTS everywhere.

## Impact

Component headers (most), badge.js, chip.js and their construction and demo pages, range-slider.js, tools/manifest.js, tools/style-check/helpers.js and tests, tools/tests/vocabulary.test.js, custom-elements.json, tokens.json, CHANGELOG.md. No breaking change.
