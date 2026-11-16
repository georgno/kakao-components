# Design

## Context

kakao-button sets `title` on its inner `<button>` for icon-only buttons (`_syncTitle`). It mirrors every host `data-*` onto the inner button and removes inner `data-*` the host does not have. kakao-button has no long-press behaviour of its own: the menu form opens on click, and pointerdown only sets pointer capture and plays the press squash. Components never reach into each other; cross-component reactions go through `KakaoComponents` (shared/component-api.js). combobox and command-palette already use the popover API (`popover="manual"`) for top-layer panels.

## Goals / Non-Goals

**Goals:** one script that gives every opted-in element a themed label for mouse, keyboard and touch; buttons hook in without the tooltip knowing about buttons.

**Non-Goals:** rich content (links, markup) in the label (that is kakao-popover); an arrow; tooltips on disabled controls (browsers do not send them pointer or focus events reliably).

## Decisions

- **Delegation, one controller.** The script installs capture-phase listeners on `document` (pointerover/out, pointerdown/move/up/cancel, click, contextmenu, focusin/out, keydown, scroll) and finds the anchor in `event.composedPath()`: the first element that is the target of a connected `<kakao-tooltip for>` or has `data-tooltip`. This covers anchors added later and anchors in open shadow roots without per-element wiring. Alternative (each anchor wired on connect, a MutationObserver over the page) is heavier and misses shadow roots.
- **The bubble is a `<kakao-tooltip>`.** A dedicated element is its own bubble; `data-tooltip` anchors share one `<kakao-tooltip>` the script appends to `body` on first use, its text set as text content. Inside the shadow root, the `.bubble` is `popover="manual"` (top layer, above modal dialogs; no focus move) with `position: fixed` coordinates computed from the anchor's rect; without the popover API it is a fixed layer with a high z-index.
- **Button wiring through a public attribute.** The tooltip's public contract is `data-tooltip`; the button decides itself to use it. `_syncTitle` writes `data-tooltip` instead of `title` when `customElements.get('kakao-tooltip')` is set, and re-syncs on the `tooltip-ready` trigger (subscribed per instance on connect, released on disconnect) for a tooltip script that loads after the button. `_mirrorDataAttrs` keeps the inner `data-tooltip` it set itself (re-sync after mirroring). The button registers the reaction, the tooltip the trigger, so the wiring shows in `KakaoComponents.meta()`. Alternative (the tooltip strips the button's inner `title`): reaches into another component's DOM and races with its re-syncs.
- **Long-press without click.** On touch pointerdown on an anchor, a 500ms timer starts; pointermove beyond 10px, pointerup, pointercancel (the browser starting a pan) or scroll clears it. When it fires, the label shows and a "swallow next click" flag is set for the anchor; the capture-phase click listener on `window` (registered before any component's bubbling/target listeners run) calls `preventDefault()` and `stopImmediatePropagation()` once, the flag expiring 800ms after pointerup. `contextmenu` during a pending or fired long-press is prevented. A document-level adopted stylesheet sets `-webkit-touch-callout: none` and, for coarse pointers, `user-select: none` on `[data-tooltip]` and on dedicated anchors (marked `data-kakao-tooltip-anchor`), so iOS shows no callout and no selection starts. Pointer capture taken by kakao-button does not matter: listeners are on the document in capture phase.
- **Escape is consumed only while a label is visible**, so the first Escape hides the label and a second one reaches the dialog.
- **Title put aside on show** (stored in `data-kakao-tooltip-title`, restored on hide), not on pointerover: the hover delay is shorter than the native one (~1s), so the native tooltip never gets a chance.
- **aria-describedby** only when the text differs from the anchor's `aria-label` (else its trimmed text) and the bubble is in the anchor's root; added while visible for the shared bubble, permanently for a dedicated element (its text is stable). Existing describedby ids are kept.
- **Timing constants** as `KakaoTooltip.delays = { hover, longPress, touchHide }` (like `KakaoToc.texts`), not CSS properties: they are behaviour, not looks.
- **Placement values** `top|bottom|left|right` go into `VALUES` for `kakao-tooltip` (`placement`).

## Risks / Trade-offs

- [iOS may still fire a click after a long hold] → the click swallow covers it whether or not it fires; the flag expires so a later real tap works.
- [`user-select: none` on coarse-pointer devices stops selecting a tooltip anchor's text] → documented; anchors are controls in practice.
- [A page that listens to clicks on `window` in capture phase, registered earlier, still sees the swallowed click] → acceptable; documented.
- [Disabled buttons get no tooltip] → the native `title` fallback has the same gap in several browsers; noted as a non-goal.
