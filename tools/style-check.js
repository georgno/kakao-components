#!/usr/bin/env node
/**
 * style-check.js
 * ============================================================================
 * Checks every <kakao-*> placement in HTML and template files against the
 * styleguide's decided rules, like a static analyser. Node only, no packages.
 *
 *   node tools/style-check.js [paths…] [--config file] [--format text|json]
 *
 *   paths       files or folders; folders are searched for the configured
 *               extensions. Default: the config's "paths" (["."]).
 *   --config    the config file. Default: kakao-style.config.json in the
 *               working directory, if there is one.
 *   --format    text (default) or json.
 *
 * Exit codes: 0 no error, 1 at least one error, 2 cannot run (bad config,
 * unknown rule or level, missing path, broken rule module).
 *
 * Rules: one CommonJS module per rule in tools/style-rules/ (and in the
 * config's "ruleDirs"):
 *   module.exports = { id, level: 'error' | 'warning', description,
 *     tags: ['kakao-dialog'] (or 'kakao-*'), check(el, ctx) -> [{ message,
 *     el?, line?, column?, level? }] };
 * ctx holds the shared helpers of tools/style-check/helpers.js, plus file
 * (path), source (text), doc (the parsed file: elements in document order)
 * and manifest (custom-elements.json, or null). A finding's level 'warning'
 * lowers an error rule's level for that finding (e.g. in template files).
 *
 * The manifest is the config's "manifest" file, else custom-elements.json
 * next to the config, else the one shipped with this tool.
 *
 * Forced placements: an element with the boolean attribute `force` produces
 * no errors or warnings; its findings are listed as "forced". A forced element
 * that breaks no rule gets a warning (force-unused). The forced documentation
 * file (default kakao-style.forced.md, "## <id>" sections with a reason) adds
 * reasons to the report; with forced.mandatory it must cover every forced
 * placement (forced-undocumented) and nothing else (forced-stale).
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('./style-check/markup');
const helpers = require('./style-check/helpers');

const BUILTIN_RULES = path.join(__dirname, 'style-rules');
const CONFIG_NAME = 'kakao-style.config.json';
const LEVELS = ['error', 'warning'];

/* Findings the checker itself produces; their level can be set like a rule's. */
const CORE_RULES = {
  'markup-unreadable': { level: 'warning', description: 'Markup the reader cannot make sense of.' },
  'force-unused': { level: 'warning', description: 'A forced placement that breaks no rule.' },
  'forced-undocumented': { level: 'error', description: 'A forced placement without documentation (forced.mandatory).' },
  'forced-stale': { level: 'error', description: 'A documentation entry without its forced placement (forced.mandatory).' },
};

const DEFAULTS = {
  paths: ['.'],
  ignore: ['archive', 'openspec', 'node_modules', 'shared/vendor'],
  extensions: ['.html', '.htm', '.php', '.phtml', '.twig'],
  rules: {},
  ruleDirs: [],
  forced: { file: 'kakao-style.forced.md', mandatory: false },
  manifest: null,
};
const OWN_MANIFEST = path.join(__dirname, '..', 'custom-elements.json');

class SetupError extends Error {}

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const toSlash = (p) => p.split(path.sep).join('/');

/* ---- arguments and config -------------------------------------------------- */

function parseArgs(argv) {
  const args = { paths: [], config: null, format: 'text' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const take = (name) => {
      if (a.includes('=')) return a.slice(a.indexOf('=') + 1);
      if (i + 1 >= argv.length) throw new SetupError(`${name} needs a value.`);
      return argv[++i];
    };
    if (a === '--config' || a.startsWith('--config=')) args.config = take('--config');
    else if (a === '--format' || a.startsWith('--format=')) args.format = take('--format');
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--')) throw new SetupError(`Unknown option ${a}.`);
    else args.paths.push(a);
  }
  if (!['text', 'json'].includes(args.format)) throw new SetupError(`--format must be text or json, not "${args.format}".`);
  return args;
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((s) => typeof s === 'string');
}

