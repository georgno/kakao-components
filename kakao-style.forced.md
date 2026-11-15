# Forced placements

Placements that break a style rule on purpose and carry the `force` attribute.
One section per element, headed by its `id`, with the reason below it.
`node tools/style-check.js` reads this file (`forced.mandatory` is on for this
repo, so every forced placement needs a section, and a section without its
placement is an error).

## sticky
components/table/demo.html, the code tile of "Sticks to the page": the snippet
writes `list-data='…'` to stand for the long JSON the page fills in from
script. It is a shortened code sample, not a table that runs.

## framed
components/table/demo.html, the code tile of "Scrolling in a frame of its
own": the same shortened `list-data='…'` as in "sticky".
