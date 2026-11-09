# Proposal

## Why

The checkbox box and the radio dot sit visibly higher than their label text (up to ~3px at the small size), because they are top-aligned while the label line is taller than the control. Radio options are also spaced far apart (about 29px between rows) compared with stacked checkboxes (8px), so a radio group reads loose and the two controls do not match.

## What Changes

- Checkbox: the box is centred on the first line of the main label at every size (sm, md, lg), whether or not a hint, error or wrapping label follows.
- Radio group: each dot is centred on the first line of its option label the same way.
- Radio group: tighter defaults in its settings block (`--kakao-radio-group-option-gap`, `--kakao-radio-group-option-padding`) so rows sit 8px apart, matching stacked checkboxes.
- Demo pages that stack checkboxes use the same 8px (`.5rem`) gap.

## Capabilities

### New Capabilities
- `checkbox`: layout of `<kakao-checkbox>`: box alignment against its label.
- `radio-group`: layout of `<kakao-radio-group>`: dot alignment and option spacing.

### Modified Capabilities
None.

## Impact

`components/checkbox/checkbox.js`, `components/radio-group/radio-group.js` (shadow CSS and settings block), `components/checkbox/demo.html`, `CHANGELOG.md`. No API or attribute changes; pages that override `--kakao-radio-group-option-gap` / `-option-padding` keep their values.
