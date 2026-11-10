#!/usr/bin/env node
/**
 * count-components.js
 * ============================================================================
 * Keeps the component count on index.html in step with the components folder.
 * A component is a folder components/<name>/ that holds <name>.js.
 * Node only, no packages.
 *
 *   node tools/count-components.js          rewrite index.html if it is off
 *   node tools/count-components.js --check  only report; exits 1 when off
 *   --staged   count what git has staged (the pre-commit hook uses this), so
 *              component folders still being built and not staged don't count
 *
 * It rewrites two places on index.html:
 *   - the hero fact      <li><b>24</b> components</li>
 *   - the lede's number  <p class="lede">Twenty-four web components ...
 * Runs from the pre-commit hook in .githooks/ (git config core.hooksPath .githooks).
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMPONENTS = path.join(ROOT, 'components');
const INDEX = path.join(ROOT, 'index.html');

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/* 0-999 in words, hyphenated the British way: "thirty-four", "one hundred and five". */
function words(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  const rest = n % 100;
  return ONES[Math.floor(n / 100)] + ' hundred' + (rest ? ' and ' + words(rest) : '');
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function countComponents(staged) {
  if (staged) {
    // Paths in the git index: components/<name>/<name>.js
    const files = execFileSync('git', ['ls-files', '--cached', '--', 'components'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    return files.filter((f) => {
      const m = /^components\/([^/]+)\/([^/]+)\.js$/.exec(f);
      return m && m[1] === m[2];
    }).length;
  }
  return fs.readdirSync(COMPONENTS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(COMPONENTS, d.name, d.name + '.js')))
    .length;
}

const FACT_RE = /(<li><b>)\d+(<\/b> components<\/li>)/;
// The lede opens with the number in words: letters, spaces, hyphens and "and".
const LEDE_RE = /(<p class="lede">)[A-Za-z][A-Za-z -]*?( web components\b)/;

function main() {
  const check = process.argv.includes('--check');
  const n = countComponents(process.argv.includes('--staged'));
  const html = fs.readFileSync(INDEX, 'utf8');

  if (!FACT_RE.test(html) || !LEDE_RE.test(html)) {
    console.error('count-components: index.html no longer has the "<b>N</b> components" fact ' +
      'or a lede starting "<Number> web components"; update the patterns in tools/count-components.js.');
    process.exit(1);
  }

  const next = html
    .replace(FACT_RE, `$1${n}$2`)
    .replace(LEDE_RE, `$1${capitalise(words(n))}$2`);

  if (next === html) {
    console.log(`count-components: index.html already says ${n}.`);
    return;
  }
  if (check) {
    console.error(`count-components: index.html is out of date; there are ${n} components. ` +
      'Run node tools/count-components.js');
    process.exit(1);
  }
  fs.writeFileSync(INDEX, next);
  console.log(`count-components: index.html now says ${n} (${words(n)}).`);
}

main();
