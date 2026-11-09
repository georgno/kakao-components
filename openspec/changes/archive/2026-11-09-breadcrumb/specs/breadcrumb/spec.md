## Purpose
`<kakao-breadcrumb>` shows where the current page sits in a hierarchy, built from a plain list of title/url pairs, starting with a home item.

## ADDED Requirements

### Requirement: Items from title/url pairs
The breadcrumb SHALL take its items from `list-data` (JSON) or the `items` property, each either `{ "title", "url" }` or a pair `["Title", "/url"]`. Every item but the last SHALL be a link (an item without a url is plain text). The last item SHALL be the current page: plain text with `aria-current="page"`.

#### Scenario: Pairs
- **WHEN** `list-data='[["Settings","/settings"],["Plan"]]'` is set
- **THEN** the trail reads Start › Settings › Plan, with Settings a link and Plan the current page

### Requirement: Start item
The trail SHALL begin with a start item linking to `start-url` (default `/`). By default it SHALL show a house icon whose accessible name is the start text. With `start="text"` it SHALL show the start text. The start text SHALL come from a constant (`'Start'`), changeable for every breadcrumb through `KakaoBreadcrumb.startText` and per element through `start-text`. `start="none"` SHALL leave the start item out.

#### Scenario: Default house icon
- **WHEN** a breadcrumb has no `start` attribute
- **THEN** it begins with a house icon that screen readers announce as "Start"

#### Scenario: Text from the constant
- **WHEN** `KakaoBreadcrumb.startText = 'Home'` is set and a breadcrumb has `start="text"`
- **THEN** it begins with the text "Home"

### Requirement: Accessible structure
The breadcrumb SHALL be a `nav` landmark named "Breadcrumb" (or `label`) containing an ordered list. Separators SHALL be hidden from assistive technology. Links SHALL show the shared focus ring and colours SHALL follow the theme.

#### Scenario: Screen reader
- **WHEN** a screen reader reaches the breadcrumb
- **THEN** it announces a Breadcrumb navigation with a list of N items and no separator characters

### Requirement: Navigation event
Activating a link SHALL fire a bubbling, composed, cancelable `breadcrumb-navigate` event with `{ title, url, index }`. If cancelled, the browser SHALL NOT follow the link.

#### Scenario: Single-page app
- **WHEN** a listener calls `preventDefault()` on `breadcrumb-navigate`
- **THEN** the page stays and the app routes itself
