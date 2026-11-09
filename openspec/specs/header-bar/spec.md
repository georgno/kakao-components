# header-bar Specification

## Purpose
`<kakao-header-bar>` is the page's sticky top bar: a banner landmark that holds the page's top controls (menu button, title, navigation, theme and settings buttons) and stays readable over scrolled content.

## Requirements

### Requirement: Banner landmark
The header bar SHALL render a `<header>` element, so at page level it is exposed as the banner landmark. The page's controls SHALL be its own light DOM children, placed through slots, so page styles and scripts keep reaching them.

#### Scenario: Landmark
- **WHEN** a screen reader lists the landmarks of a page with a header bar as a direct child of `<body>`
- **THEN** it lists a banner containing the slotted controls

### Requirement: Start, title and end slots
The bar SHALL lay out three regions on one row: `start` (slot `start`, at the inline start), the title (the default slot, centred) and `end` (slot `end`, at the inline end). An empty region SHALL take no space, and the title SHALL stay centred in the bar while there is room for it.

#### Scenario: Tools on the right only
- **WHEN** only `slot="end"` children are given
- **THEN** they sit at the right edge of the bar and nothing else takes space

#### Scenario: Menu button left
- **WHEN** a menu button is placed with `slot="start"`
- **THEN** it sits at the left edge of the bar, on the same row as the end tools

### Requirement: Navigation region
Children with `slot="nav"` SHALL be wrapped in a `<nav>` element named by the `nav-label` attribute (default "Main"), placed after the title. While the `nav` slot is empty, no `<nav>` landmark SHALL be exposed.

#### Scenario: No navigation
- **WHEN** nothing is slotted into `nav`
- **THEN** the bar exposes a banner but no navigation landmark

#### Scenario: Navigation links
- **WHEN** links are given with `slot="nav"` and `nav-label="Sections"`
- **THEN** a navigation landmark named "Sections" contains them

### Requirement: Sticky at the top
The bar SHALL be sticky at the top of its scroll container (top 0) and SHALL stay above the page content, without becoming the containing block of fixed-position slotted content (a slotted drawer panel still covers the viewport).

#### Scenario: Scrolling a long page
- **WHEN** the visitor scrolls down a long page
- **THEN** the bar stays at the top of the viewport and the content scrolls under it

### Requirement: Scroll effect
At the top of the page the bar's background SHALL be the top background (default transparent, no line). Once the window has scrolled down, the bar SHALL carry a `scrolled` attribute and show a translucent background in the page colour with a backdrop blur and a hairline at its lower edge. Scrolling SHALL be detected without per-frame work beyond one passive listener.

#### Scenario: Scrolled down
- **WHEN** the visitor scrolls the page down by any amount
- **THEN** the bar gets `scrolled` and content under it shows blurred through a translucent page-coloured background

#### Scenario: Back at the top
- **WHEN** the visitor scrolls back to the very top
- **THEN** `scrolled` is removed and the bar is transparent again

### Requirement: Manual scroll state
With the `no-scroll-watch` attribute the bar SHALL NOT watch the window, and the page SHALL control the state by setting or removing `scrolled` itself (for previews, or pages that scroll inside a container).

#### Scenario: Preview
- **WHEN** a bar has `no-scroll-watch scrolled`
- **THEN** it shows the scrolled look regardless of the window's scroll position

### Requirement: Accessible fallbacks
Under `prefers-reduced-transparency: reduce`, and where `backdrop-filter` is not supported, the scrolled background SHALL be solid. Under `prefers-reduced-motion: reduce` the change between states SHALL NOT be animated. In forced-colours mode the scrolled bar SHALL use the system canvas colour and a visible line.

#### Scenario: Reduced transparency
- **WHEN** the visitor asks for reduced transparency and scrolls down
- **THEN** the bar's background is the solid page colour without blur

### Requirement: Theming hooks
Every visual value (top and scrolled backgrounds, translucency, blur, lines, text colour, height, padding, gap, title type, layer, duration) SHALL be a `--kakao-header-bar-*` custom property with its default in the component's settings block, editable on its construction page. Colour defaults SHALL refer to theme roles with a literal fallback.

#### Scenario: Theme change
- **WHEN** the theme changes to a dark theme while the page is scrolled
- **THEN** the scrolled background follows the new page colour

### Requirement: Navigation overflow cue
When the navigation region's links do not fit and it scrolls sideways, the bar SHALL fade the region's edge on each side where more links are hidden, and SHALL show no fade on a side that is scrolled to its end, nor at all when nothing overflows. The fade SHALL update on scroll and on size changes without per-frame work while idle. Its width SHALL be the `--kakao-header-bar-nav-fade` setting.

#### Scenario: Narrow screen, scrolled to the start
- **WHEN** the links overflow and the navigation is scrolled to its start
- **THEN** only the end edge is faded

#### Scenario: Scrolled to the middle
- **WHEN** the visitor scrolls the navigation partway
- **THEN** both edges are faded

#### Scenario: Everything fits
- **WHEN** all links fit in the navigation region
- **THEN** neither edge is faded

### Requirement: Published height
A header bar that is a direct child of `<body>` SHALL publish its rendered height as the custom property `--kakao-header-bar-rendered-height` (a length in px) on the root element, keep it current when the bar's size changes, and remove it when the bar is removed. Other header bars SHALL NOT publish it.

#### Scenario: Page offsets follow the height setting
- **WHEN** the bar's height setting is changed and the page reloaded
- **THEN** `--kakao-header-bar-rendered-height` on the root element equals the bar's new rendered height, and page CSS that uses it (scroll padding) follows
