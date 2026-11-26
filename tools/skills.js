#!/usr/bin/env node
/**
 * skills.js
 * ============================================================================
 * Keeps the installed copies of the consumer skills in step with their one
 * source. Node only, no packages.
 *
 *   node tools/skills.js           copy skills/<name>/ to every install folder
 *   node tools/skills.js --check   exit 1, naming each missing, differing or
 *                                  extra file, when a copy is out of date
 *
 * Source: skills/<name>/ (the folder other repos copy in, and the one to edit).
 * Copies: .claude/skills/<name>/ (Claude Code) and .pi/skills/<name>/ (pi),
 * byte for byte. Copies rather than symlinks: symlinks break in checkouts
 * without core.symlinks (Windows), and tools load the folder like any other.
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = 'skills';
const INSTALLS = ['.claude/skills', '.pi/skills'];

/** Relative paths of the files under dir, sorted; [] when dir is missing. */
function files(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}

/** Problems as repo-relative paths with a reason: [{ file, reason }]. */
function compare(root) {
  const problems = [];
  const src = path.join(root, SOURCE);
  const skills = fs.existsSync(src) ? fs.readdirSync(src).filter((n) => fs.statSync(path.join(src, n)).isDirectory()) : [];
  for (const name of skills) {
    const want = files(path.join(src, name));
    for (const install of INSTALLS) {
      const dir = path.join(root, install, name);
      const have = files(dir);
      for (const f of want) {
        const rel = `${install}/${name}/${f}`;
        if (!have.includes(f)) problems.push({ file: rel, reason: 'missing' });
        else if (!fs.readFileSync(path.join(dir, f)).equals(fs.readFileSync(path.join(src, name, f)))) problems.push({ file: rel, reason: 'differs' });
      }
      for (const f of have) if (!want.includes(f)) problems.push({ file: `${install}/${name}/${f}`, reason: 'not in the source' });
    }
  }
  return { skills, problems };
}

function main(argv, root = ROOT, log = process.stdout, err = process.stderr) {
  if (argv.includes('--check')) {
    const { skills, problems } = compare(root);
    if (!problems.length) {
      log.write(`Skill copies up to date (${skills.join(', ') || 'none'}).\n`);
      return 0;
    }
    for (const p of problems) err.write(`skills: ${p.file} ${p.reason}\n`);
    err.write(`skills: edit ${SOURCE}/<name>/, then run node tools/skills.js.\n`);
    return 1;
  }
  const { skills } = compare(root);
  for (const name of skills) {
    for (const install of INSTALLS) {
      const dir = path.join(root, install, name);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(dir), { recursive: true });
      fs.cpSync(path.join(root, SOURCE, name), dir, { recursive: true });
    }
  }
  log.write(`Copied ${skills.join(', ') || 'no skills'} to ${INSTALLS.join(' and ')}.\n`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { compare, main, SOURCE, INSTALLS };
