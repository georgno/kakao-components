## Decisions

- **One flex line, warning last.** `.messages` is a flex row aligned to the start; hint and error take `flex: 1 1 0` (only one shows at a time), the warning `flex: none; white-space: nowrap; margin-inline-start: auto`, so it stays at the end with or without a hint. DOM order matches the visual order; the warning stays `aria-hidden` (it is announced once through the live region).
- **No reserved space.** Toggling Caps Lock never moves the hint's start or the content below by a line; a long hint may rewrap into the narrower width while the warning shows. Reserving the warning's width permanently would squeeze every hint for a state that is rarely on.
- The warning's icon gets a small negative block margin so the warning's line is no taller than the hint's.
- **Narrow fields:** hint and error have a 9rem flex basis and the line wraps, so when less than that is left beside the warning, the warning moves below the hint (still at the end) instead of squeezing it.
