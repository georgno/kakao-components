# file-upload Specification

## Purpose
`<kakao-file-upload>` replaces the native file input with a labelled drop area and a list of selected files that grows across several picks, so files can be collected from different folders.

## Requirements

### Requirement: Adding files
Picking or dropping files SHALL add them to the list rather than replace it, unless `multiple="false"`, in which case a new file replaces the old one. Files SHALL be checked against `accept` (also when dropped), `max-size` and `max-files`; rejected files, duplicates and folders SHALL fire `file-reject` with `reason` "type", "size", "max-files", "duplicate" or "folder". Every change SHALL fire `files-change` `{ files, added, removed }`.

#### Scenario: Second pick from another folder
- **WHEN** the user picks two files, then opens the dialog again and picks one more
- **THEN** the list shows all three files

#### Scenario: Too large
- **WHEN** a file larger than `max-size` is dropped
- **THEN** it is not added and `file-reject` fires with `reason: "size"`

### Requirement: File list
Each file SHALL be listed with its name, size, a thumbnail (an image preview, or a compact type icon with the extension centred on it) and a remove button. No placeholder text SHALL be shown while the list is empty.

#### Scenario: Removing a file
- **WHEN** the user clicks a file's remove button
- **THEN** the file is removed and `files-change` fires with it in `removed`

### Requirement: Drop area
The drop area SHALL show a label, a hint (built from `accept` and `max-size` unless `hint` is set), and a "Browse files" `kakao-button` (a native button when that component is not loaded). Clicking the area or pressing Enter on it SHALL open the file dialog. Its background SHALL be a fixed, subtle dot grid in which dots near the pointer are tinted in a soft spotlight that fades with distance, and the icon SHALL lift while the pointer is inside the area.

#### Scenario: Pointer inside
- **WHEN** the pointer moves inside the drop area
- **THEN** the dots stay in place, the spotlight follows the pointer and the icon stays lifted until the pointer leaves

### Requirement: Horizontal layout
With `horizontal` the file list SHALL sit beside the drop area, falling back to stacked when the component is narrower than 34rem.

#### Scenario: Narrow container
- **WHEN** a horizontal upload is placed in a 300px column
- **THEN** the list is shown below the drop area

### Requirement: Form participation
The element SHALL be form-associated: with `name` every file SHALL be submitted under that name, `form.reset()` SHALL clear the list and `disabled` SHALL block picking, dropping and removing.

#### Scenario: Submitting
- **WHEN** a form containing an upload named "documents" with two files is submitted
- **THEN** `FormData.getAll('documents')` returns both files
