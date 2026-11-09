## Why

Pages built with kakao components have no way to show where the visitor is in a
hierarchy. A breadcrumb that takes a plain list of title/url pairs makes that a
one-liner.

## What Changes

- New `<kakao-breadcrumb>`: items from `list-data` (objects `{title, url}` or
  pairs `["Title", "/url"]`) or the `items` property; the last item is the
  current page.
- A start item first: a house icon by default, or the start text (`start="text"`),
  which comes from a constant (`'Start'`) that can be changed globally or per
  element.
- Cancelable `breadcrumb-navigate` event for single-page apps.
- Demo, construction page, overview card, styleguide audit row, kitchen sink.

## Capabilities

### New Capabilities
- `breadcrumb`: the `<kakao-breadcrumb>` trail.

### Modified Capabilities

## Impact

New `components/breadcrumb/`. Changes to `components.html`, `kitchen-sink.html`,
`styleguide.html`.
