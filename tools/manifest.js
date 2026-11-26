#!/usr/bin/env node
/**
 * manifest.js
 * ============================================================================
 * Writes custom-elements.json (the Custom Elements Manifest format, schema
 * 2.1.0) from the components' header doc comments and settings blocks. Node
 * only, no packages.
 *
 *   node tools/manifest.js           write custom-elements.json
 *   node tools/manifest.js --check   exit 1 when it is out of date
 *
 * What it reads, per components/<name>/<name>.js:
 *  - The header comment (the first block comment). Sections are a title
 *    between two lines of dashes:
 *      ATTRIBUTES…, PROPERTIES…, METHODS…, PUBLIC API, API, EVENTS…, SLOTS,
 *      FILES. A title naming a tag ("ATTRIBUTES · kakao-tab",
 *      "<kakao-setting> ATTRIBUTES") belongs to that tag. Other sections
 *      (USAGE, ACCESSIBILITY, …) are prose and are not read.
 *  - An entry is a line indented 1–4 spaces: the name(s), two or more
 *    spaces, the description; deeper lines continue it. Several names are
 *    joined with " · " ("name · value · form"). A method has parentheses.
 *    An optional type column follows the name (string, number, boolean, JSON).
 *  - Allowed attribute values: a list joined with " · " or " | " at the start
 *    of the description, "(default)" after one of them ("sm · md (default) · lg").
 *  - An event's detail: the { … } in its description.
 *  - Parts: a line "Parts: a, b." (or "Part: a.").
 *  - FILES: script, css (light-DOM CSS the page must load, or none), requires
 *    (components to load first, in this order), enhanced (components used
 *    when loaded).
 *  - CSS custom properties: the component's settings block (public name and
 *    default), not the prose.
 *
 * Each declaration carries the library's own fields under "kakao":
 *   { script, css: [], lightDom, requires: [tags], enhancedBy: [tags] }.
 * A header that doesn't follow the format is fixed in the header, never
 * special-cased here: unknown section titles in a tag's API are an error.
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { readComponents } = require('./export-tokens/sources');

const ROOT = path.join(__dirname, '..');
const OUT = 'custom-elements.json';

class ManifestError extends Error {}

/* ---- header ------------------------------------------------------------- */

/** The header comment's lines, without the leading " * ". */
function headerLines(src, file) {
  const start = src.indexOf('/*');
  const end = src.indexOf('*/', start);
  if (start < 0 || end < 0) throw new ManifestError(`${file}: no header comment`);
  return src
    .slice(start + 2, end)
    .split('\n')
    .map((l) => l.replace(/^\s*\*? ?/, ''));
}

const isRule = (l) => /^-{20,}$/.test(l.trim()) || /^={20,}$/.test(l.trim());

/** { intro: [lines], sections: [{ title, lines }] } */
function sectionsOf(lines) {
  const sections = [];
  const intro = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^-{20,}$/.test(l.trim()) && i + 2 < lines.length && /^-{20,}$/.test(lines[i + 2].trim())) {
      cur = { title: lines[i + 1].trim(), lines: [] };
      sections.push(cur);
      i += 2;
      continue;
    }
    if (cur) cur.lines.push(l);
    else intro.push(l);
  }
  return { intro, sections };
}

const KIND = [
  [/^ATTRIBUTES\b|\bATTRIBUTES\b/, 'attributes'],
  [/^EVENTS\b/, 'events'],
  [/^SLOTS\b/, 'slots'],
  [/^FILES$/, 'files'],
  [/^(PROPERTIES|METHODS|PUBLIC API|PUBLIC METHODS|API)\b/, 'members'],
];

function kindOf(title) {
  for (const [re, kind] of KIND) if (re.test(title)) return kind;
  return null;
}

/** Splits at a separator that is not inside (), {} or []. */
function splitTop(text, sepRe) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ('({['.includes(c)) depth++;
    if (')}]'.includes(c)) depth--;
    if (depth === 0) {
      const m = sepRe.exec(text.slice(i));
      if (m && m.index === 0) {
        out.push(cur);
        cur = '';
        i += m[0].length - 1;
        continue;
      }
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Entries of an API section: [{ names: [], type?, description }]. */
function entriesOf(lines) {
  const entries = [];
  let cur = null;
  let curIndent = 0;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) {
      cur = null;
      continue;
    }
    const indent = raw.match(/^ */)[0].length;
    const text = raw.trim();
    if (cur && indent > curIndent) {
      cur.description += ` ${text}`;
      continue;
    }
    // name(s)  [type]  description
    const m = indent <= 4 && /^(\S(?:.*?\S)?)(?:\s{2,}(.*))?$/.exec(text);
    const next = lines[i + 1] || '';
    const nextIndent = next.match(/^ */)[0].length;
    if (m && m[2] !== undefined && m[1].length <= 64 && !/[.;!?]$/.test(m[1])) {
      cur = { names: m[1], description: m[2] };
    } else if (m && /^"?[a-z][\w-]*"?$/.test(text) && next.trim() && nextIndent > indent) {
      cur = { names: text, description: '' };
    } else {
      cur = null; // prose
      continue;
    }
    curIndent = indent;
    const t = /^(string|number|boolean|JSON)\s{2,}(.*)$/.exec(cur.description);
    if (t) {
      cur.type = t[1];
      cur.description = t[2];
    }
    entries.push(cur);
  }
  return entries.map((e) => ({
    ...e,
    names: splitTop(e.names, /^\s*(·|\s\/\s)\s*/).map((n) => n.replace(/^"|"$/g, '')),
    description: e.description.trim(),
  }));
}

