# Spec Delta

## Purpose

`<kakao-image>` shows an image that keeps its place while it loads: a skeleton of its size until the file is there, the alt text, and an optional caption.

## ADDED Requirements

### Requirement: Source and loading
The component SHALL render a native `<img>` in its shadow root with `src`, `srcset` and `sizes` taken from its attributes, and SHALL load it lazily unless `loading="eager"` is set. Without `src` and `srcset` it SHALL stay in the loading state. Changing `src`, `srcset` or `sizes` SHALL start a new load. A read-only `state` property SHALL be `loading`, `loaded` or `error`, and `reload()` SHALL load the current source again.

#### Scenario: Lazy by default
- **WHEN** an image has a `src` and no `loading` attribute
- **THEN** its `<img>` has `loading="lazy"`

#### Scenario: Source set later
- **WHEN** an image without `src` gets one
- **THEN** it goes from the loading state to loaded once the file is there

### Requirement: Alt text
`alt` SHALL be the `<img>`'s text alternative from the start, also while the placeholder shows. An empty or missing `alt` SHALL give `alt=""` (a decorative image). The component SHALL never take focus.

#### Scenario: Decorative
- **WHEN** an image has `alt=""`
- **THEN** assistive technology skips it

#### Scenario: Tabbing past
- **WHEN** a keyboard user tabs through a page with images
- **THEN** focus never stops on one

### Requirement: Caption
A `caption` attribute or content in `slot="caption"` SHALL be shown below the image in a `<figcaption>` of a `<figure>`; slotted content SHALL replace the attribute. Without a caption no figcaption SHALL be shown and the figure SHALL have no figure role. The caption SHALL be as wide as the image.

#### Scenario: Caption attribute
- **WHEN** an image has `caption="Evening at the coast"`
- **THEN** that text stands below the image as the figure's caption

#### Scenario: Slotted caption
- **WHEN** an element with a link is slotted as `caption` and the attribute is set too
- **THEN** only the slotted content is shown

### Requirement: Reserved size
`width`, `height` and `radius` SHALL accept a bare number as pixels or a CSS length, and `ratio` an aspect ratio; a value CSS does not accept SHALL be ignored. With a height or a ratio the frame SHALL have its final size before the image has loaded, and SHALL never be wider than its place. Two plain numbers for `width` and `height` SHALL give the frame's ratio.

#### Scenario: No size given
- **WHEN** an image has neither height nor ratio
- **THEN** the loading frame has the placeholder height from the settings and the loaded image its own size

#### Scenario: Width and height
- **WHEN** an image with `width="640" height="360"` sits in a 400 pixel wide place
- **THEN** its frame is 400 by 225 pixels before and after the load

#### Scenario: Ratio
- **WHEN** an image has `ratio="16/9"` in a 400 pixel wide place
- **THEN** its frame is 400 by 225 pixels

### Requirement: Fit and radius
`fit` SHALL be `cover` (default: the image fills the frame and is cut where needed) or `contain` (the whole image inside the frame). `radius` SHALL set the frame's corner radius; the default comes from the settings.

#### Scenario: Contain
- **WHEN** a tall image has `ratio="16/9" fit="contain"`
- **THEN** the whole image is visible with free space left and right

### Requirement: Skeleton placeholder and fade
While loading, the frame SHALL show a `kakao-skeleton` block that fills it, hidden from assistive technology. Where `kakao-skeleton` is not defined the placeholder SHALL be a plain block in the placeholder colour and the image SHALL work the same. When the image has loaded it SHALL fade in over the placeholder, and the placeholder SHALL then be removed from rendering. Under reduced motion there SHALL be no fade.

#### Scenario: Slow image
- **WHEN** an image's file takes two seconds to arrive
- **THEN** a skeleton of the frame's size shows for that time and the picture then fades in

#### Scenario: Skeleton not loaded
- **WHEN** a page loads `image.js` without `skeleton.js`
- **THEN** a loading image shows a plain block of the frame's size and loads as usual

#### Scenario: Reduced motion
- **WHEN** the system asks for reduced motion
- **THEN** the loaded image appears without a transition

### Requirement: Error state
When the image fails to load, the frame SHALL keep its size and show a muted icon with the alt text; a decorative image SHALL show the icon only, hidden from assistive technology. The caption SHALL stay. A new source or `reload()` SHALL leave the error state.

#### Scenario: Missing file
- **WHEN** the `src` of an image with `alt="Floor plan"` does not exist
- **THEN** the frame shows the icon and "Floor plan"

### Requirement: Events
The component SHALL dispatch `image-load` (detail: `src`, `currentSrc`, `naturalWidth`, `naturalHeight`) when the image has loaded and `image-error` (detail: `src`) when it fails. Both SHALL bubble and cross shadow roots.

#### Scenario: Listening on the document
- **WHEN** an image inside another component's shadow root fails
- **THEN** a listener on the document receives `image-error` with the `src`

### Requirement: Theming hooks
Every visual value SHALL be a `--kakao-image-*` custom property with its default in the component's one settings block, colours defaulting to theme roles, and all of them listed on `components/image/construction.html`.

#### Scenario: Theme change
- **WHEN** the page switches to a dark theme
- **THEN** the caption, the error state and the placeholder take that theme's colours