function loadConfig(cwd, file) {
  let configPath = file ? path.resolve(cwd, file) : path.join(cwd, CONFIG_NAME);
  let raw = {};
  if (fs.existsSync(configPath)) {
    let text;
    try {
      text = fs.readFileSync(configPath, 'utf8');
    } catch (err) {
      throw new SetupError(`Cannot read ${configPath}: ${err.message}`);
    }
    try {
      raw = JSON.parse(text);
    } catch (err) {
      throw new SetupError(`${toSlash(path.relative(cwd, configPath)) || configPath} is not valid JSON: ${err.message}`);
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new SetupError('The config must be a JSON object.');
  } else if (file) {
    throw new SetupError(`Config file ${file} does not exist.`);
  } else {
    configPath = null;
  }
  const name = configPath ? toSlash(path.relative(cwd, configPath)) : 'config';
  for (const key of Object.keys(raw)) {
    if (!(key in DEFAULTS)) throw new SetupError(`${name}: unknown key "${key}".`);
  }
  for (const key of ['paths', 'ignore', 'extensions', 'ruleDirs']) {
    if (key in raw && !isStringArray(raw[key])) throw new SetupError(`${name}: "${key}" must be an array of strings.`);
  }
  if ('rules' in raw && (!raw.rules || typeof raw.rules !== 'object' || Array.isArray(raw.rules))) {
    throw new SetupError(`${name}: "rules" must be an object of rule id -> level.`);
  }
  const forced = { ...DEFAULTS.forced };
  if ('forced' in raw) {
    const f = raw.forced;
    if (!f || typeof f !== 'object' || Array.isArray(f)) throw new SetupError(`${name}: "forced" must be an object.`);
    for (const key of Object.keys(f)) {
      if (!(key in forced)) throw new SetupError(`${name}: unknown key "forced.${key}".`);
    }
    if ('file' in f && typeof f.file !== 'string') throw new SetupError(`${name}: "forced.file" must be a string.`);
    if ('mandatory' in f && typeof f.mandatory !== 'boolean') throw new SetupError(`${name}: "forced.mandatory" must be true or false.`);
    Object.assign(forced, f);
  }
  if ('manifest' in raw && raw.manifest !== null && typeof raw.manifest !== 'string') {
    throw new SetupError(`${name}: "manifest" must be a path.`);
  }
  const base = configPath ? path.dirname(configPath) : cwd;
  return {
    manifest: raw.manifest ? path.resolve(base, raw.manifest) : null,
    base,
    paths: raw.paths || DEFAULTS.paths,
    ignore: raw.ignore || DEFAULTS.ignore,
    extensions: (raw.extensions || DEFAULTS.extensions).map((e) => e.toLowerCase()),
    rules: raw.rules || {},
    ruleDirs: raw.ruleDirs || DEFAULTS.ruleDirs,
    forced,
  };
}

/* ---- manifest -------------------------------------------------------------- */

function loadManifest(config, cwd) {
  let file = config.manifest;
  if (file && !fs.existsSync(file)) throw new SetupError(`Manifest ${toSlash(path.relative(cwd, file))} does not exist.`);
  if (!file) file = [path.join(config.base, 'custom-elements.json'), OWN_MANIFEST].find((f) => fs.existsSync(f));
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new SetupError(`Manifest ${toSlash(path.relative(cwd, file))} cannot be read: ${err.message}`);
  }
}

/* ---- rules ----------------------------------------------------------------- */

function loadRuleDir(dir, label) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new SetupError(`Rule folder ${label} does not exist.`);
  }
  const rules = [];
  for (const name of fs.readdirSync(dir).sort(byString)) {
    if (!/\.c?js$/.test(name)) continue;
    const file = path.join(dir, name);
    let rule;
    try {
      rule = require(file);
    } catch (err) {
      throw new SetupError(`Rule ${label}/${name} cannot be loaded: ${err.message}`);
    }
    const where = `Rule ${label}/${name}`;
    if (!rule || typeof rule !== 'object') throw new SetupError(`${where} exports no rule object.`);
    if (typeof rule.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rule.id)) throw new SetupError(`${where}: id must be a lower-case id like "my-rule".`);
    if (!LEVELS.includes(rule.level)) throw new SetupError(`${where}: level must be "error" or "warning".`);
    if (typeof rule.description !== 'string' || !rule.description) throw new SetupError(`${where}: description is missing.`);
    if (!isStringArray(rule.tags) || !rule.tags.length) throw new SetupError(`${where}: tags must be a non-empty array of tag names.`);
    if (typeof rule.check !== 'function') throw new SetupError(`${where}: check must be a function.`);
    rules.push({ ...rule, source: `${label}/${name}` });
  }
  return rules;
}

function loadRules(config, cwd) {
  const rules = loadRuleDir(BUILTIN_RULES, 'tools/style-rules');
  for (const dir of config.ruleDirs) {
    const abs = path.resolve(config.base, dir);
    rules.push(...loadRuleDir(abs, toSlash(path.relative(cwd, abs)) || '.'));
  }
  const seen = new Map(Object.keys(CORE_RULES).map((id) => [id, 'the checker']));
  for (const r of rules) {
    if (seen.has(r.id)) throw new SetupError(`Two rules have the id "${r.id}" (${seen.get(r.id)} and ${r.source}).`);
    seen.set(r.id, r.source);
  }
  const levels = {};
  for (const r of rules) levels[r.id] = r.level;
  for (const [id, r] of Object.entries(CORE_RULES)) levels[id] = r.level;
  for (const [id, level] of Object.entries(config.rules)) {
    if (!(id in levels)) throw new SetupError(`The config names an unknown rule "${id}".`);
    if (!['error', 'warning', 'off'].includes(level)) throw new SetupError(`Rule "${id}": level must be error, warning or off, not ${JSON.stringify(level)}.`);
    levels[id] = level;
  }
  return { rules: rules.filter((r) => levels[r.id] !== 'off'), levels };
}