/** "sm · md (default) · lg: …" → { values, default } */
function enumOf(description) {
  const head = description.split(/: |\. |\.$|;/)[0];
  const parts = head.split(/\s+(?:·|\|)\s+/);
  if (parts.length < 2) return null;
  let def = null;
  const values = [];
  for (let p of parts) {
    p = p.trim();
    if (/\(default\)$/.test(p)) {
      p = p.replace(/\s*\(default\)$/, '');
      def = p.replace(/^"|"$/g, '');
    }
    p = p.replace(/^"|"$/g, '');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(p)) return null;
    values.push(p);
  }
  return { values, default: def };
}

function detailOf(description) {
  const i = description.indexOf('{');
  if (i < 0 || i > 12) return null;
  let depth = 0;
  for (let k = i; k < description.length; k++) {
    if (description[k] === '{') depth++;
    if (description[k] === '}' && --depth === 0) return description.slice(i, k + 1);
  }
  return null;
}

/* ---- files ---------------------------------------------------------------- */

function filesOf(section, file) {
  const out = {};
  for (const l of section.lines) {
    const m = /^\s*(script|css|requires|enhanced)\s{2,}(\S.*?)(\s{2,}\(.*\))?\s*$/.exec(l);
    if (m) out[m[1]] = m[2] === 'none' ? [] : m[2].split(/,\s*/);
  }
  for (const k of ['script', 'css', 'requires', 'enhanced']) {
    if (!out[k]) throw new ManifestError(`${file}: FILES has no "${k}" line`);
  }
  return out;
}

/* ---- tags ------------------------------------------------------------------ */

