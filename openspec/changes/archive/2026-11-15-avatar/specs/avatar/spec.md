# Spec Delta

## Purpose

`<kakao-avatar>` shows a person, team or bot as a small picture with a fallback that always works; `<kakao-avatar-group>` shows several of them overlapped with a count for the rest.

## ADDED Requirements

### Requirement: Image with fallback
With `src` the avatar SHALL show that image, cropped to fill its shape, loaded lazily (`loading="lazy"`). Until the image has loaded, when there is no `src` and when the image fails, it SHALL show a fallback and never a broken-image mark. It SHALL send `avatar-load` when the image is shown and `avatar-error` when it fails, both bubbling and composed with `detail.src`. It SHALL not depend on another component.

#### Scenario: Image loads
- **WHEN** an avatar has a `src` that loads
- **THEN** the image covers the avatar and `avatar-load` is sent

#### Scenario: Image fails
- **WHEN** an avatar with `name="Margaret Hamilton"` has a `src` that does not load
- **THEN** it shows "MH", no broken-image mark, and `avatar-error` is sent

#### Scenario: Source changed
- **WHEN** `src` is changed or removed later
- **THEN** the avatar loads the new image, or shows the fallback

### Requirement: Initials and icon
The fallback SHALL be, in this order: an element in `slot="icon"` if the page gave one; the initials; a built-in person glyph drawn as inline SVG in `currentColor`. Initials SHALL be `initials` (up to three characters, as written) or else be derived from `name`: the first letter or digit of the first and of the last word in capitals, one letter for a single word.

#### Scenario: Derived initials
- **WHEN** an avatar has `name="Jean-Luc van Damme"` and no image
- **THEN** it shows "JD"

#### Scenario: No name
- **WHEN** an avatar has no `name`, `initials`, `src` or slotted icon
- **THEN** it shows the person glyph

#### Scenario: Own icon
- **WHEN** an avatar has a `name` and an SVG in `slot="icon"`
- **THEN** it shows the icon, not initials

### Requirement: Size and shape
`size` SHALL be `xs`, `sm`, `md` (default), `lg` or `xl`; initials, icon and status dot SHALL scale with it. `shape` SHALL be `circle` (default) or `square` (rounded corners). The avatar SHALL be inline and SHALL never take focus.

#### Scenario: Large square
- **WHEN** an avatar has `size="lg" shape="square"`
- **THEN** it is a larger rounded square with larger initials

#### Scenario: Tabbing past
- **WHEN** a keyboard user tabs through a page with avatars
- **THEN** focus never stops on one

### Requirement: Tone from the name
Without `tone` (or with `tone="auto"`) the fill behind initials or icon SHALL be one of the tones neutral, primary, success, warning and danger, chosen from `name` so that the same name always gets the same tone; without a name it SHALL be neutral. `tone` SHALL pick one by name. Every tone SHALL be built from theme roles only and the initials SHALL have a contrast of at least 4.5:1 on the fill in every theme.

#### Scenario: Same name, same tone
- **WHEN** two avatars on different pages have `name="Ada Lovelace"`
- **THEN** both have the same fill

#### Scenario: Theme change
- **WHEN** the theme changes
- **THEN** fills and initials follow the theme's roles and stay readable

### Requirement: Status
`status` SHALL accept `online`, `away`, `busy` and `offline` and show a dot at the lower end corner, ringed in the surface colour. The four SHALL differ in shape as well as in colour. Any other value SHALL show no dot.

#### Scenario: Busy
- **WHEN** an avatar has `status="busy"`
- **THEN** a dot in the danger colour with a bar across it is shown

### Requirement: Accessible name
With a `name` the avatar SHALL be exposed as an image named by the name, followed by the status text when a status is set ("Online", "Away", "Busy", "Offline", or `status-label`). Without a name it SHALL be hidden from assistive technology, unless it has a status, which is then its name.

#### Scenario: Name and status
- **WHEN** an avatar has `name="Ada Lovelace" status="online"`
- **THEN** a screen reader announces an image "Ada Lovelace, Online"

#### Scenario: Decorative
- **WHEN** an avatar has no name and no status
- **THEN** a screen reader skips it

### Requirement: Group
`<kakao-avatar-group>`, defined by the same file, SHALL lay its `kakao-avatar` children in a row, each overlapping the one before, with a ring around each in `--kakao-avatar-ring-color` (the surface colour). `size` and `shape` on the group SHALL apply to every avatar in it. `label` SHALL name the group for assistive technology. The group SHALL not change its children's attributes.

#### Scenario: Group size
- **WHEN** a group has `size="sm"`
- **THEN** all its avatars are small, whatever their own `size`

### Requirement: Overflow
With `max` the group SHALL show the first `max` avatars and one more element reading "+N", where N is the number not shown; `total` SHALL raise the count to avatars the page did not render. Above 99 it SHALL show "99+". Assistive technology SHALL get `more-label` with `{count}` replaced (default "{count} more"). Adding or removing avatars later SHALL update it.

#### Scenario: Six avatars, max three
- **WHEN** a group with `max="3"` holds six avatars
- **THEN** three avatars and "+3" are shown, and "3 more" is read

#### Scenario: Total
- **WHEN** a group holds three avatars and has `total="12"`
- **THEN** it shows the three and "+9"

#### Scenario: Everything fits
- **WHEN** a group with `max="5"` holds four avatars
- **THEN** no "+N" is shown

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-avatar-*` custom property with its default in the one settings block in `avatar.js`, used by both elements; colours SHALL default to theme roles. The image fade SHALL be off under reduced motion, and in forced colours the avatar SHALL keep a visible edge.

#### Scenario: Ring on the page background
- **WHEN** a group sits on the page background and `--kakao-avatar-ring-color` is set to the page colour
- **THEN** the rings match the background
