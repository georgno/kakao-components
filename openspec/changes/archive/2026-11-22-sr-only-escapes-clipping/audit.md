# Audit: which `.sr` span really escapes

The escaping box is the screen-reader-only span, in every component:

```css
.sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); }
```

An absolutely positioned box is clipped by a clipping ancestor only if that
ancestor lies between it and its containing block. With no positioned box in the
component, the span's containing block is the initial containing block, so a
page's scroll container (which clips the component) does not clip the span - and
the span still counts towards the document's scrollable overflow. The fix is
therefore "some box between the span and the component's edge must be
positioned"; `position: relative` with no offsets changes nothing else.

## How it was decided

For each component: find the `.sr` element in the shadow template (or the code
that creates it), walk its ancestor chain inside the shadow root, and check
whether any ancestor is positioned (`position` other than `static`, and likewise
`transform`, `filter`, `contain`, `container-type`, `will-change`), or whether
`:host` is. The line that decides it is given per component below. Every verdict
was then confirmed in a browser, because being out of flow is only half of it -
see "Measured" and "Firefox differs".

## Verdicts

Nine of the fifteen candidates escaped; six were already correct. One component
the audit missed (`tree-view`) escapes as well and is fixed too.

### Fixed (span had no positioned ancestor)

| Component | The span | Deciding line (before) | Fix |
| --- | --- | --- | --- |
| animated-number | `.sr, [part=sr]`, child of the shadow root | `animated-number.js:154` `:host` sets only `display`, `vertical-align`, font, colour | `:host { position: relative }` (`animated-number.js:164`) |
| code-input | `.sr#count`, child of the shadow root | `code-input.js:141` `:host` sets `display: block` and font only | `:host { position: relative }` (`code-input.js:169`) |
| copy-button | `.sr[part=status]`, child of the shadow root | `copy-button.js:123` `:host` sets `display: inline-flex` only | `:host { position: relative }` (`copy-button.js:162`) |
| date-input | `.sr#today-reason`, in `.below` | `.below` (`date-input.js:272`) is `display: flex`, not positioned | `.below { position: relative }` (`date-input.js:274`) |
| kbd | the spoken `+` separator, in `.kbd` | `.kbd` (`kbd.js:200`) is `display: inline-flex`, not positioned (the `.sr` words inside `.key` were already contained by `.key`) | `.kbd { position: relative }` (`kbd.js:202`) |
| password-input | `.sr#live` (child of the shadow root), the "Password requirements:" span in `#reqs-desc`, and one `.sr` per requirement `li` | `password-input.js:173` `:host` sets `display: block` only; `.strength` and `#reqs-desc` are not positioned | `:host { position: relative }` (`password-input.js:206`) |
| tag-input | `.sr#status`, child of the shadow root | `tag-input.js:151` `:host` sets `display: block` only | `:host { position: relative }` (`tag-input.js:195`) |
| theme-switch | `.sr.hint` in the button and `.sr.status`, child of the shadow root | `theme-switch.js:619` `:host` sets `display: inline-flex` only; `button` is not positioned | `:host { position: relative }` (`theme-switch.js:644`) |
| time-input | `.sr#now-reason`, in `.below` | `.below` (`time-input.js:260`) is `display: flex`, not positioned | `.below { position: relative }` (`time-input.js:262`) |
| tree-view (audit miss) | the ", Loading" word, appended to `.label` of a loading node | `.label` (`tree-view.js:251`) had no position; the chain is `.label` > `.row` > `li.item` > `ul.tree`, none positioned (`ul.group` is, but a root-level node has none) | `.label { position: relative }` (`tree-view.js:252`) |

### Already correct (a positioned box already held the span)

| Component | Containing block inside the component | Line |
| --- | --- | --- |
| avatar | `.sr` sits in `.more`, which is `position: relative` | `avatar.js:508`, markup `avatar.js:537` |
| combobox | `.sr#status` sits in `.panel`, which is `position: fixed` (and `display: none` while closed) | `combobox.js:290`, markup `combobox.js:392` |
| error-page | both `.sr` spans are appended to `.code` inside `.page`, which is `position: relative` | `error-page.js:138`, created in `_sr()` at `error-page.js:389` |
| select | `.sr#status` sits in `.panel`, `position: fixed` | `select.js:263`, markup `select.js:421` |
| spinner | `.sr` sits in `.spinner`, `position: relative` | `spinner.js:139`, markup `spinner.js:214` |
| stepper | `.sr` is appended to `.label` inside `.step`, `position: relative` | `stepper.js:184`, appended at `stepper.js:596` |

### Also checked (contain the same pattern, not in the proposal, left alone)

- `color-picker` (`:host` is already `position: relative`, `color-picker.js:165`),
  `description-list` (`:host`, `description-list.js:115`), `skeleton` (`:host`,
  `skeleton.js:175`), `command-palette` (`.sr#status` in `.panel`,
  `command-palette.js:430`): already correct, no change.
