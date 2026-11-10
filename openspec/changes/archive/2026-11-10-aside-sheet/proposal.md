# Proposal

## Why

The library has a centred modal (`kakao-dialog`) and a page-pushing side menu (`kakao-aside-menu`), but nothing for the common "sheet" pattern: a card that slides in from an edge of the viewport over the page (filters, details, a share sheet, a short form), which on phones is the natural replacement for a centred dialog.

## What Changes

- New component `<kakao-aside-sheet>` (`components/aside-sheet/`), shadow DOM, built on the same plain fixed overlay as `kakao-dialog` (no `<dialog>` + `showModal()`), so phones, tablets and desktops behave the same.
- `side` attribute: `bottom` (default), `top`, `start`, `end`; `start` / `end` follow the writing direction (RTL-aware). `left` / `right` are accepted as physical aliases.
- The card look of the dialog (raised surface, overlay shadow level 3, 14px radius), rounded only on the corners that face into the page, so the sheet reads as pushed in from outside the view.
- Opening: `open` attribute, `show()` / `hide(returnValue?)` / `toggle()`, `isOpen`; a declarative trigger through `for` (ids of the elements that open it, as `kakao-popover` uses `for`); `data-close` on any element inside closes it, as in the dialog.
- Modal by default (scrim, focus moved in and trapped, Escape, scrim click, page scroll locked, focus returned); `modal="false"` drops the scrim, the trap and the scroll lock. `no-dismiss` and `contained` as in the dialog.
- Slots: `header` (title; a built-in close button sits beside it), default (body, the only part that scrolls), `footer`. Bottom / top sheets get a max height (85dvh) and keep the safe-area insets; start / end sheets get a width setting capped at the viewport width. Optional drag `handle` on bottom sheets; dragging it (or the header) down closes the sheet.
- Motion: slides in on the spring curve and the motion duration tokens, leaves on the standard curve; the scrim fades. Under reduced motion only a fade.
- Events: `sheet-show`; `sheet-hide` (cancelable, before closing, with a reason); `sheet-hidden` (after the sheet has left). Also emitted as triggers.
- Settings block (`--kakao-aside-sheet-*`), construction page, demo page; listed on `components.html`, in the style guide audit, and used on `kitchen-sink.html`.

## Capabilities

### New Capabilities
- `aside-sheet`: the edge sheet: sides and direction, shape, opening and closing (attribute, methods, `for` triggers, `data-close`), modal and non-modal behaviour, focus, keyboard, scroll lock, slots and sizing, drag handle, motion and reduced motion, events and theming hooks.

### Modified Capabilities

None. The dialog's behaviour is reused as a pattern, not changed.

## Impact

- New: `components/aside-sheet/{aside-sheet.js,demo.html,construction.html}`.
- Pages: `components.html` (new section), `styleguide.html` (audit row), `kitchen-sink.html`.
- `CHANGELOG.md` (Unreleased). No new top-level file, so `.github/workflows/pages.yml` is unchanged; no new token.
