## ADDED Requirements

### Requirement: Responsive grid
`<kakao-grid>` SHALL be a light-DOM CSS grid, drawn by grid.css alone, with as many columns as fit (`auto-fit`) at a minimum width chosen by `min` (`sm`, `md` by default, `lg`, or `--kakao-grid-min`), never wider than the container, a token gap chosen by `gap` (`sm`, `md` by default, `lg`), and `fill` to keep empty tracks. `hidden` SHALL hide it.

#### Scenario: Cards on a phone
- **WHEN** a grid of four cards with `min="md"` is shown 390px wide
- **THEN** the cards stack in one column at full width, with the md gap between them

#### Scenario: Few items with fill
- **WHEN** a wide grid with `fill` holds one card
- **THEN** the card keeps one column's width instead of stretching across the row
