# Spec Delta

## MODIFIED Requirements

### Requirement: Overview page
`components.html` SHALL show one full-width card per component with several examples, a link to its demo page and a link to its construction page, the cards in alphabetical order by component name. It SHALL also link to the kitchen sink and the main-variables page, and SHALL have a "Not built yet" section with placeholder cards showing the native element for each component that does not exist yet. A placeholder for a component that needs another unbuilt component first SHALL name it. Its sections SHALL be listed in a `kakao-toc` that follows the scroll position: a sticky sidebar on wide screens, a sticky folded bar on narrow ones.

#### Scenario: New component built
- **WHEN** a component from the "Not built yet" list is implemented
- **THEN** it gets its own card, placed in alphabetical order, and its placeholder card is removed

#### Scenario: Construction link
- **WHEN** the user clicks a card's construction link
- **THEN** that component's construction page opens

#### Scenario: Prerequisite named
- **WHEN** a planned component builds on another planned one (Grid view on Table)
- **THEN** its placeholder says which one comes first

#### Scenario: Table of contents
- **WHEN** the user scrolls the overview to the Tabs card
- **THEN** the table of contents marks "Tabs" as the current section, and a new card shows up in it without editing a script
