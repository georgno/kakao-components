'use strict';
/**
 * Records what a real browser computes for a sample of settings, in several
 * themes and in more-contrast mode, into browser.json. The export test
 * (resolve.test.js) compares the exporter's resolved values against it.
 *
 * Run once, by hand, after changing the sample or when the resolution rules
 * change (Playwright is not a dependency of this repo):
 *   node tools/export-tokens/tests/fixtures/record-browser.js [chromium|firefox]
 *
 * Each probe is an element inside the component (in its shadow root for
 * shadow DOM components) whose `color`, `background-color` or `box-shadow`
 * is set to var(--_<alias>), so the browser resolves the whole chain.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '../../../..');

// [component, tag, alias, css property]
const SAMPLE = [
  ['button', 'kakao-button', '--_primary-ring', 'background-color'],
  ['button', 'kakao-button', '--_ghost-hover-bg', 'background-color'],
  ['button', 'kakao-button', '--_danger-ring', 'background-color'],
  ['button', 'kakao-button', '--_primary-bg', 'background-color'],
  ['dialog', 'kakao-dialog', '--_shadow', 'box-shadow'],
  ['dialog', 'kakao-dialog', '--_bg', 'background-color'],
  ['switch-group', 'kakao-switch-group', '--_track-bg-on', 'background-color'],
  ['switch-group', 'kakao-switch-group', '--_track-bg-off', 'background-color'],
  ['card', 'kakao-card', '--_border', 'background-color'],
  ['file-upload', 'kakao-file-upload', '--_spotlight-color', 'background-color'],
  ['tooltip', 'kakao-tooltip', '--_shadow', 'box-shadow'],
];
const THEMES = ['light', 'dark', 'amoled', 'beige'];

async function main() {
  const which = process.argv[2] || 'chromium';
  const pw = require('playwright');
  const browser = await pw[which].launch();
  const out = { browser: `${which} ${browser.version()}`, recordedAt: new Date().toISOString().slice(0, 10), values: [] };

  for (const contrast of ['no-preference', 'more']) {
    const page = await browser.newPage({ contrast });
    const scripts = [...new Set(SAMPLE.map(([c]) => c))]
      .map((c) => {
        const css = fs.existsSync(path.join(ROOT, `components/${c}/${c}.css`))
          ? `<link rel="stylesheet" href="components/${c}/${c}.css">`
          : '';
        return `${css}<script src="components/${c}/${c}.js"></script>`;
      })
      .join('\n');
    const html = `<!doctype html><html><head><base href="${pathToFileURL(ROOT).href}/">
      <link rel="stylesheet" href="shared/tokens.css"><link rel="stylesheet" href="shared/themes.css">
      <script src="shared/component-api.js"></script>${scripts}</head><body></body></html>`;
    const tmp = path.join(ROOT, '.record-browser.html');
    fs.writeFileSync(tmp, html);
    try {
      await page.goto(pathToFileURL(tmp).href);
      await page.waitForTimeout(500);
      for (const theme of THEMES) {
        for (const [component, tag, alias, prop] of SAMPLE) {
          const value = await page.evaluate(
            ({ theme, tag, alias, prop }) => {
              const box = document.createElement('div');
              box.setAttribute('data-kakao-theme', theme);
              const el = document.createElement(tag);
              box.append(el);
              document.body.append(box);
              const probe = document.createElement('span');
              probe.style.setProperty(prop, `var(${alias})`);
              (el.shadowRoot || el).append(probe);
              const v = getComputedStyle(probe).getPropertyValue(prop);
              box.remove();
              return v;
            },
            { theme, tag, alias, prop },
          );
          out.values.push({ component, alias, theme: contrast === 'more' ? `${theme}/contrast` : theme, property: prop, computed: value });
        }
      }
    } finally {
      fs.rmSync(tmp, { force: true });
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'browser.json'), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Recorded ${out.values.length} values with ${out.browser}.`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
