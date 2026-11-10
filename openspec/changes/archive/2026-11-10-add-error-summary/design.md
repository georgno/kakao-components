# Design

## Context

`<kakao-alert tone="danger">` already draws the tinted, borderless box with icon and title and sets `role="alert"`. Kakao form fields are form-associated custom elements: their validity lives in ElementInternals, which pages cannot read unless the component exposes it (select, combobox and date input do; text input, textarea, checkbox and radio group did not). The header bar publishes `--kakao-header-bar-rendered-height`.

## Decisions

**The alert is inside the shadow root.** The summary renders `<kakao-alert tone="danger" duration="0" tabindex="-1">` with its title, an optional description slot and the list as slotted children from its own shadow tree, so its styles reach the links and the alert stays the one place for the look. The default slot after the box holds a wrapped form. Shown and hidden by its `hidden` attribute, so no alert events leak out.

**Take over the browser's validation, don't replace it.** The summary listens for `invalid` (capture) on the form and cancels it: no bubbles, no browser focus jump, the submit is still blocked. One microtask later it collects and shows. Forms with `novalidate` are checked in the submit listener, which cancels the submit on errors. The page's own constraints (`required`, `min`, `type`) and the components' messages stay the source of truth.

**What counts.** `form.elements` in tree order; disabled fields, fieldsets, buttons and outputs skipped; a native radio group listed once (linked to its checked or first radio). Invalid: a kakao field with `error`, else `validity.valid === false`, else `:invalid`. Message: `error`, else `validationMessage`, else "Check this field.". Label: `label` on a kakao field, else aria-labelledby, aria-label, the fieldset legend for radios, the `<label>`, placeholder, name.

**Focus.** On show the alert box takes focus (`preventScroll`) and the page scrolls it below the header bar; its `role="alert"` plus the focus move make screen readers read it (the GOV.UK pattern). A link calls the field's `focus()` (kakao fields forward it), then scrolls the field, or its label or legend when that sits above it, below the bar plus `--kakao-error-summary-scroll-gap`, only when it is not already fully in view. Smooth unless reduced motion.

**Live updates are subtractive.** With `live`, input and change events re-check only the listed fields: fixed ones drop out, the box goes once all are fixed, focus stays put. New errors appear only on submit, so nothing grows under the person while they type.

**Separator.** "Label: message", but a label ending in punctuation ("How did you hear about us?") gets a space instead of a colon.

## Risks / Trade-offs

- [Browser messages are generic and localised by the browser] → kakao fields' `error` and `show()` carry authored messages.
- [Text input does not mirror `type="email"` or `pattern` validity into ElementInternals] → only `required` and `error` count for it; unchanged here.
