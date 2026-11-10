## Decisions

- **A list styled as a table, not a `<table>` or `<dl>`.** A screen reader hears "list, 3 items" and each item as one line, "Email: That address is taken" (a visually hidden colon or space sits between the cells), which is how GOV.UK's tested pattern reads. A `<table>` would bring column headers that only repeat the title, cell-by-cell navigation nobody needs for a few lines, and loses its role in some browsers once its cells restack for narrow screens. `<dl>` support is uneven (some readers drop the term/definition pairing) and links inside `<dt>` read oddly. No header row: "Field / Issue" would repeat the heading.
- **Subgrid columns.** The `<ul>` is a grid with `fit-content(var(--_field-max)) minmax(0, 1fr)`; each `<li>` spans both and takes `subgrid`, so field names line up across rows and long ones wrap within 40% of the width. A container query on a wrapper (the list can't query itself) restacks under 22rem.
- **Colour.** `color-mix(in srgb, var(--kakao-color-danger) 72%, var(--kakao-color-text))`, the same mix the alert uses for its icon, so title, icon and list share one tone. Measured on the danger alert's tint (16% in light and beige, 10% elsewhere): light 5.71, beige 6.03, umber 5.30, dark 7.18, amoled 9.21, catppuccin 6.71, forest 8.37.
- **Alias name `--_color`, not `--_text`.** Title and list sit in kakao-alert's light DOM and inherit from its host, which defines its own `--_text`; a summary alias of the same name would be shadowed.

## Risks / Trade-offs

- [`--kakao-error-summary-focus` is shadowed the same way by the alert's `--_focus` for the links] → both default to the focus colour, so only a custom value is lost; left as it was.
