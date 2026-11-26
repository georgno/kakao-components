## ADDED Requirements

### Requirement: Visual check command
`node tools/visual-check.js <page|url>…` SHALL take full-page screenshots of each page at 1280px and 390px wide, each in the light and the dark colour scheme, into `<os temp dir>/kakao-visual-check/<page>/` unless `--out` names another folder, and print their paths. It SHALL report as findings: console errors, uncaught exceptions, failed requests and responses >= 400; a page wider than its viewport, naming the elements where the overflow starts; visible controls and images without an accessible name in Chromium's accessibility tree, a missing `lang`, `<title>` or viewport meta tag; Tab stops that look the same focused and blurred, or where Tab does not move on; animations still running under reduced motion (those of busy indicators as notes, not findings). It SHALL exit 0 without findings, 1 with findings, 2 on a usage error or when Playwright is missing.

#### Scenario: A recipe
- **WHEN** `node tools/visual-check.js recipes/dashboard.html` runs with Playwright installed
- **THEN** four screenshots are written outside the repo and each check prints ok or its findings

#### Scenario: A button without focus ring
- **WHEN** a page has a button whose focus style is removed
- **THEN** the focus check names that button

### Requirement: Playwright stays optional
Playwright SHALL NOT be a dependency of the repo. The tool SHALL require it lazily (the current project, the checkout, NODE_PATH) and, when it is missing, print how to install it and exit 2. Its browser test SHALL be skipped without Playwright. The tool SHALL use no other package.

#### Scenario: No Playwright
- **WHEN** the tool runs where Playwright cannot be found
- **THEN** it prints the install command and exits 2 without a stack trace
