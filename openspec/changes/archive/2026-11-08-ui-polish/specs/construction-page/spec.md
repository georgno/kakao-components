# Spec Delta

## ADDED Requirements

### Requirement: Built from our own components
The construction pages' controls SHALL use the kakao components wherever one exists:
- `<kakao-button>` for actions and icon buttons (reset, detach, the `fx` toggle)
- `<kakao-button>` dropdowns for the unit, the main-variable choice and the preview background
- `<kakao-number-input>` for numbers
- `<kakao-color-picker compact>` for colours

The colour picker SHALL be compact, so the swatch sits in the row like the other controls, with the text field beside it holding the literal or expression. Native controls SHALL remain only where no component exists yet: text fields and range. The components SHALL be tuned to the dense table through their own settings, not by overriding their internals. The page SHALL load `kakao-number-input`, `kakao-color-picker` and the icon font itself when they are missing.

#### Scenario: Choosing a main variable
- **WHEN** the user opens the ◆ dropdown of a length setting
- **THEN** a `kakao-button` menu lists the compatible main variables, and picking one binds the setting to it
