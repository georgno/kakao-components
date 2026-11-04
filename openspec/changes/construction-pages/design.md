# Design

## Context

Components define their defaults in two ways today:

- Shadow DOM components (switch-group, step-switch, file-upload, multi-dropdown, popover, slider, list, animated-number) declare `--kakao-<component>-*` defaults on `:host` inside the CSS string in their `.js` file. The internal rules then read those properties.
- Light DOM components keep their styles in a separate `.css` file. button.css declares its defaults on `:root`. tabs.css and number-input.css hard-code most values, and button.js, tabs.js and number-input.js use no custom properties at all.

A declaration on `:host` beats a value inherited from an ancestor. So, contrary to the current docs, theming on an ancestor does not reach shadow components; only setting the property on the element itself works. The construction page has to theme a whole preview canvas at once, and tokens must be able to apply to a subtree, so this needs fixing.

Pages are served statically. Firefox is the reference browser and has no File System Access API, so a page cannot write files itself. Node 26 is installed.

## Goals / Non-Goals

**Goals:**
- One shared engine, so a component's construction page is mostly its preview markup plus a list of its settings.
- Saved defaults are plain source text inside the component, so components keep working as single files with no build step.
- Theming works from the element, any ancestor or a token, in that priority order.

**Non-Goals:**
- No visual redesign. Saved values start equal to today's defaults.
- No undo history beyond "reset to saved", and no version management of settings (that is git's job).
- No editing of behaviour attributes (`thumb-drag`, `async`, …). The table covers visual custom properties only. The preview may still offer a few state toggles.
- No production use of the server. It is a local dev tool.

## Decisions

### 1. Private alias pattern for every setting

Inside the settings block, each public property is resolved once into a private alias on the component's root selector. All other rules use only the alias.

```css
/* @kakao-settings:start (written by construction.html, edit there) */
--_track-height: var(--kakao-switch-track-height, 1.75rem);
--_track-bg-on: var(--kakao-switch-track-bg-on, var(--kakao-color-primary, #4f46e5));
/* @kakao-settings:end */
```

Because the public property is never declared by the component, a value set on the element or on any ancestor is inherited and wins over the default. Tokens resolve wherever they are set, so a subtree can carry its own primary colour.

The root selector is `:host` for shadow components and the element selector (`kakao-button`, `kakao-tabs`, …) for light DOM ones, never `:root`.

*Alternative:* keep the `:host { --kakao-x: default }` declarations and set the properties on every preview instance. Rejected because it keeps ancestor theming broken and tokens could only be resolved at `:root`.

### 2. The settings block is the single source of truth

The block holds one declaration per line, always in the form `--_<alias>: var(--kakao-<component>-<name>, <default>);`. The default is either a literal or `var(--kakao-<token>, <literal>)`. The construction page reads the current defaults by fetching the component's source and parsing this block, so reading works on any static server. Only saving needs the construction server. The block contains no `</script`, so components stay inlineable.

*Alternative:* a separate `settings.json` next to the component. Rejected: it would be one more file to load or bundle, and it could drift from the source.

### 3. The settings manifest lives inside `construction.html`

Each construction page contains its preview markup and a `<script type="application/json" id="kakao-settings-manifest">` list. Each entry has `property`, `label`, `group`, `type` (color | length | number | percent | duration | easing | shadow | font | text) and optional `min`, `max`, `step` and `units`. The shared engine `shared/construction.js` with `shared/construction.css` builds the table, the canvas switcher, the token picker, change marks, reset, "Copy CSS" and Save from it.

The engine reports manifest entries that have no line in the settings block, and settings block lines that are missing from the manifest, as warnings on the page. This keeps the rule "every visual property appears in the table" checkable by just opening the page.

*Alternative:* derive the table purely from the block. Rejected because labels, grouping, types and ranges are not in the CSS.

### 4. Live preview by setting properties on the canvas

Changing a value sets the public property, for example `--kakao-switch-track-height`, on the preview canvas element. Through the alias pattern, every instance on the canvas updates at once. A token binding sets `var(--kakao-color-primary)`.

Values are checked with `CSS.supports` against a real property for their type (`color`, `width`, `opacity`, `transition-duration`, `transition-timing-function`, `box-shadow`, `font-family`). An invalid value is not applied.

### 5. Main variables in `shared/tokens.css`

The tokens file uses the same block markers, with `--kakao-<token>: <literal>;` lines on `:root`. Names include `--kakao-color-primary`, `--kakao-color-text`, `--kakao-color-muted`, `--kakao-color-bg`, `--kakao-color-border`, `--kakao-color-danger`, `--kakao-space-x`, `--kakao-space-y`, `--kakao-space-gap`, `--kakao-radius`, `--kakao-font-family`, `--kakao-font-size` and `--kakao-motion-duration`. The labels and types for the token picker come from the manifest in `tokens.html`, which `shared/construction.js` fetches from every construction page.

At first, defaults are bound to tokens only where a token clearly matches today's value. For example, several accents use `#4f46e5`, which becomes the initial primary colour. Unbound values stay literal, so nothing looks different.

### 6. `tools/construct-server.js`

A single Node script with no dependencies:

- run with `node tools/construct-server.js [--port 8765]`
- binds to `127.0.0.1` and serves the project statically with correct MIME types and no caching
- `GET /__construct/status` lets a page detect the server
- `POST /__construct/save` takes `{ target: "<component>" | "tokens", settings: [{ property, value, token? }] }`

The server, not the page, builds the block lines from that structured input. It:

- resolves `target` against the existing `components/*` folders
- picks the `.js` or `.css` file that contains exactly one settings block
- checks every property against the target's namespace
- rejects values with `;`, `{`, `}`, `<`, `\`, newlines or `*/`
- rejects requests whose `Origin` is not the server's own, so other websites cannot trigger writes
- writes atomically: a temporary file, then rename

Only the text between the markers changes. Unchanged settings keep their line order, and new properties go at the end.

*Alternatives:*
- Python, matching the existing screenshot helper: rejected because Node is a better fit for later JS tooling and both are installed.
- Download or copy only: rejected by the user in favour of one-click saving.

### 7. Rule enforcement

`openspec/config.yaml` context gets the rule that every new or changed component includes its construction page. The `construction-page` spec makes it a requirement, and the overview links every card to its construction page, so a missing page shows up as a broken link.

## Risks / Trade-offs

- **[Refactoring 11 components to aliases changes their CSS everywhere]** → Take Firefox screenshots of every demo page before the refactor and compare them pixel by pixel afterwards. Any difference blocks the task.
- **[Hard-coded values in tabs, number-input and button become properties, which could miss one]** → The engine's manifest/block warnings plus a grep for remaining literal colours and lengths in each component's CSS.
- **[A hand-edit inside the block in an unexpected format would be lost or refused on save]** → The server refuses to save when a line in the block does not match the expected form, and the page shows which line. The block comment says to edit it via the construction page.
- **[A save server writing to source files]** → Loopback only, an Origin check, a fixed target list, a property namespace check, value filtering, writes only between markers.
- **[Inherited properties can now leak into nested components, e.g. a switch inside a themed popover]** → This is intended for tokens. Component-specific properties are namespaced per component, so they only affect that component type.

## Migration Plan

1. Add the tokens file, engine, server and tokens page.
2. Per component: take a baseline screenshot, move to the alias block, add properties for hard-coded values, compare screenshots, write `construction.html`, and link it from the demo and overview.
3. Update the header docs of each component (theming on an ancestor now works) and the `component-conventions` main spec through this change's sync.

Rollback: everything is in source files, so restore them with your normal tools. There is no data migration.