/* ---- files ----------------------------------------------------------------- */

function makeIgnore(config) {
  const entries = config.ignore.map((e) => e.replace(/\\/g, '/').replace(/\/+$/, ''));
  const names = entries.filter((e) => !e.includes('/'));
  const paths = entries.filter((e) => e.includes('/')).map((e) => path.resolve(config.base, e));
  return (abs) => {
    const rel = toSlash(path.relative(config.base, abs));
    if (!rel.startsWith('..') && rel.split('/').some((seg) => names.includes(seg))) return true;
    return paths.some((p) => abs === p || abs.startsWith(p + path.sep));
  };
}

function findFiles(targets, config, cwd, fromConfig) {
  const ignored = makeIgnore(config);
  const files = new Set();
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort(byString)) {
      if (name.startsWith('.')) continue;
      const abs = path.join(dir, name);
      if (ignored(abs)) continue;
      const st = fs.lstatSync(abs);
      if (st.isDirectory()) walk(abs);
      else if (st.isFile() && config.extensions.includes(path.extname(name).toLowerCase())) files.add(abs);
    }
  };
  for (const t of targets) {
    const abs = path.resolve(fromConfig ? config.base : cwd, t);
    if (!fs.existsSync(abs)) throw new SetupError(`Path ${t} does not exist.`);
    if (fs.statSync(abs).isDirectory()) walk(abs);
    else files.add(abs);
  }
  return [...files].map((abs) => ({ abs, rel: toSlash(path.relative(cwd, abs)) || path.basename(abs) }))
    .sort((a, b) => byString(a.rel, b.rel));
}

/* ---- forced documentation -------------------------------------------------- */

