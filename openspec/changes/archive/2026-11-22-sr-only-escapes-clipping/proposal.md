## Why

A `<kakao-copy-button>` inside a scroll container (a chat message list, a card with
its own scroller) makes the whole **page** scroll by thousands of pixels into blank
space. Measured on the consuming app's `/chat` at 914×931: the content region is
931px tall and clipped (`overflow: hidden`), yet
`document.scrollingElement.scrollHeight` is **12320px**, with only two copy buttons
on the page. Setting `position: relative` on those two hosts drops it to **931px**;
removing it brings the 12320 back.

Cause: the component's screen-reader span is out of flow:

```css
.sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); }
```

`copy-button`'s `:host` sets `display: inline-flex` but no `position`, and nothing
inside the component is positioned either, so `.sr`'s containing block is the
**initial containing block**. An absolutely positioned box whose containing block
lies outside a clipping ancestor is not clipped by it, and it still contributes to
the document's scrollable overflow - so the page gains the height of the span's
static position (12319px down the message list) as blank scroll.

The same pattern (`.sr { position: absolute }` with no positioned containing block
among the component's own boxes) appears in 15 shadow components: animated-number,
avatar, code-input, combobox, copy-button, date-input, error-page, kbd,
password-input, select, spinner, stepper, tag-input, theme-switch, time-input. Each
one does this to any page that puts it in a scroller.

## What Changes

- Every component whose `.sr` is out of flow gets a positioned containing block
  inside itself - `:host { position: relative }` where that is the box the span
  belongs to, or the element that already wraps it. Only where the span actually
  escapes: a component that already has a positioned ancestor inside its shadow
  root is left alone.
- `CHANGELOG.md` → Unreleased: the phantom page scroll and what a page had to do
  instead (nothing - the fix is in the components).

## Impact

`components/{animated-number,avatar,code-input,combobox,copy-button,date-input,error-page,kbd,password-input,select,spinner,stepper,tag-input,theme-switch,time-input}/*`,
`CHANGELOG.md`. No new attribute, no new setting, so `tokens.json` is untouched.
No push to `origin`; the operator publishes.
