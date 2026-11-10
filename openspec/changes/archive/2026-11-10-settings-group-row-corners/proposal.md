## Why

Every row in a settings group rounded all four corners (the 10px row radius), so the hover wash of a middle row showed rounded corners against its neighbours' hairlines, and rows never read as one joined list.

## What Changes

- Only the first row rounds its top corners and only the last row its bottom corners; a single row keeps all four. Middle rows are square, so hover washes and focus rings of neighbouring rows meet flush and the outer corners follow the box (14px − 4px padding).
- No new setting: `--kakao-settings-group-row-radius` stays the outer corner radius.

## Capabilities

### Modified Capabilities

- `settings-group`: adds the row corners requirement.

## Impact

`components/settings-group/settings-group.js` only (group passes the corner values to its rows through private custom properties). No API change.