function readForcedDoc(file) {
  const sections = new Map();
  if (!fs.existsSync(file)) return { exists: false, sections };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let cur = null;
  lines.forEach((text, i) => {
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(text);
    if (m && !text.startsWith('###')) {
      cur = { id: m[1].replace(/^`(.*)`$/, '$1'), line: i + 1, reason: [] };
      if (!sections.has(cur.id)) sections.set(cur.id, cur);
      return;
    }
    if (/^#\s/.test(text)) { cur = null; return; }
    if (cur) cur.reason.push(text);
  });
  for (const s of sections.values()) s.reason = s.reason.join(' ').replace(/\s+/g, ' ').trim();
  return { exists: true, sections };
}

/* ---- running --------------------------------------------------------------- */

function check({ argv = [], cwd = process.cwd() } = {}) {
  const args = parseArgs(argv);
  if (args.help) return { help: true, args };
  const config = loadConfig(cwd, args.config);
  const { rules, levels } = loadRules(config, cwd);
  const manifest = loadManifest(config, cwd);
  const fromConfig = args.paths.length === 0;
  const files = findFiles(fromConfig ? config.paths : args.paths, config, cwd, fromConfig);

  const byTag = (tag) => rules.filter((r) => r.tags.some((t) => t === tag || (t.endsWith('*') && tag.startsWith(t.slice(0, -1)))));
  const ruleCache = new Map();
  const ctxBase = { ...helpers, manifest };
  const findings = [];
  const forcedEls = [];
  const add = (f) => { if (f.level !== 'off') findings.push(f); };

  for (const file of files) {
    const source = fs.readFileSync(file.abs, 'utf8');
    const doc = parse(source);
    for (const p of doc.problems) {
      add({ path: file.rel, line: p.line, column: p.column, level: levels['markup-unreadable'], rule: 'markup-unreadable', message: p.message });
    }
    const ctx = { ...ctxBase, file: file.rel, source, doc };
    for (const el of doc.elements) {
      if (!el.tag.startsWith('kakao-')) continue;
      if (!ruleCache.has(el.tag)) ruleCache.set(el.tag, byTag(el.tag));
      const forced = el.attrs.has('force');
      let hits = 0;
      for (const rule of ruleCache.get(el.tag)) {
        let out;
        try {
          out = rule.check(el, ctx) || [];
        } catch (err) {
          throw new SetupError(`Rule ${rule.id} failed on ${file.rel}:${el.line}:${el.column}: ${err.message}`);
        }
        if (!Array.isArray(out)) throw new SetupError(`Rule ${rule.id} must return an array of findings.`);
        for (const f of out) {
          const at = f.el || el;
          hits++;
          add({
            path: file.rel,
            line: f.line || at.line,
            column: f.column || at.column,
            level: forced ? 'forced' : f.level === 'warning' ? 'warning' : levels[rule.id],
            rule: rule.id,
            message: String(f.message || rule.description),
            element: el,
          });
        }
      }
      if (forced) {
        forcedEls.push({ el, file });
        if (!hits) {
          add({ path: file.rel, line: el.line, column: el.column, level: levels['force-unused'], rule: 'force-unused', message: `force has no effect here: <${el.tag}> breaks no rule. Remove the force attribute.` });
        }
      }
    }
  }

  /* Forced documentation. */
  const docPath = path.resolve(config.base, config.forced.file);
  const docRel = toSlash(path.relative(cwd, docPath));
  const forcedDoc = readForcedDoc(docPath);
  const idOf = (el) => {
    const a = el.attrs.get('id');
    return a && !a.dynamic && a.value.trim() ? a.value.trim() : null;
  };
  for (const f of findings) {
    if (f.level !== 'forced') continue;
    const id = idOf(f.element);
    const s = id && forcedDoc.sections.get(id);
    if (s && s.reason) f.reason = s.reason;
  }
  if (config.forced.mandatory) {
    const forcedIds = new Set();
    for (const { el, file } of forcedEls) {
      const id = idOf(el);
      if (id) forcedIds.add(id);
      let message = null;
      if (!id) message = `This forced <${el.tag}> needs an id, so its reason can be documented in ${docRel}.`;
      else if (!forcedDoc.sections.has(id) || !forcedDoc.sections.get(id).reason) message = `Document the forced placement "${id}" in ${docRel}: a "## ${id}" section with the reason.`;
      if (message) add({ path: file.rel, line: el.line, column: el.column, level: levels['forced-undocumented'], rule: 'forced-undocumented', message });
    }
    /* Stale entries only show on a whole-project run (the config's paths). */
    if (fromConfig) {
      for (const s of forcedDoc.sections.values()) {
        if (forcedIds.has(s.id)) continue;
        add({ path: docRel, line: s.line, column: 1, level: levels['forced-stale'], rule: 'forced-stale', message: `No forced placement has the id "${s.id}" any more: remove its section.` });
      }
    }
  }

  findings.sort((a, b) => byString(a.path, b.path) || a.line - b.line || a.column - b.column || byString(a.rule, b.rule) || byString(a.message, b.message));
  for (const f of findings) delete f.element;
  const count = (level) => findings.filter((f) => f.level === level).length;
  return {
    files: files.length,
    errors: count('error'),
    warnings: count('warning'),
    forced: count('forced'),
    findings,
    format: args.format,
  };
}

/* ---- report ---------------------------------------------------------------- */

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function formatText(result) {
  const lines = [];
  const main = result.findings.filter((f) => f.level !== 'forced');
  const forced = result.findings.filter((f) => f.level === 'forced');
  const group = (list, withReason) => {
    let last = null;
    for (const f of list) {
      if (f.path !== last) {
        if (last !== null) lines.push('');
        last = f.path;
      }
      lines.push(`${f.path}:${f.line}:${f.column}  ${f.level.padEnd(7)}  ${f.rule}  ${f.message}`);
      if (withReason && f.reason) lines.push(`    reason: ${f.reason}`);
    }
  };
  group(main, false);
  if (forced.length) {
    if (lines.length) lines.push('');
    lines.push(`Forced (${forced.length})`);
    group(forced, true);
  }
  if (lines.length) lines.push('');
  lines.push(`${plural(result.errors, 'error')}, ${plural(result.warnings, 'warning')}, ${result.forced} forced in ${plural(result.files, 'file')}.`);
  return lines.join('\n') + '\n';
}

function formatJson(result) {
  const { errors, warnings, forced, files, findings } = result;
  return JSON.stringify({ errors, warnings, forced, files, findings }, null, 2) + '\n';
}

function main() {
  let result;
  try {
    result = check({ argv: process.argv.slice(2), cwd: process.cwd() });
  } catch (err) {
    if (err instanceof SetupError) {
      process.stderr.write(`style-check: ${err.message}\n`);
      process.exitCode = 2;
      return;
    }
    throw err;
  }
  if (result.help) {
    const head = fs.readFileSync(__filename, 'utf8').split('\n').slice(4, 18).map((l) => l.replace(/^ \* ?/, ''));
    process.stdout.write(head.join('\n') + '\n');
    return;
  }
  process.stdout.write(result.format === 'json' ? formatJson(result) : formatText(result));
  process.exitCode = result.errors > 0 ? 1 : 0;
}

if (require.main === module) main();

module.exports = { check, formatText, formatJson, parseArgs, loadConfig, readForcedDoc, SetupError, DEFAULTS };
