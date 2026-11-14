## Why

The component list grew in build order, so finding a component meant scanning
the whole page. The "Not built yet" list also lacked the data components and an
image component, and there was no decision on how data tables behave on a phone.

## What Changes

- `components.html`: the component cards are in alphabetical order by name.
- "Not built yet": Table (now says rows wrap on a phone by default), new Grid
  view (sort icon per heading, a search or dropdown filter per column, an action
  column with buttons; built on Table) and new Image (lazy load, skeleton while
  loading, alt text, caption; uses Skeleton). A placeholder names the component
  it depends on.
- Styleguide rule "Data tables on small screens": on a phone a data table wraps
  each row into label/value pairs by default; sideways scrolling is an opt-in.
  The styleguide's own reference tables keep scrolling.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `component-overview`: the overview lives on `components.html`, in alphabetical
  order; placeholders can name a prerequisite.
- `component-conventions`: data tables wrap rows on small screens.

## Impact

`components.html`, `styleguide.html`, `CHANGELOG.md`. No component code.
