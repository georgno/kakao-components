## MODIFIED Requirements

### Requirement: Built-in rules
The checker SHALL ship rules for the styleguide's decided rules that markup can show: `dialog-main-button-corner` and `card-main-button-first` (see "Button order rules"), `list-data-name` (a component never takes its JSON configuration in a `data` attribute), `list-data-json` (a static `list-data` value is valid JSON), `field-has-name` and `icon-button-has-name` (see "Naming rules"), `attribute-values` (see "Attribute value rule") and `page-loads-dependencies` (see "Dependency rule").

#### Scenario: JSON in data
- **WHEN** a list has its items in a `data` attribute
- **THEN** `list-data-name` reports it

### Requirement: Configuration
The checker SHALL read `kakao-style.config.json` from the working directory, or the file given with `--config`. The config SHALL be able to set: the default paths, ignored paths, the file extensions, each rule's level (`error`, `warning` or `off`), extra rule folders, the forced-placement documentation (`forced.file`, `forced.mandatory`) and the manifest file (`manifest`). Every setting SHALL have a default, so the checker also runs without a config file; the manifest defaults to `custom-elements.json` next to the config, else the one shipped with the checker. A named manifest that does not exist SHALL be a setup error.

#### Scenario: A rule turned down
- **WHEN** the config sets `card-main-button-first` to `warning`
- **THEN** its findings are listed as warnings and do not change the exit code

## ADDED Requirements

### Requirement: Dependency rule
The built-in rule `page-loads-dependencies` SHALL report, for each kakao tag a page uses, a missing script of that component, a missing light-DOM CSS file, a missing script of a component it requires (directly or through another), and a required script loaded after the script that needs it. Its data SHALL come from custom-elements.json (`kakao.script`, `kakao.css`, `kakao.requires`), never from a list kept in the checker. The message SHALL name the missing file, written as the page would write its URL when that can be derived from a kakao script it loads. Each missing file SHALL be reported once per page.

#### Scenario: Tabs without their CSS
- **WHEN** a page loads tabs.js but not tabs.css and uses `<kakao-tabs>`
- **THEN** the rule reports that the page needs tabs.css

#### Scenario: Toast without its requirements
- **WHEN** a page loads toast.js but neither stack.js nor alert.js and uses `<kakao-toast>`
- **THEN** the rule reports stack.js and alert.js, each to be loaded before toast.js

#### Scenario: Wrong order
- **WHEN** a page loads tag-input.js before chip.js
- **THEN** the rule reports that chip.js must load before tag-input.js

### Requirement: Dependency rule matching and templates
`page-loads-dependencies` SHALL match a loaded URL to a manifest file by its folder and file name, after resolving a relative URL against the page and ignoring a query or fragment. It SHALL skip a file without a `<head>` and tags the manifest does not list; in a template file (.php, .phtml, .twig) or a head containing template code its findings SHALL be warnings.

#### Scenario: A Yii2 view
- **WHEN** a `.php` view without a `<head>` uses `<kakao-toast>`
- **THEN** the rule reports nothing for it
