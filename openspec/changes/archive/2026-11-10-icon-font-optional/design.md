# Design

## Context

Button is light DOM (no `<slot>` available); text input is shadow DOM. Both expose an `icon` attribute that takes icon-font classes. The demo site vendors Font Awesome in `shared/vendor/fontawesome`; components themselves must not need it.

## Decisions

- **Button success check**: an inline SVG path (`M5 12.5l4.5 4.5L19 7.5`, the menu check's shape) styled like the chevron: no fill, `currentColor` stroke, round caps. It is sized with the existing `--_spinner-size` so check and spinner match; no new setting, so the settings block and construction page stay unchanged.
- **Button icon "slot"**: light DOM has no slots, so the button moves a direct child with `slot="icon"` into the icon span of the current `icon-position` (left for left / only, right for right). One element, moved between the two spans on each sync, never cloned, so it is never duplicated. A `MutationObserver` on the host's child list picks up an icon added later; the button's own inner nodes are not direct children with `slot="icon"`, so they are ignored. While a slotted icon is present the `<i>` used by the `icon` attribute is removed from the span; it is put back when the slotted icon is gone. Slotted SVGs get a default 1em square size through a zero-specificity rule, so page CSS can override it.
- **Text input**: a `<slot name="icon">` inside the existing icon box. The box hides when the slot has no assigned nodes (`slotchange` toggles a class), replacing `.icon:empty`, which was always true before. The `icon` attribute creates a light-DOM `<i slot="icon" data-kakao-icon>` child (in `connectedCallback` / attribute changes, never in the constructor) carrying the classes; it is removed when the attribute goes away or when the page supplies its own `slot="icon"` child. This keeps the shortcut working with a page icon font, the same contract as the button's attribute, so nothing is deprecated.
- **Slotted size**: `::slotted(svg)` in the text input gets `width/height: 1em` at the existing `--_icon-size` font size.

## Risks

- Generating a light-DOM child (text input) can surprise a framework that owns the element's children. Mitigation: it only happens with the `icon` attribute, and is marked `data-kakao-icon`; the slot is the recommended way.
