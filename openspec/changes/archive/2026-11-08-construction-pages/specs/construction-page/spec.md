# Spec Delta

## Purpose

A construction page per component where its look is tuned live, design-tool style, and the chosen values are saved into the component as its built-in defaults.

## ADDED Requirements

### Requirement: Every component has a construction page
Every component SHALL have a construction page at `components/<name>/construction.html`. A new component SHALL NOT count as done without one, and a change to an existing component's visual settings SHALL update its construction page to match.

#### Scenario: New component
- **WHEN** a new component is added to the project
- **THEN** its folder contains `construction.html` listing all of its visual settings

#### Scenario: New custom property
- **WHEN** a component gains a new visual `--kakao-<component>-*` property
- **THEN** the property appears in the component's settings table

### Requirement: Live preview
The construction page SHALL show the component in one or more representative states (for example default, checked, disabled, open) on a neutral canvas. Every change in the settings table SHALL show up in the preview immediately, without reloading.

#### Scenario: Changing a colour
- **WHEN** the user changes the accent colour in the settings table
- **THEN** every preview instance shows the new colour at once

#### Scenario: Preview background
- **WHEN** the user switches the canvas between light, dark and checkered backgrounds
- **THEN** the preview is shown on that background, without changing any component setting

### Requirement: Settings table
The settings table SHALL list every visual setting of the component, grouped into sections such as Colour, Size & spacing, Shape, Typography, Effects and Motion. Each setting SHALL show its name, its custom property and a control suited to its type: colour picker with hex field, number with unit for lengths, slider for opacity and scale, millisecond field for durations, and text for shadows and easings.

#### Scenario: Length setting
- **WHEN** the user enters 12 and picks "px" for the track height
- **THEN** the preview's track becomes 12px high

#### Scenario: Invalid value
- **WHEN** the user enters a value the browser cannot parse for that property
- **THEN** the field is marked invalid, the preview keeps the last valid value and Save is blocked until it is fixed

### Requirement: Using main variables
Every setting SHALL be able to take a global main variable of a matching type (for example the primary colour or horizontal padding) instead of a literal value. A setting bound to a main variable SHALL show the variable's name and its current value, and SHALL follow when that variable changes.

#### Scenario: Binding a colour to the primary colour
- **WHEN** the user sets the switch's on-colour to the main variable "primary colour"
- **THEN** the setting shows "primary colour" and the preview uses the primary colour

#### Scenario: Unbinding
- **WHEN** the user detaches a bound setting
- **THEN** the setting keeps the variable's current value as a literal

### Requirement: Changed state and reset
The page SHALL mark every setting that differs from the component's saved default. It SHALL offer a reset for a single setting and for all settings, and SHALL warn before leaving the page while there are unsaved changes.

#### Scenario: Reset one setting
- **WHEN** the user resets a changed setting
- **THEN** it returns to the saved default and loses its changed mark

#### Scenario: Leaving with unsaved changes
- **WHEN** the user closes the page with unsaved changes
- **THEN** the browser asks for confirmation

### Requirement: Saving into the component
A Save button SHALL write the current settings into the component's source as its built-in defaults, so every page that uses the component shows them without loading anything else. Settings bound to a main variable SHALL be saved as a reference to that variable, with the current literal value as a fallback.

#### Scenario: Save
- **WHEN** the user saves a changed thumb size
- **THEN** after reloading the demo page, the component shows the new thumb size

#### Scenario: Saved token reference without tokens file
- **WHEN** a page uses a component whose saved default refers to a main variable, but does not load the tokens file
- **THEN** the component shows the saved fallback value

#### Scenario: Save without server
- **WHEN** the construction page is opened without the construction server
- **THEN** the preview and table work, Save is disabled and a hint explains how to start the server

### Requirement: Exporting settings
The page SHALL let the user copy the current settings as CSS custom property declarations, so they can be used as a theme on a page without changing the component's defaults.

#### Scenario: Copy as CSS
- **WHEN** the user clicks "Copy CSS"
- **THEN** the clipboard holds the changed settings as `--kakao-<component>-*: value;` lines
