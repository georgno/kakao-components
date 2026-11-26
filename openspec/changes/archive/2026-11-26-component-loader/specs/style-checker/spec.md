## MODIFIED Requirements

### Requirement: Dependency rule matching and templates
`page-loads-dependencies` SHALL match a loaded URL to a manifest file by its folder and file name, after resolving a relative URL against the page and ignoring a query or fragment. It SHALL skip a file without a `<head>`, a page that loads the loader (`shared/kakao.js`, which loads everything a page uses) and tags the manifest does not list; in a template file (.php, .phtml, .twig) or a head containing template code its findings SHALL be warnings.

#### Scenario: A Yii2 view
- **WHEN** a `.php` view without a `<head>` uses `<kakao-toast>`
- **THEN** the rule reports nothing for it

#### Scenario: A page with the loader
- **WHEN** a page loads `shared/kakao.js` and uses `<kakao-toast>` and `<kakao-tabs>` without their files
- **THEN** the rule reports nothing
