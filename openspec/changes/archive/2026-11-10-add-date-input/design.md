# Design

## Context

The library's fields (`kakao-text-input`, `kakao-select`, `kakao-combobox`) share one look: a 1px field border, radius 10, heights 36 / 44 / 52 with side padding 10 / 12 / 14, label 0.82rem weight 600 above, hint / error 0.78rem below, the 2px focus outline with 2px offset (select, combobox), disabled opacity 0.55. The select and combobox chevron is a 0.9em box whose right edge sits padding-x from the field's inner edge, i.e. 11 / 13 / 15px in from the outer edge. The date field is to keep the browser's native control and picker.

## Goals / Non-Goals

**Goals:** native field in the library's look; indicator lined up with the chevron; dark themes; locale propagation and an honest account of what it does; form association with mirrored validity.

**Non-Goals:** a custom calendar or time list; a formatted text overlay (proposed as a follow-up below); ranges (two fields); time zones.

## Locale research: what sets the native field's format

Measured on 2026-11-10 with Playwright 1.5x: Chromium 1254 (headless shell and new headless) and Firefox 1572, Linux, a page with all five types and values 2026-03-04 / 14:30.

| Switch | Chromium | Firefox |
|---|---|---|
| `<html lang="de-DE">` | no change (03/04/2026, 02:30 PM) | no change |
| `lang="de-DE"` on the input | no change | no change |
| Playwright `locale: 'de-DE'` (navigator.language, Accept-Language, JS Intl default) | no change | no change |
| `--lang=de-DE` launch flag | no change on Linux | n/a |
| Process locale `LANG` / `LC_ALL=de_DE.UTF-8` | **04.03.2026, 14:30, "März 2026"** (week stays "Week 10, 2026") | no change by itself |
| `LC_TIME=de_DE` + pref `intl.regional_prefs.use_os_locales=true` | n/a | **04 . 03 . 2026, 14 : 30** |
| `intl.locale.requested=de-DE` without a German language pack | n/a | no change |

Conclusions:

- **Chromium**: the field follows the browser's UI locale (on Linux the process locale, on Windows / macOS the browser language setting). Page and element `lang` are ignored.
- **Firefox**: the field follows the app locale (the UI language), or the OS regional format when "Use your operating system settings … to format dates" is on (`intl.regional_prefs.use_os_locales`). `lang` is ignored. Firefox has no month or week field: they are plain text.
- **Safari** (not testable here; from WebKit behaviour and documentation): the field follows the OS region (macOS / iOS Language & Region), not `lang`. Desktop Safari has no month / week field and draws no picker icon; iOS opens a wheel or calendar sheet.

So no browser lets a page set the native field's format. The component still propagates the locale to the inner input's `lang` (it costs nothing, is correct for assistive technology, and is what a browser would read if it ever honours `lang`, as the HTML spec allows), and exposes the resolved `locale`. The demo shows next to each field what `Intl.DateTimeFormat` makes of the value in the chosen locale, so the difference is visible.

Options for a page that must show its own format (not built; for the user to decide):
1. A formatted overlay: the native input stays underneath (keyboard, picker, validation), and while it is not focused a text layer shows `Intl.DateTimeFormat(locale)` output. Cheap, but the format jumps on focus.
2. A segmented field drawn by the component (day / month / year spinbuttons in locale order) with the native picker opened by `showPicker()` on a hidden input. Fully localised, much more code and accessibility work.
3. A text field with parsing (locale pattern) plus the native picker button. Simple to draw, parsing is error-prone.

## Decisions

**Name and structure.** `kakao-date-input` in `components/date-input/`, shadow DOM, one native `<input>` inside `.field`, exactly as `kakao-text-input` (label element with `for`, hint / error with `aria-describedby`, error as `aria-invalid` and custom validity). Field styles are copied from the combobox field (outline focus, not the text input's halo, per the styleguide's decided rule).

**Picker indicator, Chromium.** `::-webkit-calendar-picker-indicator` is styleable: its image is replaced by a mask (our own calendar or clock glyph, picked by type) filled with the muted colour, its size set by `--kakao-date-input-icon-size` (1em), its margin chosen so the icon's centre sits where the chevron's centre sits: 0.45em in from the field's inner padding edge. The element stays the browser's own, so a click still opens the native picker. Colour follows the theme in every scheme; no filter needed.

**Picker indicator, Firefox.** The calendar / clock button is inside the input's UA shadow and has no styleable pseudo-element, so it cannot be redrawn or hidden. It is drawn in the input's text colour (lighter), which follows the theme, and is visible in dark. Measured, it sits about 0.36em further in than the chevron; a Firefox-only `margin-inline-end: -0.36em` on the input (`@supports (-moz-appearance: none)`) moves it onto the chevron's line (within about 0.5px at all three sizes). Replacing it with our own button would need clipping the native button out of the input box, which is fragile; not done.

**Focus.** The 2px outline is drawn on the field when the input is `:focus-visible` or `:focus-within`: in Chromium the picker icon is a tab stop of its own (Shift+Tab reaches it first), during which the input is not `:focus`. On that stop the icon turns the focus colour. Firefox's segments also start 2px further in than other fields' text; a Firefox-only -2px start margin lines them up (measured equal to Chromium after the fix).

**Measured alignment** (icon ink centre from the field's outer right edge, select chevron in brackets): sm 17 (18), md 19.5 (20), lg 22 (21.5) px, identical in Chromium and Firefox, light and dark.

**Safari.** Desktop Safari shows no indicator; clicking the field opens the picker. Left as is (open question: add our own button calling `showPicker()` there).

**color-scheme.** The input inherits `color-scheme` from the page (every theme sets it), so native pickers open in the theme's scheme.

**Unsupported types.** After setting `type`, if the input reports another type, the browser has no such field: the input becomes `type="text"` with an ISO placeholder, a pattern, and `inputmode="numeric"` where sensible. Validity then comes from the pattern.

**Locale.** `locale` attribute, else the nearest `lang` walking up through shadow hosts. One shared `MutationObserver` on the document watches `lang` attributes and re-resolves every connected instance.

**Form.** `formAssociated`; value submitted as the inner ISO value; validity copied from the inner `ValidityState` with its message and the input as anchor; `error` wins as customError. `value` attribute is the default (as in the combobox, not reflected), so reset restores it.

**Events.** The native `input` is composed and would leak out of the shadow root next to ours; it is stopped and re-dispatched once from the host; `change` (not composed) is re-dispatched.

## Risks / Trade-offs

- The Firefox nudge depends on Firefox's internal button padding; a Firefox update could move it a pixel or two. It is one setting (`--kakao-date-input-moz-nudge`).
- `lang` propagation has no visible effect today; documented so nobody expects otherwise.
- Month and week fields degrade to typed ISO text in Firefox and desktop Safari.
