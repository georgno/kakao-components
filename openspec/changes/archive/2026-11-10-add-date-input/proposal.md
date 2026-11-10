# Proposal

## Why

`components.html` still lists "Date & time picker" as Missing, shown as bare native inputs that look nothing like the library's fields. Forms need date, time, date-time, month and week fields that sit in a column with `kakao-text-input`, `kakao-select` and `kakao-combobox` without standing out, while keeping the browser's own picker (no custom calendar: the native one is accessible, localised by the browser and works on touch).

## What Changes

- New component `<kakao-date-input>` (`components/date-input/`), shadow DOM, form-associated: wraps one native `<input>` whose `type` is `date` (default), `time`, `datetime-local`, `month` or `week`.
- The field has the text input's look: `label`, `hint`, `error`, sizes `sm` / `md` / `lg`, `disabled`, `readonly`, `required`, the 2px focus outline with 2px offset (as select and combobox), tabular numbers.
- The browser's own picker indicator stays on the right. Where it can be styled (Chromium) it is redrawn in the muted colour and centred where the select's chevron sits; where it cannot (Firefox) it is nudged into the same place and follows the text colour. Dark themes keep it visible.
- Locale: the inner input gets the `locale` attribute or the nearest `lang` as its `lang` and follows changes. Research (see design.md) shows the native field's display format does not follow `lang` in Chromium or Firefox; this is documented and shown on the demo, and a formatted overlay is left as a follow-up option.
- Form: `name`, `value` (ISO), `min`, `max`, `step`, `required`; validity mirrored from the inner input; reset, state restore, disabled fieldset; `input` and `change` events; `showPicker()`.
- Types the browser does not support (e.g. `month` / `week` in Firefox and desktop Safari) fall back to a text field with an ISO placeholder and pattern.
- Settings block (`--kakao-date-input-*`), construction page, demo; `components.html` section replaces the placeholder; style guide audit row; kitchen sink.

## Capabilities

### New Capabilities
- `date-input`: the native date / time field wrapper: types, field look, picker indicator, locale propagation, form participation and validity, events, accessibility, theming.

### Modified Capabilities
<!-- none -->

## Impact

- New: `components/date-input/{date-input.js,demo.html,construction.html}`.
- Pages: `components.html`, `styleguide.html`, `kitchen-sink.html`; `CHANGELOG.md` (Unreleased). No new top-level file or token; `pages.yml` already copies `components/`.
