# Design

## Context

Shadow DOM form field like the date input (the newest field): one inlineable file, settings block, ElementInternals, the shared 2px outline with 2px offset on the field. The strength bar reuses `<kakao-progress>`.

## Decisions

- **Progress as a real child in the shadow root, loaded by the page.** As the toast relies on the page loading `alert.js`, the password input relies on `progress.js` being loaded and warns once if it is not; the list still works without it. Importing the script would tie the component to a path and break the one-inlineable-file rule. Progress settings (`--kakao-progress-*`) inherit into the shadow root, so the bar is styled where every progress bar is.
- **Segments = requirements, value = met count, max = count.** Each requirement met completes a segment, which is exactly when progress pops; first render and changes to the requirement count are structural for progress and never pop. Tone switches to success when all are met. The bar is `aria-hidden`: the list carries the same facts in words.
- **Requirements are advice unless `required-strength` is set.** A bare `requirements` list never blocks a form (sites differ in what they enforce, and the server decides). `required-strength` (empty = all, N = at least N) sets `patternMismatch` with a message naming what is missing, only for a non-empty value; it implies `requirements`, so a field is never invalid for reasons the person cannot see.
- **JSON attribute named `list-data`** (project rule), items `{label, pattern, flags}`; patterns compile with the `u` flag so `\p{…}` works; a property accepts `{label, test}` functions too.
- **Toggle name stays "Show password", state in `aria-pressed`.** A name that flips to "Hide password" together with `aria-pressed="true"` reads as "Hide password, pressed", the opposite of the truth. The icon swaps. Pointer presses keep focus in the field (pointerdown preventDefault); keyboard activation keeps focus on the button so the new state is read. Selection is saved and restored around the type switch.
- **Value is not reflected** to the `value` attribute (the text input reflects): a password must not end up in the DOM. The attribute is the default value, used by form reset. Form state restore is disabled (empty state).
- **Announcements**: one polite live region for Caps Lock (on turn-on only) and requirement changes, debounced 1s after typing stops, only while focused, only the difference ("Met: A number. 3 of 5 requirements met.").
- **Enter submits the form** with `requestSubmit()`, as a native sign-in field does.

## Risks

- Password managers do not see inputs inside shadow roots well; `autocomplete` is passed through, which is the most a component can do.
- `getModifierState('CapsLock')` is only known after a key or pointer event in the field.
