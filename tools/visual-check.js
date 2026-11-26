#!/usr/bin/env node
/**
 * visual-check.js
 * ============================================================================
 * Screenshots and browser checks of a page, for agents (and people) to look at
 * before they call a page done. Needs Playwright with Chromium, which is NOT a
 * dependency of this repo: it is required lazily, like the browser test in
 * tools/tests/code-block.test.js, and the tool says how to get it when it is
 * missing. Everything else is Node only.
 *
 *   node tools/visual-check.js <page.html | http(s)://url>… [options]
 *
 *   --out <dir>    where the screenshots go
 *                  (default: <os temp dir>/kakao-visual-check, never the repo)
 *   --root <dir>   folder a local file is served from (default: the current
 *                  folder; the page's links to ../shared/… must stay inside it)
 *   --wait <ms>    extra wait after the page is ready (default 300)
 *   --tabs <n>     at most this many Tab stops in the focus check (default 60)
 *
 * Local files are served over http from --root by a small built-in server
 * (like the live site, not file://). A URL (a PHP or Python dev server) is
 * opened as it is.
 *
 * Per page, in Chromium:
 *  - Screenshots, full page: desktop (1280 px) and phone (390 px), each in the
 *    light and the dark colour scheme (prefers-color-scheme; no saved theme).
 *  - Errors: console errors, uncaught exceptions, failed requests and
 *    responses >= 400, in any of the four.
 *  - Sideways scroll: the page is wider than the viewport, naming the
 *    elements where the overflow starts.
 *  - Accessibility tree (Chromium's, through the shadow roots): visible
 *    controls and images without an accessible name; <html lang>, <title>
 *    and the viewport meta tag.
 *  - Keyboard: Tab through the page (reduced motion on); each stop must look
 *    different focused and blurred (a visible focus indicator), and Tab must
 *    move on.
 *  - Reduced motion: animations still running with prefers-reduced-motion:
 *    reduce once the page has settled. Those of busy indicators (spinner,
 *    progress, skeleton) are listed as notes, not findings: a calm pulse is
 *    their reduced-motion form.
 *
 * The screenshots are the main output: open them and look (light, dark,
 * phone). The checks catch what a look misses; they do not replace it.
 * Exit codes: 0 no findings, 1 findings, 2 usage error or no Playwright.
 * ============================================================================
 */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const VARIANTS = [
  { name: 'desktop-light', viewport: { width: 1280, height: 800 }, colorScheme: 'light' },
  { name: 'desktop-dark', viewport: { width: 1280, height: 800 }, colorScheme: 'dark' },
  { name: 'phone-light', viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true },
  { name: 'phone-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true },
];

// Roles that are operated or announced as a widget, so they need a name.
const NAMED_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'searchbox', 'combobox',
  'listbox', 'slider', 'spinbutton', 'tab', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'treeitem', 'progressbar', 'meter', 'dialog', 'alertdialog',
  'image', 'img',
]);

const MIME = {
  '.html': 'text/html', '.htm': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.txt': 'text/plain',
};

const USAGE = 'usage: node tools/visual-check.js <page.html | url>… [--out dir] [--root dir] [--wait ms] [--tabs n]';

class UsageError extends Error {}

function parseArgs(argv, cwd = process.cwd()) {
  const opts = { pages: [], out: path.join(os.tmpdir(), 'kakao-visual-check'), root: cwd, wait: 300, tabs: 60 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--out') opts.out = path.resolve(cwd, value());
    else if (a === '--root') opts.root = path.resolve(cwd, value());
    else if (a === '--wait') opts.wait = Number(value());
    else if (a === '--tabs') opts.tabs = Number(value());
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a.startsWith('--')) throw new UsageError(`unknown option ${a}`);
    else opts.pages.push(a);
  }
  if (!opts.help && !opts.pages.length) throw new UsageError('name at least one page (a file or an http(s) URL)');
  if (!(opts.wait >= 0) || !(opts.tabs >= 0)) throw new UsageError('--wait and --tabs take a number');
  return opts;
}

/** Playwright from the current project, this checkout or NODE_PATH; null when missing. */
function loadPlaywright() {
  for (const from of [process.cwd(), __dirname]) {
    try {
      return require(require.resolve('playwright', { paths: [from] }));
    } catch { /* next */ }
  }
  try {
    return require('playwright');
  } catch {
    return null;
  }
}

