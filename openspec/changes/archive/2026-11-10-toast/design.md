# Design

## Context

See proposal.md for the motivation and specs/toast/spec.md for the behaviour. `<kakao-alert>` (shadow DOM) already draws the tinted box, icon, title, close button, sets `role` per tone, runs a pausing timer and fades + collapses on hide; it exposes `show()`, `hide()`/`close()` and the events `alert-hide` (cancelable) and `alert-hidden`. The yii2-base toast (`web/js/toast.js`, `web/css/toast.css`, `widgets/views/toast/container.php`) is a fixed `.toast-container` with `.toast` children: newest last and in front, older ones scaled down (−5 % each), faded, translated up and tilted back with `rotateX` under a `perspective`; hovering the container restores every card and pauses all timers; close and timeout slide the card out to the right; at ≤576px it is nearly full width. The aside menu emits `aside-open { position, width }` / `aside-close { position }` triggers; the header bar publishes `--kakao-header-bar-rendered-height` on the root. Dialog sits at z-index 60, aside panel 40, header bar 30.

## Goals / Non-Goals

**Goals:** the yii2 stacked feel as one inlineable shadow-DOM file; toasts that are alerts (no second look to maintain); correct announcements without focus moves; a stack that never hides a message it has not shown.

**Non-Goals:** swipe-to-dismiss; a keyboard hotkey to jump to the region; promise/loading toasts; centre positions; changes to `<kakao-alert>`.

## Decisions

**`<kakao-toast>` is the region; the items are `<kakao-alert>`.** One component per folder named after its tag (`components/toast/toast.js` → `kakao-toast`), and the item element already exists. A separate `<kakao-toast-region>` + `<kakao-toast-item>` pair would add a tag that only wraps an alert and would break the folder/tag match. The name reads naturally in markup (`<kakao-toast position="top-right">`), the yii2 container maps to it 1:1 (server-rendered children become `<kakao-alert>` children) and pages can still create alerts themselves and append them. Alternative considered: a toast item element that renders a kakao-alert inside its shadow root — two shadow layers, and attributes would have to be forwarded.

**Composition through the alert's public API only.** The region sets attributes on the alerts it creates, listens to `alert-hide` / `alert-hidden` and calls `close()`; it never reaches into the alert's shadow root. The alert's look reaches the cards through ordinary inheritance; the region adds only what belongs to a floating card (shadow, radius matched through `--kakao-alert-radius`).

**The region owns the timers.** Each adopted alert gets `duration="0"` (its own timer off) and the region runs one timer per toast with the alert's rule (author `duration` first, else 0 for warning/danger, else `--kakao-alert-duration`). Reasons: the stack pauses as a whole when expanded (yii2 behaviour; hovering one card must not let its neighbours vanish under the pointer), and toasts beyond `max` must not run out unseen — neither can be done through the alert's per-element timer without changing it. On timeout the region records reason `timeout` and calls `close()`.

**Layout by measured heights, CSS transforms.** Cards are `position: absolute` in the fixed host and placed by custom properties the region sets on each item (`--_toast-y`, `-s`, `-o`, `-z`, `-clip`) that a `::slotted(kakao-alert)` rule turns into `transform` / `opacity` / `clip-path`. Collapsed, card *i* (0 = front) is scaled `1 − i·scale-step`, made paler (its alert tint and border mix times `1 − i·fade-step`, through `--kakao-alert-tint` / `--kakao-alert-border-mix` on the card), tilted `i·tilt` with `rotateX` (host `perspective`), and translated so its edge peeks `i·peek` past the card in front; each back card is clipped to its peeking strip. The yii2 toast faded cards with `opacity`; that let text of the cards behind and of the page show through the strips, so the cards stay opaque and the fade is a paler tint. Expanded, cards are stacked with the gap at full size. The host's height follows the stack so the hover area has no holes (no flicker between cards). Heights come from `offsetHeight` (unaffected by transforms) and a ResizeObserver re-lays out on wraps and theme/font changes. Alternative considered: the yii2 `:nth-last-child` rules with negative margins — they cannot express `max`, mirroring for top corners, or clipping, and still take the full height of every card in the layout.

**`max` hides, it does not queue outside the DOM.** All toasts stay children (declarative ones are there anyway); the ones beyond `max` get `visibility: hidden` (out of the accessibility tree, no tab stops) behind the stack, and their timer does not run. A card that holds focus stays visible past `max`, so focus never sits on a hidden card. They were already announced when inserted, so a late reveal is silent; the alternative (holding them outside the DOM) would delay the announcement but would treat written and scripted toasts differently.

**Live region.** The host gets `role="region"`, `aria-label` (from `label`, default "Notifications") and `aria-live="polite"`, so a toast inserted into it is announced; the alert's own `role` (`status` polite, `alert` assertive) stays and decides urgency. When the helper creates the region it inserts it first and adds the first toast a frame later, so the live region exists before its content. Nothing calls `focus()`.

**Leaving.** On an uncancelled `alert-hide` (checked in a microtask, after page listeners) the card is marked leaving: it drops out of the stack order so the others move up, and slides out towards its side (`translateX(±110 %)`) while the alert fades itself. On `alert-hidden` the element is removed and `toast-hidden` fires. The alert's focus restore runs before removal.

**Touch.** `pointerenter`/`pointerleave` expand for mouse and pen; for touch a tap on the stack (`pointerup`, not on a button) toggles it and a `pointerdown` outside collapses it, because touch fires `pointerleave` right after lifting the finger.

**Placement.** Insets are `calc(gutter + env(safe-area-inset-*))`; top corners add `var(--kakao-header-bar-rendered-height, 0px)`. Below 30rem the host spans both sides. z-index 70 by default: above the aside panel and the dialog overlay, so a message shown while a dialog is open is still seen. The aside: the region listens to the `aside-open` / `aside-close` triggers (declared as reactions); when the menu opens on its side and at least the toast width is left beside the panel, the host translates by the panel width (`translate`, transitioned); otherwise it stays on top of the panel.

**Action button.** A `<kakao-button size="sm" variant="secondary">` when `kakao-button` is defined (the library's button), else a native `<button>`, in a row under the message inside the alert's default slot.

**Settings.** `--kakao-toast-width` (22rem), `-gutter` (1rem), `-gap` (0.5rem), `-peek` (10px), `-scale-step` (0.05), `-fade-step` (0.18), `-tilt` (6deg), `-perspective` (1000px), `-shadow`, `-z-index` (70), `-duration` (stack motion, default the motion token) and `-ease` (default the standard ease). The auto-hide time stays the alert's `--kakao-alert-duration` so one setting decides both.

## Risks / Trade-offs

- [Timers are duplicated from the alert] → same rule and the alert's duration setting; documented in both headers.
- [On a phone an open aside panel leaves no room] → the stack stays where it is, above the panel; a message is still readable.
- [A region in the page at load does not announce written toasts] → documented; server flash messages are visible, not announced (as with any live region present at load).
- [Hidden toasts beyond `max` are not reachable by keyboard] → they come forward as soon as a visible one leaves; `max` can be raised.
- [`max` toasts expanded on a short phone screen may run past the top] → with the default `max` of 3 short toasts it fits a 390 × 664 viewport; the demo says to keep `max` low and messages short.

## Open Questions

- Whether a hotkey (e.g. Alt+T) should move focus to the region, like other toast libraries offer.