function tagsOf(src) {
  // Code only: a header may show customElements.define() in an example.
  src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const consts = new Map();
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*'(kakao-[a-z-]+)'/g)) consts.set(m[1], m[2]);
  const tags = [];
  for (const m of src.matchAll(/customElements\.define\(\s*([^,]+?)\s*,\s*(\w+)/g)) {
    const a = m[1].trim();
    const tag = /^['"]/.test(a) ? a.slice(1, -1) : consts.get(a);
    if (tag && !tags.some((t) => t.tag === tag)) tags.push({ tag, className: m[2] });
  }
  return tags;
}

/* ---- build ------------------------------------------------------------------ */

function build(root = ROOT) {
  const settings = new Map(readComponents(root).map((c) => [c.component, c]));
  const dirs = fs.readdirSync(path.join(root, 'components')).filter((n) =>
    fs.existsSync(path.join(root, 'components', n, `${n}.js`)),
  );
  dirs.sort();
  const modules = [];
  for (const name of dirs) {
    const rel = `components/${name}/${name}.js`;
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    const tags = tagsOf(src);
    if (!tags.length) throw new ManifestError(`${rel}: defines no kakao-* element`);
    const primary = tags.find((t) => t.tag === `kakao-${name}`) || tags[0];
    const { intro, sections } = sectionsOf(headerLines(src, rel));

    const description = intro
      .filter((l) => !isRule(l) && !/^<kakao-/.test(l.trim()) && !/^@/.test(l.trim()))
      .join('\n')
      .trim()
      .split(/\n\s*\n/)[0]
      .replace(/\s+/g, ' ')
      .trim();

    const filesSection = sections.find((s) => kindOf(s.title) === 'files');
    if (!filesSection) throw new ManifestError(`${rel}: header has no FILES section`);
    const files = filesOf(filesSection, rel);
    const parts = (/(?:^|\n)\s*Parts?:\s*([^\n]+?)\.?\s*(?:\n|$)/.exec(sections.map((s) => s.lines.join('\n')).join('\n') + '\n' + intro.join('\n')) || [])[1];

    const decls = new Map(
      tags.map((t) => [
        t.tag,
        { kind: 'class', customElement: true, name: t.className, tagName: t.tag, description: t === primary ? description : '', attributes: [], members: [], events: [], slots: [], cssProperties: [], cssParts: [] },
      ]),
    );
    for (const s of sections) {
      const kind = kindOf(s.title);
      if (!kind || kind === 'files') continue;
      const named = /\bkakao-[a-z-]+/.exec(s.title);
      const decl = decls.get(named ? named[0] : primary.tag);
      if (!decl) throw new ManifestError(`${rel}: section "${s.title}" names a tag this file doesn't define`);
      for (const e of entriesOf(s.lines)) {
        for (const n of e.names) {
          if (kind === 'attributes') {
            if (!/^[a-z][a-z0-9-]*\*?$/.test(n)) continue;
            const a = { name: n, description: e.description };
            const en = enumOf(e.description);
            if (en) {
              a.type = { text: en.values.map((v) => `'${v}'`).join(' | ') };
              if (en.default) a.default = `'${en.default}'`;
            } else if (e.type === 'boolean' || /^Boolean\b/.test(e.description)) a.type = { text: 'boolean' };
            else if (e.type) a.type = { text: e.type };
            decl.attributes.push(a);
          } else if (kind === 'events') {
            if (!/^[a-z][a-z0-9-]*$/.test(n)) continue;
            const ev = { name: n, description: e.description };
            const d = detailOf(e.description);
            if (d) ev.type = { text: `CustomEvent<${d}>` };
            decl.events.push(ev);
          } else if (kind === 'slots') {
            const slot = n.replace(/^slot="?|"$/g, '');
            decl.slots.push({ name: /default|^\(/.test(slot) ? '' : slot, description: e.description });
          } else if (kind === 'members') {
            const call = /^([a-zA-Z_]\w*)\s*\((.*)\)$/.exec(n);
            if (call) decl.members.push({ kind: 'method', name: call[1], description: e.description, ...(call[2] ? { parameters: splitTop(call[2], /^\s*,\s*/).map((p) => ({ name: p })) } : {}) });
            else if (/^[a-zA-Z_]\w*$/.test(n)) decl.members.push({ kind: 'field', name: n, description: e.description });
          }
        }
      }
    }
    const main = decls.get(primary.tag);
    const block = settings.get(name);
    if (block) {
      for (const s of block.settings) main.cssProperties.push({ name: s.property, default: s.value });
    }
    if (parts) main.cssParts.push(...parts.split(/,\s*/).map((p) => ({ name: p.trim() })).filter((p) => /^[a-z][\w-]*$/.test(p.name)));

    const toTag = (n) => `kakao-${n}`;
    const kakao = {
      script: `components/${name}/${files.script[0]}`,
      css: files.css.map((c) => `components/${name}/${c}`),
      lightDom: !/attachShadow\(/.test(src),
      requires: files.requires.map(toTag),
      enhancedBy: files.enhanced.map(toTag),
    };
    for (const d of decls.values()) {
      d.kakao = kakao;
      for (const k of ['attributes', 'members', 'events', 'slots', 'cssProperties', 'cssParts']) if (!d[k].length) delete d[k];
      if (!d.description) delete d.description;
    }
    modules.push({
      kind: 'javascript-module',
      path: rel,
      declarations: [...decls.values()],
      exports: tags.map((t) => ({ kind: 'custom-element-definition', name: t.tag, declaration: { name: t.className, module: rel } })),
    });
  }
  // Every requires / enhanced name must be a component.
  const known = new Set(modules.flatMap((m) => m.exports.map((e) => e.name)));
  for (const m of modules) {
    for (const d of m.declarations) {
      for (const t of [...d.kakao.requires, ...d.kakao.enhancedBy]) {
        if (!known.has(t)) throw new ManifestError(`${m.path}: FILES names unknown component ${t}`);
      }
    }
  }
  const version = (/<li><b>v(\d+\.\d+\.\d+)<\/b>/.exec(fs.readFileSync(path.join(root, 'index.html'), 'utf8')) || [])[1];
  return { schemaVersion: '2.1.0', readme: 'CATALOG.md', kakao: { version }, modules };
}

function main(argv, root = ROOT) {
  const file = path.join(root, OUT);
  let text;
  try {
    text = `${JSON.stringify(build(root), null, 2)}\n`;
  } catch (e) {
    if (e instanceof ManifestError) {
      process.stderr.write(`manifest: ${e.message}\n`);
      return 1;
    }
    throw e;
  }
  if (argv.includes('--check')) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === text) {
      process.stdout.write(`${OUT} is up to date.\n`);
      return 0;
    }
    process.stderr.write(`manifest: ${OUT} is out of date. Run node tools/manifest.js.\n`);
    return 1;
  }
  fs.writeFileSync(file, text);
  process.stdout.write(`Wrote ${OUT}.\n`);
  return 0;
}

if (require.main === module) {
  const r = process.argv.indexOf('--root');
  process.exitCode = main(process.argv.slice(2), r > 0 ? path.resolve(process.argv[r + 1]) : ROOT);
}

module.exports = { build, main, entriesOf, enumOf, sectionsOf };
