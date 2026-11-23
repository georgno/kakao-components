# stack Specification

## Purpose
`<kakao-stack>` piles its children as cards, newest in front and older ones smaller, paler and tilted back, fans them out on hover or focus, and is the base class other components (the toast) extend to get the same pile.

## Requirements

### Requirement: Cards
Every element child of the stack SHALL be a card, the last child the newest; children with the `hidden` attribute SHALL be skipped until it is removed. A subclass SHALL be able to choose which children are cards.

#### Scenario: Three children
- **WHEN** a stack has three `<kakao-card>` children
- **THEN** the last one is in front and the two others peek out behind it, the first furthest back

### Requirement: Placement
Without `position`, or with `position="inline"`, the stack SHALL sit in the page flow, as wide as its container up to its width setting, and its cards SHALL peek out below the front card. `bottom-right`, `bottom-left`, `top-right` and `top-left` SHALL fix it to that corner of the viewport with a gutter plus the safe-area insets, below the header bar in top corners, spanning the viewport width below 30rem; in bottom corners the cards SHALL peek out above the front card.

#### Scenario: Inline height
- **WHEN** an inline stack holds three cards and is collapsed
- **THEN** the content after it starts below the front card plus two peeks

### Requirement: Clear of an open aside menu
A corner stack SHALL move beside an aside menu that opens on its side when enough room is left, and SHALL move back when it closes.

#### Scenario: Right menu opens
- **WHEN** a right aside menu opens on a 1280px viewport while a bottom-right stack is shown
- **THEN** the stack moves left of the panel

### Requirement: Fading
Each card behind the front one SHALL be smaller by the scale step, tilted back by the tilt and paler by the fade step per position, SHALL stay opaque, and SHALL show only its peeking strip. By default a card is made paler by desaturating it; a subclass SHALL be able to fade something of the card's own instead.

#### Scenario: Toast
- **WHEN** alerts are stacked by the toast
- **THEN** the cards behind have less tint, not a filter

### Requirement: Expanding
The stack SHALL fan out into a list of full-size cards with a gap while the pointer is over it or focus is inside it, set `expanded` meanwhile, and collapse again when neither holds. On touch, a tap on the stack outside its controls SHALL toggle it and a tap elsewhere SHALL collapse it.

#### Scenario: Hover
- **WHEN** the pointer moves onto a collapsed stack of three cards
- **THEN** all three are shown full size and readable

### Requirement: Maximum visible
`max` (default 3, minimum 1) SHALL limit how many cards are visible; older ones SHALL stay hidden and out of the accessibility tree until newer ones leave. A card that holds focus SHALL stay visible.

#### Scenario: Five cards
- **WHEN** five cards are in a stack with the default `max`
- **THEN** only the three newest are visible

### Requirement: Adding and dismissing
An added card SHALL slide in at the front. `dismiss(card, reason)` SHALL move the card out (sideways towards the edge in a corner, shrinking inline), move the others into place, remove the element and resolve with the reason (default `method`). Under `prefers-reduced-motion: reduce` there SHALL be no sliding, fading or fanning animation.

#### Scenario: Dismiss the front card
- **WHEN** a script calls `stack.dismiss(stack.items[0])`
- **THEN** the card leaves, the next one comes to the front, the element is removed and the promise resolves with `method`

### Requirement: Events
The stack SHALL fire bubbling, composed `stack-add` (`{ item }`), `stack-removed` (`{ item, reason }`) and `stack-expand` (`{ expanded }`), also emitted as triggers through the component API. A subclass SHALL be able to replace them with its own.

#### Scenario: Removed
- **WHEN** a card is dismissed
- **THEN** `stack-removed` fires with that card and the reason

### Requirement: Extending
`KakaoStack` SHALL be available as `window.KakaoStack` and SHALL document hooks for extra shadow styles (its settings), which children are cards, added and removed cards, expansion, each layout pass, the fade, the leave movement and the default placement, and for a card whose exit the subclass animates itself.

#### Scenario: Toast
- **WHEN** toast.js loads after stack.js
- **THEN** `<kakao-toast>` is a `KakaoStack` and only adds alerts, timers, Escape, the live region and its events
