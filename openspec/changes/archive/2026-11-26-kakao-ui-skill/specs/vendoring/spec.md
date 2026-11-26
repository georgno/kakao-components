## MODIFIED Requirements

### Requirement: Vendor command
`node tools/vendor.js <dest> [component…]` SHALL copy into `<dest>` exactly the files the named components need: each component's script and light-DOM CSS, and those of the components it requires or is enhanced by (transitively), plus shared/kakao.js, shared/kakao.css, shared/tokens.css, shared/themes.css, shared/font.css with its font files, shared/component-api.js, CATALOG.md, custom-elements.json, and as reference `skills/kakao-ui/`, `templates/` and `recipes/`, in the repo's layout. Components SHALL be named by folder or tag; with none named, it SHALL copy all. It SHALL write `<dest>/VERSION` holding the release tag of the checked-out commit (or `git describe` with a warning when that commit has no tag). It SHALL refuse a non-empty `<dest>` that holds no VERSION file, and replace the contents of one that does. It SHALL use Node only, no packages.

#### Scenario: Toast only
- **WHEN** `node tools/vendor.js vendor/kakao toast` runs
- **THEN** vendor/kakao holds toast.js, stack.js, alert.js, button.js, button.css, tooltip.js and the shared files, and no other component

#### Scenario: Unknown name
- **WHEN** a name matches no component folder or tag
- **THEN** the command exits with code 2 and names it

#### Scenario: The skill arrives with the code
- **WHEN** any vendor run finishes
- **THEN** `<dest>/skills/kakao-ui/SKILL.md`, `<dest>/templates/page.html` and `<dest>/recipes/` are there, from the same commit as the components
