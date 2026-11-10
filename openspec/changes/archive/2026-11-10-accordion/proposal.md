# Proposal

## Why

The overview still lists Accordion as missing, with two bare native `<details>` as placeholder. Pages need a disclosure that matches the library's card (FAQ entries, settings sections, grouped options), animates open and closed, and still reads clean when one accordion sits inside another.

## What Changes

- New component `<kakao-accordion>` (`components/accordion/`), shadow DOM, built on native `<details>` / `<summary>`. At the top level it looks like `<kakao-card>` (surface, hairline border, 14px radius, card padding).
- Header row: title (`heading` attribute or `title` slot), optional description (`description` attribute or slot), optional `meta` slot for trailing text or a badge, and a chevron that turns when the accordion opens. The default slot is the body and takes any content.
- `open` attribute and property, `toggle(force?)`, `show()`, `hide()`, and a bubbling, composed `accordion-toggle` event (also sent as a trigger).
- `name` groups accordions so only one per group is open, like exclusive `<details name>`.
- Opening and closing animates the height (`--kakao-motion-duration`, standard easing); no motion under reduced motion, with `no-animate`, or on first render.
- Nesting: the look steps down by depth. Level 1 is a card, level 2 a borderless tinted tile, level 3 and deeper flat rows divided by hairlines; level 4 and deeper also indent. A `variant` attribute (`card`, `tile`, `row`) overrides the automatic choice.
- Settings block (`--kakao-accordion-*`), construction page, demo page; a real Accordion section on `components.html` replacing the placeholder, a style guide audit row, a use on `kitchen-sink.html` if one fits.

## Capabilities

### New Capabilities
- `accordion`: the disclosure card: header parts, open state and API, toggle event, exclusive groups, height motion and reduced motion, keyboard and screen reader behaviour, nesting looks, theming hooks.

### Modified Capabilities

None.

## Impact

- New: `components/accordion/{accordion.js,demo.html,construction.html}`. No dependencies, no new token.
- Pages: `components.html`, `styleguide.html` (audit row), possibly `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged.