- `error-summary`'s `.sep` is out of flow but sits in `.item`
  (`error-summary.js:195`), so it is contained.
- `grid-view`'s `.kakao-grid-view-action-label` (`grid-view.css:259`) is out of
  flow in a button that is not positioned, so it can escape the same way. That
  is a different component and a different class name, so it is left for its own
  change; it is not part of this one.
- `table`'s hidden checkbox input sits in `.kakao-table-check`
  (`table.css:284`), and `step-switch` / `switch-group` clip the track they draw
  in; none of them escapes.

## Measured

No page in this repo puts a component in a **clipping** scroll container with the
component inside it, so the component demo pages cannot show the symptom: each
of the affected demo pages has 11-22 scroll containers, and none of them holds a
component with a `.sr` span (measured: 0). The measurement page (served from
`/tmp`, not committed) reproduces the consumer app's `/chat` nesting: a clipped
shell, a scroller inside it, 3000px of content, then the component - the span's
static position is then 3000px down the page.

```html
<div style="height:420px; overflow:hidden">            <!-- the clipped content region -->
  <div style="height:420px; overflow-y:auto">          <!-- the scroller, not positioned -->
    <div style="height:3000px"></div>                  <!-- the messages above it -->
    <kakao-copy-button value="hello" label="Copy"></kakao-copy-button>
  </div>
</div>
```

`document.scrollingElement.scrollHeight` at 1200×800 and 420×800, viewport 800,
before → after the fix (Chromium 1194 and Firefox 1555 via playwright-core from
the local browser cache; Firefox is the reference browser):

| Component | Chromium 1200 | Chromium 420 | Firefox 1200 | Firefox 420 |
| --- | --- | --- | --- | --- |
| animated-number | 3008 → 800 | 3008 → 800 | 800 → 800 | 800 → 800 |
| code-input | 3076 → 800 | 3076 → 800 | 800 → 800 | 800 → 800 |
| copy-button | 3008 → 800 | 3008 → 800 | 3008 → 800 | 3008 → 800 |
| date-input | 3076 → 800 | 3076 → 800 | 800 → 800 | 800 → 800 |
| kbd | 3021 → 800 | 3021 → 800 | 3021 → 800 | 3021 → 800 |
| password-input | 3107 → 800 | 3156 → 800 | 800 → 800 | 800 → 800 |
| tag-input | 3076 → 800 | 3076 → 800 | 800 → 800 | 800 → 800 |
| theme-switch | 3029 → 800 | 3029 → 800 | 3029 → 800 | 3029 → 800 |
| time-input | 3076 → 800 | 3076 → 800 | 800 → 800 | 800 → 800 |
| tree-view | 3015 → 800 | 3015 → 800 | 3015 → 800 | 3015 → 800 |
| avatar, combobox, error-page, select, spinner, stepper | 800 → 800 | 800 → 800 | 800 → 800 | 800 → 800 |

The six components with a containing block of their own were measured the same
way and never grew the page, which is the control for the harness.

### Firefox differs on legacy `clip`

In Firefox the components that clip with `clip: rect(0,0,0,0)` (animated-number,
code-input, date-input, password-input, tag-input, time-input) did not grow the
page even before the fix: Firefox leaves a legacy-`clip`ped box out of the
document's scrollable overflow. Chromium counts it, which is why those six only
show the symptom in Chromium. Swapping the span's `clip-path` for `clip` in the
harness drops Chromium's copy-button page from 3008 to 800, and back. The fix is
right for both: it no longer depends on which clip property the span uses.

### Demo pages

`scrollHeight` of every affected component's demo page, before → after, is
unchanged (1200×800 and 420×800, Firefox): copy-button 3698 → 3698 (420: 4086 →
4086), kbd 3540 → 3540 (4048 → 4048), date-input 6678 → 6678, theme-switch 2727
→ 2727, tree-view 5012 → 5012, and the same for animated-number, code-input,
password-input, tag-input, time-input. `index.html`, `kitchen-sink.html`,
`components.html` and `styleguide.html` are unchanged too. These are long pages
by design (their `scrollHeight` is not meant to equal the viewport); what matters
is that nothing grew a phantom tail - and nothing did, because no demo page has a
component inside one of its scroll containers (see above).

### The span is still a screen-reader-only span

Measured on the same page after the fix, in the browser: every `.sr` is still
1×1, `overflow: hidden`, clipped (`clip-path: inset(50%)` or `clip: rect(0, 0, 0,
0)`), `display: block`, `visibility: visible` - hidden from sight, not from
assistive technology. Its `role`/`aria-live`/`id` attributes are untouched (the
change is CSS only), and `getByRole('status')` still finds e.g. copy-button's
status span through the shadow root.
