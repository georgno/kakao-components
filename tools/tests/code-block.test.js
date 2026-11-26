'use strict';
/*
 * kakao-code-block shows its content as text, never as HTML.
 *
 * The first test reads the source: the only HTML the component parses is its
 * own template. The second runs the component in Chromium when Playwright is
 * installed (it is not a dependency of this repo; the test is skipped
 * without it): markup in the light DOM, in `text` and in append() stays
 * inert text, and the log keeps max-lines and follows its end.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const SOURCE = path.join(ROOT, 'components/code-block/code-block.js');

let playwright = null;
try {
  playwright = require('playwright');
} catch {
  playwright = null;
}

test('code-block parses no HTML but its own template', () => {
  const code = fs.readFileSync(SOURCE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const sinks = [...code.matchAll(/\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|document\.write|createContextualFragment|setHTML|DOMParser/g)];
  assert.deepEqual(sinks.map((m) => m[0]), ['.innerHTML ='], 'only TEMPLATE.innerHTML');
  assert.match(code, /TEMPLATE\.innerHTML\s*=/);
});

test('content stays inert text in the browser', { skip: !playwright && 'Playwright is not installed' }, async () => {
  const browser = await playwright.chromium.launch();
  try {
    const page = await browser.newPage();
    const alerts = [];
    page.on('dialog', (d) => { alerts.push(d.message()); d.dismiss(); });
    await page.setContent(`<!doctype html><html><body>
      <kakao-code-block id="markup">&lt;img src=x onerror="alert('markup')"&gt; <b>bold</b></kakao-code-block>
      <kakao-code-block id="script"></kakao-code-block>
      <kakao-code-block id="log" mode="log" max-lines="5" max-height="4rem"></kakao-code-block>
      </body></html>`);
    for (const file of ['components/copy-button/copy-button.js', 'components/code-block/code-block.js']) {
      await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, file), 'utf8') });
    }
    const result = await page.evaluate(async () => {
      const shadowElements = (el) => el.shadowRoot.querySelector('code').children.length;
      const markup = document.getElementById('markup');
      const script = document.getElementById('script');
      script.text = '<img src=x onerror="alert(\'text\')">';
      script.append('\n<script>alert("append")<\/script><svg onload="alert(\'svg\')"></svg>');
      const log = document.getElementById('log');
      for (let i = 1; i <= 12; i++) log.append(`line ${i}\n`);
      log.append('\x1b[31mred\x1b[0m 10%');
      log.append('\r20%');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const s = log.shadowRoot.querySelector('.scroller');
      return {
        markupText: markup.text,
        markupElements: shadowElements(markup),
        scriptText: script.text,
        scriptElements: shadowElements(script),
        imgs: document.querySelectorAll('img').length + [markup, script].reduce((n, el) => n + el.shadowRoot.querySelectorAll('img, script, svg[onload]').length, 0),
        logText: log.text,
        atEnd: s.scrollHeight - s.scrollTop - s.clientHeight <= 4,
        following: log.following,
      };
    });
    await page.waitForTimeout(100);
    assert.equal(result.markupText, '<img src=x onerror="alert(\'markup\')"> bold');
    assert.equal(result.markupElements, 0);
    assert.equal(result.scriptText, '<img src=x onerror="alert(\'text\')">\n<script>alert("append")</script><svg onload="alert(\'svg\')"></svg>');
    assert.equal(result.scriptElements, 0);
    assert.equal(result.imgs, 0);
    assert.deepEqual(alerts, []);
    assert.equal(result.logText, 'line 9\nline 10\nline 11\nline 12\n20%', 'max-lines, ANSI dropped, \\r rewrites');
    assert.ok(result.atEnd && result.following, 'the log follows its end');
  } finally {
    await browser.close();
  }
});
