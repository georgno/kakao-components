# Tasks

## 1. Component

- [x] 1.1 `components/image/image.js`: shadow DOM with settings block; `src`, `alt`, `caption` and `slot="caption"`, `width`, `height`, `ratio`, `fit`, `radius`, `srcset`, `sizes`, `loading`; skeleton placeholder with a plain fallback; fade; error state; `image-load`, `image-error`, `reload()`, `state`; reduced motion; forced colours; header comment documents the API. Verify: no literal closing script tag; loads without console errors.
- [x] 1.2 `shared/demo-images/`: `landscape-1.svg`, `landscape-2.svg`, `tall-1.svg`. Verify: they render.
- [x] 1.3 `components/image/demo.html`: demo-page card convention with code tiles: alt, caption, slotted caption, decorative, ratio, width and height, no size, fit, radius, slow load, eager, srcset, error, events and reload, link. Verify: loads without console errors; every example has a code tile.
- [x] 1.4 `components/image/construction.html`: preview plus a manifest for every `--kakao-image-*` property. Verify: the settings table lists every property with no warnings.

## 2. Pages

- [x] 2.1 `components.html`: Image card before Kbd, script tag added, "Image" placeholder removed from "Not built yet". Verify: renders.
- [x] 2.2 `styleguide.html` audit row. Verify: loads.
- [x] 2.3 `CHANGELOG.md` Unreleased entry (Added). Verify: read.

## 3. Verification

- [x] 3.1 Headless Firefox at 1280px and 390px, a light and two dark themes: frames have their size before and after the load, no horizontal scroll at 390px, slow load shows the skeleton, error state, caption, events, plain block without `skeleton.js`, reduced motion without fade, never focusable, no console errors.

## Workflow follow-up

- Archive the change once every task is done.
