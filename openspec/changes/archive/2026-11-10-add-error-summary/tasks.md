# Tasks

## 1. Component

- [x] 1.1 `components/error-summary/error-summary.js`: shadow DOM, danger alert inside, settings block, form wiring (`for`, ancestor, descendant), invalid capture and novalidate submit, collecting fields, labels and messages, links with focus and scroll below the header bar, `live`, `validate()` / `show()` / `clear()`, events and triggers; header comment documents the API. Verify: no literal closing script tag; no console errors.
- [x] 1.2 Getters (`validity`, `validationMessage`, `checkValidity()`, `reportValidity()`, `form`) on text input, textarea, checkbox and radio group. Verify: the summary reads their messages.
- [x] 1.3 `demo.html`: a real form with kakao and native fields, `for` with server errors and `show()`, a wrapped form with a description, event log. Verify: loads without console errors.
- [x] 1.4 `construction.html`: preview and manifest for every `--kakao-error-summary-*` property; defaults round-trip through `POST /__construct/save`. Verify: unchanged file after save.

## 2. Verification

- [x] 2.1 Chromium and Firefox, 390px and 1280px, light and dark: submit lists all seven errors, focus lands on the box, links focus the fields below the header bar, live removal, valid submit clears, keyboard (Enter on submit, Tab through links, Enter on a link); no horizontal scroll; `node tools/check-themes.js` passes.

## Workflow follow-up

- Page wiring (components list, style guide audit, changelog) is done by the coordinator.
- Archive the change once every task is done.
