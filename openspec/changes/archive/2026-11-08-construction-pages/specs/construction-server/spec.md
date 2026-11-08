# Spec Delta

## Purpose

A small local development server that serves the project and lets construction pages save settings into source files, because static pages in Firefox cannot write files themselves.

## ADDED Requirements

### Requirement: Serving the project
The construction server SHALL serve the project folder as static files on a local port. It SHALL need only Node and no installed packages, and SHALL listen on the loopback interface only.

#### Scenario: Starting the server
- **WHEN** the developer runs the documented start command
- **THEN** the overview, demo and construction pages are reachable on `http://localhost:<port>`

### Requirement: Saving settings
The server SHALL accept a save request naming a component (or the main variables) and a set of settings, and SHALL replace only the marked settings block of that component's source file (or the tokens file) with the new values. Everything else in the file SHALL be left byte for byte unchanged.

#### Scenario: Successful save
- **WHEN** the construction page for `switch-group` saves a new track height
- **THEN** only the settings block in `components/switch-group/switch-group.js` changes, and the response confirms the save

### Requirement: Safe writes
The server SHALL refuse a save that names an unknown component, a property outside that component's `--kakao-<component>-*` namespace or the main variables, a value containing characters that could end the block or the style rule, or a file without exactly one settings block. A refused save SHALL change no file and SHALL return an error that the construction page shows.

#### Scenario: Unknown component
- **WHEN** a save request names a component folder that does not exist
- **THEN** no file is written and the page shows the error

#### Scenario: Injection attempt
- **WHEN** a save request has a value containing `}` or `*/`
- **THEN** the save is refused and no file changes
