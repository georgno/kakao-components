## Purpose
A deterministic command-line checker that reads markup, finds every kakao component placement and reports where it breaks the styleguide's rules, so a violation fails a build the way a static analyser does.

## ADDED Requirements

### Requirement: Command and exit codes
The checker SHALL run as `node tools/style-check.js [paths…]` with Node only and no installed packages. Paths SHALL be files or folders; folders SHALL be searched for files with the configured extensions (by default `.html`, `.htm`, `.php`, `.phtml`, `.twig`). With no paths, the configured default paths SHALL be used. It SHALL exit with code 0 when no error remains, 1 when at least one error remains, and 2 when it cannot run (unreadable config, unknown rule, missing path).

#### Scenario: Clean run
- **WHEN** the checker runs over files whose placements break no rule
- **THEN** it prints a summary with zero errors and exits with code 0

#### Scenario: A violation fails the run
- **WHEN** one placement breaks a rule whose level is error
- **THEN** the checker exits with code 1

#### Scenario: Broken setup
- **WHEN** the config names a rule that does not exist
- **THEN** the checker prints what is wrong and exits with code 2, without checking any file

### Requirement: Deterministic results
For the same files, config and rules, the checker SHALL produce the same report, byte for byte. Findings SHALL be ordered by file path, then line, then column, then rule id. It SHALL NOT depend on a browser, the network, the clock or the order the file system lists files in.

#### Scenario: Two runs
- **WHEN** the checker runs twice over the same tree
- **THEN** both reports are identical

### Requirement: Reading placements from markup
The checker SHALL find every element whose tag name starts with `kakao-` in the scanned files, with its attributes, its line and column, its parent, its children and its slot. It SHALL tolerate template syntax around and inside markup (`<?php … ?>`, `{{ … }}`, `{% … %}`). An attribute value that contains template syntax SHALL count as dynamic: a rule that needs that value SHALL skip it rather than report it. Components created by script are out of scope.

#### Scenario: A Yii2 view
- **WHEN** a `.php` view contains `<kakao-button label="<?= Html::encode($label) ?>" variant="ghost">`
- **THEN** the checker reads the button with a dynamic label and a ghost variant, and reports its line

#### Scenario: Dynamic value
- **WHEN** a `list-data` attribute holds `<?= json_encode($items) ?>`
- **THEN** the JSON rule skips that placement instead of reporting invalid JSON

### Requirement: Rules as code
Each rule SHALL be one JavaScript module with an id, a default level (error or warning), a short description and a check that receives a placement and returns zero or more findings, each with a message. The checker SHALL load the built-in rules and any rule folders named in the config. Two rules with the same id SHALL be a setup error.

#### Scenario: A project's own rule
- **WHEN** the config lists a rule folder of a Yii2 project with a rule `brand-button-variant`
- **THEN** that rule runs next to the built-in ones and its findings carry its id

### Requirement: Built-in rules
The checker SHALL ship rules for the styleguide's decided rules that markup can show:
- `dialog-main-button-corner`: in a dialog footer with more than one button, the main (filled) button is the one in the corner: last for right (default) and full-width footers, first for `button-position="left"`, last when centred.
- `card-main-button-first`: in a card footer, the main button comes first.
- `list-data-name`: a component never takes its JSON configuration in a `data` attribute.
- `list-data-json`: a static `list-data` value is valid JSON.
- `field-has-name`: a text input, textarea, radio group or colour picker without a `label` has an `aria-label`.
- `icon-button-has-name`: a button with an icon and no `label` has an `aria-label`.
- `attribute-values`: attributes with a fixed set of values (button `variant` and `size`, badge and chip `tone`, dialog `size` and `button-position`, breadcrumb `start`) use one of them.

#### Scenario: Main button in the wrong corner
- **WHEN** a dialog with `button-position="left"` has a ghost Discard button first and a primary Save button second
- **THEN** `dialog-main-button-corner` reports the dialog's footer at its line

#### Scenario: Unknown tone
- **WHEN** a badge has `tone="warning"`
- **THEN** `attribute-values` reports that warning is not one of neutral, primary, success, danger, ink

### Requirement: Configuration
The checker SHALL read `kakao-style.config.json` from the working directory, or the file given with `--config`. The config SHALL be able to set: the default paths, ignored paths, the file extensions, each rule's level (`error`, `warning` or `off`), extra rule folders, and the forced-placement documentation (`forced.file`, `forced.mandatory`). Every setting SHALL have a default, so the checker also runs without a config file.

#### Scenario: A rule turned down
- **WHEN** the config sets `card-main-button-first` to `warning`
- **THEN** its findings are listed as warnings and do not change the exit code

### Requirement: Report
The checker SHALL print each finding as `path:line:column  level  rule-id  message`, grouped by file, followed by a summary of errors, warnings and forced placements. With `--format json` it SHALL print the same findings as JSON instead. Warnings SHALL never change the exit code.

#### Scenario: Reading a finding
- **WHEN** a finding is reported
- **THEN** its line names the file, line and column of the element, the rule id and a sentence saying what is wrong and what the rule expects

### Requirement: Forced placements
A placement whose element carries the `force` attribute SHALL NOT produce errors or warnings. Its findings SHALL be listed in a separate "forced" section of the report, with the rule id and the message they would have had. A forced placement that breaks no rule SHALL be reported as a warning ("force has no effect here"), so stale `force` attributes are found.

#### Scenario: Deliberate exception
- **WHEN** a dialog with its main button first carries `force`
- **THEN** the run has no error for it, and the forced section lists it with `dialog-main-button-corner`

#### Scenario: Stale force
- **WHEN** an element carries `force` but breaks no rule
- **THEN** the checker warns that force has no effect there

### Requirement: Documenting forced placements
When `forced.mandatory` is true, every forced placement SHALL have an entry in the documentation file (default `kakao-style.forced.md`), keyed by the element's `id` and giving a reason. A forced placement without an `id` or without an entry SHALL be an error, and so SHALL an entry whose id no longer belongs to a forced placement. When `forced.mandatory` is false (the default), the file SHALL be optional; if it exists, its reasons SHALL appear next to the matching forced placements in the report, and missing or stale entries SHALL NOT be reported.

#### Scenario: Mandatory and undocumented
- **WHEN** `forced.mandatory` is true and a forced dialog with id `legacy-confirm` has no entry
- **THEN** the checker reports an error asking for an entry for `legacy-confirm`

#### Scenario: Optional by default
- **WHEN** no config sets `forced.mandatory` and there is no documentation file
- **THEN** forced placements are only listed in the forced section, without errors
