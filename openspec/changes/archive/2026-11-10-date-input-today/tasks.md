# Tasks

## 1. Component

- [x] 1.1 Add the `.below` row and the tag button to the template, its styles, and the `--kakao-date-input-today-*` settings (saved through the construction server)
- [x] 1.2 Observe `today` and `today-label`; compute the label (Intl), accessible name, hidden and disabled state in sync
- [x] 1.3 Compute the value per type (step rounding, ISO week) and the min/max check; on activation set the value and fire input and change once
- [x] 1.4 Document the attributes in the header comment

## 2. Pages

- [x] 2.1 Demo: a "Today shortcut" section with every type, min/max disabled, custom label; playground toggle
- [x] 2.2 Construction page: preview with the tag and manifest rows for the new settings
- [x] 2.3 kitchen-sink.html: checked; not turned on (its only date field, "Pause membership until", has no use for today)

## 3. Verification

- [x] 3.1 Headless Chromium and Firefox, 390px and 1280px, light and dark: each type, min/max disabling, events once, form value, keyboard activation; screenshot
