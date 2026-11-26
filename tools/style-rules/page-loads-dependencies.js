/**
 * A page loads what its components need: for each kakao tag it uses, the
 * component's script, its light-DOM CSS and the components it requires, with
 * every required script before the script that needs it (toast needs
 * stack.js and alert.js first). The data is custom-elements.json's `kakao`
 * field (script, css, requires); optional `enhancedBy` components are not
 * checked.
 *
 * Reported once per missing file, at the first placement of the tag that
 * needs it. A page that loads the loader (shared/kakao.js) is skipped: the
 * loader loads all of this itself. A file without a <head> (a partial or
 * fragment) is skipped; in a
 * template file (.php, .phtml, .twig) or a head with template code, which may
 * load files in code, the findings are warnings. Tags the manifest doesn't
 * know are skipped.
 */
'use strict';

const { loads, needs, matches, namer } = require('../style-check/page');

module.exports = {
  id: 'page-loads-dependencies',
  level: 'error',
  description: 'A page loads the script, light-DOM CSS and required components of every kakao tag it uses, in order.',
  tags: ['kakao-*'],
  check(el, ctx) {
    if (!ctx.manifest || !ctx.doc) return [];
    const page = loads(ctx.doc, ctx.file, ctx.source);
    if (!page.hasHead || page.loader) return [];
    const state = page.state;
    state.tags = state.tags || new Set();
    state.reported = state.reported || new Set();
    if (state.tags.has(el.tag)) return [];
    state.tags.add(el.tag);
    const chain = needs(ctx.manifest, el.tag);
    if (!chain) return [];

    const indexOf = (file) => page.scripts.findIndex((s) => matches(s.src, file, ctx.file));
    const name = namer(ctx.manifest, ctx.file, page, chain.map((c) => c.script).reverse());
    const level = page.templated ? 'warning' : undefined;
    const out = [];
    const report = (key, message) => {
      if (state.reported.has(key)) return;
      state.reported.add(key);
      out.push(level ? { message, level } : { message });
    };

    const own = chain[chain.length - 1];
    for (const c of chain) {
      const via = c.tag === el.tag ? '' : ` (for ${c.tag})`;
      const at = indexOf(c.script);
      if (at < 0) {
        const before = c === own ? '' : `, before ${name(own.script)}`;
        report(`script:${c.script}`, `<${el.tag}> needs ${name(c.script)}${via}, but the page does not load it. Add <script src="${name(c.script)}" defer>${before}.`);
      } else {
        for (const r of c.requires) {
          const dep = chain.find((d) => d.tag === r);
          const di = dep ? indexOf(dep.script) : -1;
          if (di > at) {
            report(`order:${dep.script}>${c.script}`, `<${el.tag}>: ${name(dep.script)} must load before ${name(c.script)} (${c.tag} requires ${r}), but the page loads it after (line ${page.scripts[di].line}).`);
          }
        }
      }
      for (const css of c.css) {
        if (page.styles.some((s) => matches(s.href, css, ctx.file))) continue;
        report(`css:${css}`, `<${el.tag}> needs the light-DOM CSS ${name(css)}${via}, but the page does not load it. Add <link rel="stylesheet" href="${name(css)}">.`);
      }
    }
    return out;
  },
};