const NO_PLAYWRIGHT = `visual-check: Playwright is not installed (optional; not a dependency of this repo).
Install it once, in any folder outside the library:
  npm i playwright && npx playwright install chromium
then run from that project, or point Node at it:
  NODE_PATH=<that folder>/node_modules node tools/visual-check.js <page>`;

/** A static server for root; resolves to { url(file), close() }. */
function serve(root) {
  const server = http.createServer((req, res) => {
    let file;
    try {
      file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (path.relative(root, file).startsWith('..')) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      resolve({
        url: (file) => base + '/' + path.relative(root, file).split(path.sep).map(encodeURIComponent).join('/'),
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

/** Folder name for a page's screenshots. */
function slug(page) {
  return page.replace(/^https?:\/\//, '').replace(/\.html?$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page';
}

// ---- in the page -------------------------------------------------------------

/**
 * Source of a function run in the page: a short description of an element,
 * e.g. `kakao-select[label="Status"] >> button.trigger "Open"`. Shadow hosts
 * are joined with >>, a light-DOM part of a component gets its component in front.
 */
const DESCRIBE = `(el) => {
  const one = (e) => {
    let s = e.localName;
    if (e.id) s += '#' + e.id;
    else if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.');
    for (const a of ['label', 'aria-label', 'heading', 'name']) {
      const v = e.getAttribute(a);
      if (v) return s + '[' + a + '="' + v.slice(0, 30) + '"]';
    }
    return s;
  };
  if (el.nodeType !== 1) el = el.parentElement;
  const hosts = [];
  for (let e = el; e; ) {
    let s = one(e);
    if (!e.localName.startsWith('kakao-')) {
      let up = e.parentElement;
      while (up && !up.localName.startsWith('kakao-')) up = up.parentElement;
      if (up) s = one(up) + ' ' + s;
    }
    hosts.unshift(s);
    const root = e.getRootNode();
    e = root instanceof ShadowRoot ? root.host : null;
  }
  const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
  return hosts.join(' >> ') + (text ? ' "' + text + '"' : '');
}`;

/** Waits for the loader, fonts, the page cloak and two frames, then opts.wait. */
async function settle(page, wait) {
  await page.evaluate(async () => {
    const cap = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    if (window.kakaoLoader && window.kakaoLoader.ready) await cap(window.kakaoLoader.ready, 4000);
    if (document.fonts) await cap(document.fonts.ready, 2000);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForFunction(
    () => getComputedStyle(document.documentElement).opacity === '1' && (!document.body || getComputedStyle(document.body).opacity === '1'),
    null,
    { timeout: 4000 },
  ).catch(() => {});
  if (wait) await page.waitForTimeout(wait);
}

/** Sideways scroll: null, or { width, viewport, offenders: [description] }. */
function overflow(page) {
  return page.evaluate((src) => {
    const describe = (0, eval)(src);
    const vw = document.documentElement.clientWidth;
    const width = document.documentElement.scrollWidth;
    if (width <= vw) return null;
    const offenders = [];
    // The outermost elements that stick out; inside one, the deeper culprit if there is one.
    const walk = (el) => {
      for (const child of el.children) {
        if (offenders.length >= 5) return;
        const r = child.getBoundingClientRect();
        const clips = getComputedStyle(child).overflowX !== 'visible';
        if (r.width && r.right > vw + 1) {
          const before = offenders.length;
          if (!clips) walk(child);
          if (offenders.length === before) offenders.push(`${describe(child)} (right edge at ${Math.round(r.right)}px)`);
        } else if (!clips) {
          walk(child);
        }
      }
    };
    if (document.body) walk(document.body);
    return { width, viewport: vw, offenders };
  }, DESCRIBE);
}

/** Visible controls and images without a name, from Chromium's accessibility tree. */
async function accessibility(page) {
  const findings = [];
  const doc = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title.trim(),
    viewport: !!document.querySelector('meta[name="viewport"]'),
  }));
  if (!doc.lang) findings.push('<html> has no lang');
  if (!doc.title) findings.push('the page has no <title>');
  if (!doc.viewport) findings.push('no <meta name="viewport">: phones show the page 980px wide, zoomed out');
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const seen = new Set();
  for (const n of nodes) {
    if (n.ignored || !n.role || n.backendDOMNodeId == null || !NAMED_ROLES.has(n.role.value)) continue;
    if (n.name && typeof n.name.value === 'string' && n.name.value.trim()) continue;
    let where;
    try {
      const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId });
      const res = await cdp.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function () {
          const el = this.nodeType === 1 ? this : this.parentElement;
          const r = el.getBoundingClientRect();
          return { d: (${DESCRIBE})(el), visible: r.width > 0 && r.height > 0 };
        }`,
        returnByValue: true,
      });
      where = res.result.value;
    } catch {
      continue;
    }
    if (!where || !where.visible) continue;
    const role = n.role.value === 'img' ? 'image' : n.role.value;
    const line = `${role} without an accessible name: ${where.d}`;
    if (!seen.has(line)) findings.push(line);
    seen.add(line);
  }
  await cdp.detach();
  return findings;
}

/** Tab through the page: { stops, findings } for stops without a visible focus indicator. */
async function keyboard(page, maxTabs) {
  const findings = [];
  await page.mouse.move(0, 0);
  let stops = 0;
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
    const handle = await page.evaluateHandle(() => {
      let el = document.activeElement;
      while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
      return el === document.body || el === document.documentElement ? null : el;
    });
    const el = handle.asElement();
    if (!el) {
      if (stops) break; // focus left the page: one round done
      continue;
    }
    // Each stop is marked with its number, so a wrap-around or a stuck focus shows.
    const info = await el.evaluate((e, [src, n]) => {
      const seen = e.__visualCheckStop;
      e.__visualCheckStop = n;
      e.scrollIntoView({ block: 'center', inline: 'nearest' });
      const r = e.getBoundingClientRect();
      return { seen, d: (0, eval)(src)(e), x: r.x, y: r.y, w: r.width, h: r.height };
    }, [DESCRIBE, stops]);
    if (info.seen === stops - 1) {
      findings.push(`Tab does not move on from ${info.d}`);
      break;
    }
    if (info.seen !== undefined) break; // wrapped around to an earlier stop
    stops++;
    if (!info.w || !info.h) {
      findings.push(`focus lands on an element without a box: ${info.d}`);
      continue;
    }
    // Focused vs blurred, with room for a ring outside the box.
    const vp = page.viewportSize();
    const pad = 8;
    const x = Math.max(0, Math.floor(info.x - pad));
    const y = Math.max(0, Math.floor(info.y - pad));
    const clip = { x, y, width: Math.min(vp.width - x, Math.ceil(info.w + 2 * pad)), height: Math.min(vp.height - y, Math.ceil(info.h + 2 * pad)) };
    if (clip.width <= 0 || clip.height <= 0) continue;
    await page.waitForTimeout(100);
    const focused = await page.screenshot({ clip });
    await el.evaluate((e) => e.blur());
    await page.waitForTimeout(100);
    const blurred = await page.screenshot({ clip });
    await el.evaluate((e) => e.focus());
    if (focused.equals(blurred)) findings.push(`no visible focus on ${info.d}`);
  }
  return { stops, findings };
}

/** Animations still running under reduced motion. */
function motion(page) {
  return page.evaluate((src) => {
    const describe = (0, eval)(src);
    const out = new Set();
    // document.getAnimations() leaves out shadow trees: ask every open shadow root too.
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      for (const el of roots[i].querySelectorAll('*')) if (el.shadowRoot) roots.push(el.shadowRoot);
    }
    // One line per animation and kind of element, with a count.
    const found = new Map();
    for (const a of roots.flatMap((r) => r.getAnimations())) {
      if (a.playState !== 'running' || !a.effect) continue;
      const t = a.effect.getComputedTiming();
      if (!(t.iterations === Infinity || t.endTime > 1000)) continue;
      const d = a.effect.target ? describe(a.effect.target).replace(/\[[^\]]*\]|"[^"]*"$/g, '').trim() : '(no target)';
      const key = `${a.animationName || a.transitionProperty || 'animation'} keeps running on ${d}`;
      const f = found.get(key) || { text: key, count: 0, busy: /spinner|progress|skeleton|loading|busy/i.test(d) };
      f.count++;
      found.set(key, f);
    }
    return [...found.values()].map((f) => ({ text: f.text + (f.count > 1 ? ` (${f.count}×)` : ''), busy: f.busy }));
  }, DESCRIBE);
}

// ---- per page ----------------------------------------------------------------

async function checkPage(browser, url, dir, opts) {
  fs.mkdirSync(dir, { recursive: true });
  const report = { shots: [], errors: new Set(), overflow: [], a11y: [], keyboard: null, motion: [], busy: [] };
  const watch = (page) => {
    page.on('console', (m) => { if (m.type() === 'error') report.errors.add(`console: ${m.text()}`); });
    page.on('pageerror', (e) => report.errors.add(`exception: ${e.message}`));
    page.on('requestfailed', (r) => report.errors.add(`request failed: ${r.url()} (${r.failure() && r.failure().errorText})`));
    page.on('response', (r) => { if (r.status() >= 400) report.errors.add(`HTTP ${r.status()}: ${r.url()}`); });
  };
  const open = async (options, wait) => {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    watch(page);
    await page.goto(url, { waitUntil: 'load' });
    await settle(page, wait);
    return { context, page };
  };

  for (const v of VARIANTS) {
    const { context, page } = await open({ viewport: v.viewport, colorScheme: v.colorScheme, isMobile: !!v.isMobile, hasTouch: !!v.hasTouch, reducedMotion: 'no-preference' }, opts.wait);
    const file = path.join(dir, `${v.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.shots.push(file);
    const o = await overflow(page);
    if (o) report.overflow.push(`${v.name}: the page scrolls sideways (${o.width}px wide in ${o.viewport}px)${o.offenders.map((d) => '\n            ' + d).join('')}`);
    if (v.name === 'desktop-light') report.a11y = await accessibility(page);
    await context.close();
  }

  // Reduced motion: let entrance animations finish, then see what still moves.
  const { context, page } = await open({ viewport: VARIANTS[0].viewport, colorScheme: 'light', reducedMotion: 'reduce' }, Math.max(opts.wait, 600));
  const moving = await motion(page);
  report.motion = moving.filter((m) => !m.busy).map((m) => m.text);
  report.busy = moving.filter((m) => m.busy).map((m) => m.text);
  report.keyboard = await keyboard(page, opts.tabs);
  await context.close();
  return report;
}

/** Prints one page's report; returns its number of findings. */
function print(name, r) {
  const lines = [name];
  let count = 0;
  const section = (label, items) => {
    count += items.length;
    if (!items.length) lines.push(`  ${label.padEnd(9)} ok`);
    for (const i of items) lines.push(`  ${label.padEnd(9)} ${i}`);
  };
  for (const s of r.shots) lines.push(`  shot      ${s}`);
  section('errors', [...r.errors]);
  section('overflow', r.overflow);
  section('a11y', r.a11y);
  lines.push(`  keyboard  ${r.keyboard.stops} Tab stops`);
  section('focus', r.keyboard.findings);
  section('motion', r.motion);
  for (const b of r.busy) lines.push(`  note      ${b}: a busy indicator, fine if it is calm (look)`);
  console.log(lines.join('\n'));
  return count;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    console.error(`visual-check: ${e.message}\n${USAGE}`);
    return 2;
  }
  if (opts.help) {
    console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ''));
    return 0;
  }
  const targets = [];
  for (const p of opts.pages) {
    if (/^https?:\/\//.test(p)) {
      targets.push({ name: p, url: p });
      continue;
    }
    const file = path.resolve(p);
    if (!fs.existsSync(file)) {
      console.error(`visual-check: no such file ${p}`);
      return 2;
    }
    if (path.relative(opts.root, file).startsWith('..')) {
      console.error(`visual-check: ${p} is outside --root ${opts.root}`);
      return 2;
    }
    targets.push({ name: p, file });
  }

  const pw = loadPlaywright();
  if (!pw) {
    console.error(NO_PLAYWRIGHT);
    return 2;
  }
  let browser;
  try {
    browser = await pw.chromium.launch();
  } catch (e) {
    console.error(`visual-check: Chromium did not start (${e.message.split('\n')[0]}).\nInstall it with: npx playwright install chromium`);
    return 2;
  }
  const server = targets.some((t) => t.file) ? await serve(opts.root) : null;
  let total = 0;
  try {
    for (const t of targets) {
      const report = await checkPage(browser, t.url || server.url(t.file), path.join(opts.out, slug(t.name)), opts);
      total += print(t.name, report);
    }
  } finally {
    await browser.close();
    if (server) await server.close();
  }
  console.log(`\n${total ? `${total} finding(s).` : 'No findings.'} Now open the screenshots and look: light, dark, phone.`);
  return total ? 1 : 0;
}

if (require.main === module) {
  main().then((code) => { process.exitCode = code; }, (e) => { console.error(e); process.exitCode = 2; });
}

module.exports = { parseArgs, slug, serve, loadPlaywright, checkPage };
