# Design

## Context

See proposal.md for the motivation and specs/alert/spec.md for the behaviour. Badge and chip already name their colour attribute `tone` (neutral, primary, success, danger, ink) and share the "Status tones" recipe in the style guide: fill = tone mixed into the surface, text = tone mixed into the theme text colour. The tokens have `danger` and `success` roles but nothing for warning. Card already reads a duration setting from its settings block (`--_resize-duration`, parsed in JS), so a time in the settings block is an existing pattern.

## Goals / Non-Goals

**Goals:** one shadow DOM file like its siblings; tones that follow every theme; correct live-region roles; a timer that never takes a message away from someone still reading it.

**Non-Goals:** floating / stacked toasts (the next component, which can reuse this one); an action-button slot (a link or `kakao-button` in the message works today); progress bar for the timer.

## Decisions

**`tone`, not `variant`.** Badge and chip use `tone`, and `variant` on button means a visual style (primary / secondary / ghost / danger), not a meaning. Values `info | success | warning | danger` keep `danger` as the shared word; `error` is accepted as an alias because it is what people type for alerts. Info uses `--kakao-color-primary` (badge's "primary" tone), success and danger their roles.

**A new `--kakao-color-warning` role.** A hard-coded amber would break the rule that every colour follows the theme. The role gets a value per theme and a `warning / bg 4.5:1` pair in `check-themes.js`, like success. Alternative considered: deriving warning from danger with `color-mix` — reads as a weak red, not a warning.

**Colour recipe.** Background: tone 10% into the surface (lighter than the badge's 16%, because the alert is a large area under body text). Border: tone 28% into the surface, a hairline that also marks the box in forced colours. Icon and title colour: the badge text recipe (tone 72% into the text colour), proven 4.5:1 in all themes. Message: the plain theme text colour. All numbers are settings.

**Auto-hide default depends on the tone.** The user asked for a default fade time, so info and success hide after `--kakao-alert-duration` (8000ms; the setting). Warning and danger have no default timer: an error the user did not get to read is worse than one that stays. Auto-hiding inline content is an accessibility risk (WCAG 2.2.1 Timing Adjustable, 2.2.2 for moving/updating content; screen reader and magnifier users may reach the message late; low-literacy and cognitive users read slower). Mitigations: only non-critical tones hide by default; 8s is above the usual 5s toast default and leaves time for about 25 words; the timer pauses on hover, focus inside and while the tab is hidden; `duration="0"` turns it off. Authors should not put the only copy of important information in an auto-hiding alert; the demo says so.

**`duration="0"` turns it off, no `persistent` attribute.** One numeric attribute covers every case; a second boolean would allow contradictions (`persistent duration="3000"`). A value above zero on a warning or danger alert opts it into hiding. A missing or invalid value falls back to the tone's default.

**Hide = `hidden`, not removal.** The element stays in the DOM so `show()` can bring it back and frameworks keep their reference. Pages that want it gone call `remove()` on `alert-hidden`.

**Fade and collapse.** Hiding fades opacity and collapses the height together (a grid `1fr → 0fr` row transition inside the shadow root, so the content below glides up instead of jumping), over `--kakao-alert-fade-duration` (default `--kakao-motion-duration`) with `--kakao-ease-standard`. `transitionend` plus a timeout fallback set `hidden`. Under reduced motion the transition is removed and `hidden` is set right away. The host's own margin is not animated (page CSS owns it).

**Role on the host.** The host carries the role so the slotted message is inside the live region. The component sets it with `setAttribute` only when the author did not write one (remembered at connect), and updates it on tone change. ElementInternals roles were considered, but live-region announcements from internals roles are not reliable across browsers yet.

**Focus after closing.** If focus is inside the alert when it hides, it returns to the element focus came from (the `focusin` `relatedTarget`, if still connected), else it is blurred to the page, so keyboard users don't lose their place to `<body>` silently.

**Close icon.** The same stroked X as the chip's remove button (round caps), drawn small in a 24px+ tap target, hover fill `currentColor 12%`, focus ring in the focus colour. Tone icons are stroked 16px glyphs (circle-i, circle-check, triangle-!, circle-!) in the same stroke style.

**Events.** `alert-show`, `alert-hide` (cancelable) and `alert-hidden`, bubbling and composed, also emitted through `KakaoComponents.emit` and declared with `register()`, like dialog.

## Risks / Trade-offs

- [Auto-hide removes content a user still needs] → only info/success by default, pause on hover/focus/hidden tab, off with `duration="0"`, documented.
- [A `role="alert"` present at page load is not announced by most screen readers] → documented: insert or `show()` the alert after load to have it announced.
- [The warning colour sits close to the primary in the warm themes (beige, umber)] → icon shape differs per tone; values can be tuned on tokens.html.
- [The collapse animation cannot animate margins set by the page] → small jump of the margin only; the demo uses gap-based layouts.
