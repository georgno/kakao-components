## Why

`shared/page-transition.js` was written for one app (chat screens, a hard-coded
kakao-tabs sync) and is documented as "this project's pages only". The library's
own site does not use it. It should be a generic utility consumers can use, and
the site's top-level pages should use it themselves.

## What Changes

- page-transition.js becomes generic: no app-specific docs or code. It tells the
  page what happens through events on `document` (`page-transition-start`,
  cancelable; `page-transition-swap`; `page-transition-end`) instead of reaching
  into kakao-tabs. kakao-tabs selects the tab for the new URL on
  `page-transition-swap`; the header bar stays solid during a page transition
  (as during a theme transition).
- A swap carries the fetched page's head: its stylesheets and `<style>`s are added
  (loaded before the swap), the old page's own are dropped, shared ones stay;
  new head scripts load once; the components the new content uses are loaded
  through the loader first. Page scripts are taken from the new page.
- `kakaoPageTransition.signal` (aborts when the screen is swapped out) and
  `kakaoPageTransition.wait(promise)` let page scripts clean up and hold the new
  screen until their content is in. Links in the opted-in shell get
  `aria-current="page"` for the new URL. `busy` stays, neutral.
- Consumer-facing: CATALOG.md, tools/vendor.js (ships it), the kakao-ui skill,
  AGENTS.md, CHANGELOG.
- Dogfood: index, components, styleguide, tokens, kitchen-sink and changelog use
  the loader head, one shared header bar with the site links and one content
  region (`<main>`); their scripts are marked and re-runnable. page-cloak.js waits
  for the loader. Demo and construction pages stay ordinary navigations.

## Capabilities

### New Capabilities

- `page-transition`: the generic screen swap.
- `site-pages`: the site's top-level pages share a shell and swap.

### Modified Capabilities

- `tabs`: follows a page transition.
- `header-bar`: solid while a page transition runs.

## Impact

shared/page-transition.js, shared/page-cloak.js, shared/site-shell.css (new),
shared/demo.css, shared/construction.js, components/tabs/tabs.js,
components/header-bar/header-bar.js, the six top-level pages, CATALOG.md,
tools/vendor.js, skills/kakao-ui, AGENTS.md, CHANGELOG.md.
