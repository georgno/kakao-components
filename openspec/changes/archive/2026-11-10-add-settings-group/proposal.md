# Proposal

## Why

Settings screens (account, notifications, privacy) all use the same layout: a titled group of rows, each row a label with an optional hint on one side and its control on the other, rows divided by hairlines. Pages build it by hand today, each with its own spacing, and the label is rarely tied to the control. The library needs one component for it that works with every control in the library, in a card, in an accordion and on its own.

## What Changes

- New component `<kakao-settings-group>` with a row element `<kakao-setting>`, both defined in `components/settings-group/settings-group.js` (one folder, one file, one settings block), shadow DOM.
- Group: title (`heading` attribute or `title` slot), optional description, optional `footer` note, `heading-level` for real heading semantics; exposed as a named group. Look `box` (surface, hairline border, 14px radius) on its own, `plain` (no surface, no side padding) inside a card, accordion, dialog or aside sheet; `variant` forces one.
- Row: label and hint (attributes or slots), an optional leading `icon` slot, the control in the default slot at the end. The row names the control from its label (`aria-label`, or `label` for components whose label is the accessible name) unless the control is already named, and describes native controls with the hint (`aria-description`).
- Link rows (`href`): the whole row is a link with a chevron and an optional trailing value. Action rows (`action`): the whole row is a button that sends `setting-action`. `variant="danger"` for destructive rows, `disabled` for unavailable ones.
- Narrow rows stack the control under the label through a container query on the row (not the viewport); rows with a switch or a checkbox keep it beside the label. `layout` forces `inline` or `stack`.
- Settings block (`--kakao-settings-group-*`), construction page, demo page with real sibling controls.
- Small change to `<kakao-switch-group>`: a switch whose label is empty takes the group's `label` as its accessible name and draws no empty label box, so a single switch can sit in a row whose label names it.

## Capabilities

### New Capabilities
- `settings-group`: group and row structure, control naming, link / action / danger / disabled rows, narrow layout, looks by context, theming hooks.

### Modified Capabilities

None (the switch-group change is a fallback for a case its spec does not cover).

## Impact

- New: `components/settings-group/{settings-group.js,demo.html,construction.html}`. No new token, no dependency.
- Changed: `components/switch-group/switch-group.js` (empty item label).
- Wiring done later: `components.html`, `styleguide.html` audit row, `CHANGELOG.md`, possibly `kitchen-sink.html`.
