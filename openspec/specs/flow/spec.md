# flow Specification

## Purpose
`<kakao-flow>` is a vertical flow: one token gap between its children, drawn by light-DOM CSS alone.

## Requirements

### Requirement: Vertical flow
`<kakao-flow>` SHALL be a light-DOM block, drawn by flow.css alone, that puts one token gap (`gap`: `sm`, `md` by default, `lg`) between its visible children and none before the first or after the last, replacing the children's own block margins. Hidden children SHALL leave no gap; `hidden` SHALL hide the flow.

#### Scenario: Sections with page margins
- **WHEN** a flow holds an `h2`, a `p` and a card, and the page CSS gives `h2` and `p` margins
- **THEN** the space between each pair is the flow's gap, and the first child starts at the flow's top edge
