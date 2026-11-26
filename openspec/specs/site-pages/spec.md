# site-pages Specification

## Purpose
The six top-level pages share one shell and swap their content through shared/page-transition.js.

## Requirements

### Requirement: Shared shell with page transitions
The top-level pages index, components, kitchen-sink, styleguide, tokens and changelog SHALL load the library through the loader head (kakao.css, kakao.js, then page-cloak.js), share one header bar with the site links (opted in with `data-page-transition`, the current one marked `aria-current="page"`) and the theme and settings controls, and render one content region `<main data-page-transition-content="content" tabindex="-1">`. Their page scripts SHALL be marked `data-page-transition-script` and re-runnable. Demo and construction pages SHALL stay ordinary navigations. page-cloak.js SHALL wait for `kakaoLoader.ready` when the loader is on the page.

#### Scenario: Swap between site pages
- **WHEN** the user follows a header-bar link between two of the six pages
- **THEN** only the content swaps, and the landed page looks and works as on a direct load
