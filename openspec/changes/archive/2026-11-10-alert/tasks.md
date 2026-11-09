# Tasks

## 1. Warning colour role

- [x] 1.1 Add `--kakao-color-warning` to `tokens.html`'s manifest and save its light value into `shared/tokens.css` through `POST /__construct/save` (target `tokens`). Verify: the tokens settings block contains the line.
- [x] 1.2 Add warning values to every `@theme` block in `shared/themes.css`, a `warning / bg 4.5` pair to `tools/check-themes.js`, then `node tools/check-themes.js --fix`. Verify: the tool exits 0.
- [x] 1.3 `styleguide.html`: warning in the colour roles and the token description map. Verify: page loads, the swatch shows.

## 2. Component

- [x] 2.1 `components/alert/alert.js`: shadow DOM, settings block, tones + alias, roles, title / icon / message slots, `dismissible` close button, cancellable hide, timer with pauses, fade + collapse, reduced motion, methods, events and triggers; header comment documents the API and the auto-hide caveat. Verify: no literal closing script tag in the file; it upgrades without console errors.
- [x] 2.2 `components/alert/demo.html`: tones, title and icon options, dismissible, timer examples (default, custom, off, error stays), API controls (show / hide / tone / duration) and an event log. Verify: loads without console errors, the log shows the events.
- [x] 2.3 `components/alert/construction.html`: preview of every tone and a manifest for every `--kakao-alert-*` property. Verify: the settings table lists every property with no warnings.

## 3. Pages

- [x] 3.1 `components.html`: a real Alert section replacing the "Toast / alert" placeholder, a "Toast" placeholder marked Missing kept. Verify: both render, links open demo and construction.
- [x] 3.2 `styleguide.html` audit row and `kitchen-sink.html` use (a success alert after save, an error alert in the form). Verify: pages load without console errors.
- [x] 3.3 `CHANGELOG.md` Unreleased entry (component and warning role). Verify: read.

## 4. Verification

- [x] 4.1 Headless browser: demo at 1280px and 390px, light and dark: tones, runtime tone change, dismiss + cancel, timer, hover pause, reduced motion. `node tools/check-themes.js` passes.

## Workflow follow-up

- Archive the change once every task is done.
