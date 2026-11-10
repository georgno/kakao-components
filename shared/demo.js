/*
 * demo.js - tiny helpers shared by the demo pages.
 */

/**
 * Appends every fired event (name + detail) to a log element.
 * @param {HTMLElement} logEl
 * @param {string[]} eventNames
 * @param {EventTarget} [target=document]
 */
function logEvents(logEl, eventNames, target = document) {
  eventNames.forEach((name) => {
    target.addEventListener(name, (e) => logLine(logEl, name, e.detail));
  });
}

/** Appends one "name detail" line to a log element. */
function logLine(logEl, name, detail) {
  const b = document.createElement('b');
  b.textContent = name;
  logEl.append(b, (detail === undefined ? '' : ' ' + safeStringify(detail)) + '\n');
  logEl.scrollTop = logEl.scrollHeight;
}

/** JSON.stringify that skips DOM nodes (some event details carry elements). */
function safeStringify(value) {
  return JSON.stringify(value, (key, v) => (v instanceof Node ? `<${v.localName}>` : v));
}

/**
 * Wires a toggle <kakao-button>: keeps its label in sync with `pressed` and
 * calls onChange(on) whenever it is flipped.
 * @param {HTMLElement} btn  a <kakao-button toggle>
 * @param {string} label  text shown before ": on" / ": off"
 * @param {(on: boolean) => void} onChange
 */
function toggleButton(btn, label, onChange) {
  const render = () => {
    btn.setAttribute('label', `${label}: ${btn.hasAttribute('pressed') ? 'on' : 'off'}`);
  };
  btn.setAttribute('toggle', '');
  btn.addEventListener('kakao-button-action', () => {
    render();
    onChange(btn.hasAttribute('pressed'));
  });
  render();
}

/*
 * Code blocks on the demo pages
 * ============================================================================
 * Every example on a demo page (components/<name>/demo.html) gets a collapsed
 * "Code" block with its markup, so a developer can see how to use it.
 *
 *   example         a top-level .card in <main>, or any element marked
 *                   data-example (for examples that are not in a .card)
 *   what it shows   the example's own markup as written in the page source,
 *                   without the example's own <h3> title, <p> notes (a <p>
 *                   with a kakao- element in it is an example) and
 *                   .toolbar controls, event logs (.log), inline scripts,
 *                   inline event handler attributes (onclick) and anything
 *                   marked data-demo-only (whatever only drives the demo)
 *   data-demo-wrap  on a layout wrapper that only the demo needs: the snippet
 *                   shows its content without it
 *   data-no-code    on an example: no code block
 *   <template data-code>
 *                   inside an example: shown verbatim instead of the markup;
 *                   for examples driven by script, so the snippet shows the
 *                   real API call (a <script> in it stays inert); a
 *                   template that holds only a <script> adds it to the
 *                   example's markup instead
 *   data-code-with="id ..."
 *                   on an example: the markup of these elements elsewhere on
 *                   the page (a sheet, a dialog) is added to the snippet,
 *                   before a trailing <script> of the template
 *
 * The markup is read before any script changes it (see the end of this
 * function), so it is the source as written, not what the components turn it
 * into (the light DOM ones rewrite their children) or what the page's own
 * script fills in. The block is built later, once the page is ready.
 */
(function demoCode() {
  if (!/\/demo(\.html)?$/.test(location.pathname)) return;

  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const RAW = new Set(['script', 'style']);
  const snippets = new Map(); // example element -> [[text, class], ...]

  function examples() {
    return [...document.querySelectorAll('main .card, main [data-example]')].filter(
      (el) => !el.parentElement.closest('.card, [data-example], [data-demo-only]') && !el.hasAttribute('data-demo-only'),
    );
  }

  /** True for the parts of an example that are not the example itself. */
  function isFurniture(el, example) {
    if (el.matches('[data-demo-only], .log, script, template[data-code]')) return true;
    if (el.parentElement !== example) return false;
    if (el.matches('h3, .toolbar')) return true;
    // a <p> is a note, unless components sit in it (a component in running text)
    return el.localName === 'p' && ![...el.querySelectorAll('*')].some((d) => d.localName.startsWith('kakao-'));
  }

  /* Serialises nodes into [text, class] pieces: boolean attributes stay bare,
     a value with double quotes in it (JSON) gets single quotes. */
  function serialize(nodes, out, example) {
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const raw = node.parentNode && RAW.has(node.parentNode.localName);
        out.push([raw ? node.data : node.data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;'), '']);
      } else if (node.nodeType === Node.COMMENT_NODE) {
        out.push([`<!--${node.data}-->`, 'c']);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (example && isFurniture(node, example)) {
          // drop the element and the indentation before it
          const last = out[out.length - 1];
          if (last && !last[1]) last[0] = last[0].replace(/(\n?)[ \t]*$/, '$1');
          return;
        }
        if (node.hasAttribute('data-demo-wrap')) {
          serialize([...node.childNodes], out, example); // only its content
          return;
        }
        const name = node.localName;
        out.push(['<', 'p'], [name, 't']);
        [...node.attributes].filter((a) => !a.name.startsWith('on')).forEach((a) => {
          out.push([' ', ''], [a.name, 'a']);
          if (a.value === '') return;
          const q = a.value.includes('"') && !a.value.includes("'") ? "'" : '"';
          const v = a.value.replace(/&/g, '&amp;').replace(q === '"' ? /"/g : /'/g, q === '"' ? '&quot;' : '&#39;');
          out.push(['=', 'p'], [q + v + q, 'v']);
        });
        out.push(['>', 'p']);
        if (VOID.has(name)) return;
        serialize([...(name === 'template' ? node.content : node).childNodes], out, example);
        out.push(['</', 'p'], [name, 't'], ['>', 'p']);
      }
    });
    return out;
  }

  /* Trims, drops trailing spaces and repeated blank lines, and removes the
     common indentation, keeping each character's class. */
  function tidy(pieces) {
    const lines = [[]];
    pieces.forEach(([text, cls]) => {
      [...text].forEach((ch) => (ch === '\n' ? lines.push([]) : lines[lines.length - 1].push([ch, cls])));
    });
    const blank = (l) => l.every(([ch]) => ch === ' ' || ch === '\t');
    let kept = lines.map((l) => {
      let end = l.length;
      while (end && (l[end - 1][0] === ' ' || l[end - 1][0] === '\t')) end--;
      return l.slice(0, end);
    });
    kept = kept.filter((l, i) => !(blank(l) && (i === 0 || blank(kept[i - 1]))));
    while (kept.length && blank(kept[kept.length - 1])) kept.pop();
    const indent = Math.min(...kept.filter((l) => !blank(l)).map((l) => l.findIndex(([ch]) => ch !== ' ' && ch !== '\t')));
    return kept.map((l) => (blank(l) ? [] : l.slice(indent)));
  }

  function capture() {
    examples().forEach((example) => {
      if (example.hasAttribute('data-no-code')) return;
      const own = example.querySelector('template[data-code]');
      let nodes = own ? [...own.content.childNodes] : [];
      // a trailing <script> in the template goes after the data-code-with parts
      const script = nodes.filter((n) => n.localName === 'script').pop();
      let cut = script && !nodes.slice(nodes.indexOf(script) + 1).some((n) => n.nodeType === Node.ELEMENT_NODE) ? nodes.indexOf(script) : -1;
      if (cut > 0 && nodes[cut - 1].nodeType === Node.TEXT_NODE && !nodes[cut - 1].data.trim()) cut--; // with its indentation
      const tail = cut >= 0 ? nodes.splice(cut) : [];
      // a template that is only a script adds it to the example's own markup
      const markup = nodes.some((n) => n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.COMMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.data.trim()));
      const parts = [tidy(markup ? serialize(nodes, []) : serialize([...example.childNodes], [], example))];
      (example.getAttribute('data-code-with') || '').split(/\s+/).filter(Boolean).forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        // keep the element's own indentation, so its lines dedent together
        const before = el.previousSibling && el.previousSibling.nodeType === Node.TEXT_NODE ? el.previousSibling.data.match(/[ \t]*$/)[0] : '';
        parts.push(tidy([[before, ''], ...serialize([el], [], el.parentElement)]));
      });
      if (tail.length) parts.push(tidy(serialize(tail, [])));
      const lines = parts.filter((l) => l.length).flatMap((l, i) => (i ? [[], ...l] : l));
      if (lines.length) snippets.set(example, lines);
    });
  }

  function render() {
    snippets.forEach((lines, example) => {
      const details = document.createElement('details');
      details.className = 'demo-code';
      details.dir = 'ltr'; // code reads left to right, also in an RTL example
      const summary = document.createElement('summary');
      summary.textContent = 'Code';
      const body = document.createElement('div');
      body.className = 'demo-code-body';
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.setAttribute('aria-label', 'Example code');
      lines.forEach((line, i) => {
        if (i) code.append('\n');
        let run = null;
        line.forEach(([ch, cls]) => {
          if (!run || run.cls !== cls) {
            run = { cls, node: cls ? document.createElement('span') : document.createTextNode('') };
            if (cls) run.node.className = `tok-${cls}`;
            code.append(run.node);
          }
          run.node.textContent += ch;
        });
      });
      const text = lines.map((l) => l.map(([ch]) => ch).join('')).join('\n');
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'demo-code-copy';
      copy.textContent = 'Copy';
      copy.setAttribute('aria-label', 'Copy code');
      const status = document.createElement('span');
      status.className = 'demo-code-status';
      status.setAttribute('role', 'status');
      let timer = 0;
      copy.addEventListener('click', async () => {
        let ok = true;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          ok = copyFallback(text);
        }
        copy.textContent = ok ? 'Copied' : 'Copy failed';
        status.textContent = ok ? 'Code copied' : 'Copying failed';
        clearTimeout(timer);
        timer = setTimeout(() => {
          copy.textContent = 'Copy';
          status.textContent = '';
        }, 1600);
      });
      pre.append(code);
      body.append(copy, pre, status);
      details.append(summary, body);
      code.addEventListener('scroll', () => syncFade(code), { passive: true });
      details.addEventListener('toggle', () => details.open && syncFade(code));
      placeIn(example, details);
    });
    window.addEventListener('resize', () => document.querySelectorAll('details.demo-code[open] code').forEach(syncFade));
  }

  /* The block goes right after the example's last own part, before any
     trailing demo furniture (a log, demo controls). */
  function placeIn(example, details) {
    const kids = [...example.children];
    const last = kids.filter((el) => !isFurniture(el, example)).pop() || kids.filter((el) => el.matches('[data-demo-only], .toolbar')).pop();
    if (last) last.after(details);
    else example.append(details);
  }

  /* Edge fade where there is more to scroll (styleguide rule). */
  function syncFade(el) {
    const max = el.scrollWidth - el.clientWidth;
    el.toggleAttribute('data-more-left', max > 1 && el.scrollLeft > 1);
    el.toggleAttribute('data-more-right', max > 1 && el.scrollLeft < max - 1);
    // a block that scrolls sideways takes keyboard focus, so it can be scrolled
    if (max > 1) el.tabIndex = 0;
    else el.removeAttribute('tabindex');
  }

  function copyFallback(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }

  // Read the markup before anything changes it. The page's own scripts sit
  // after </main>: the parser runs a microtask checkpoint (so this observer)
  // before it runs such a script, so seeing one inserted means everything
  // above it is parsed and nothing has run yet. Pages without one are read
  // when parsing ends (readyState "interactive"), still before the deferred
  // component scripts run.
  let captured = false;
  const captureOnce = () => {
    if (captured) return;
    captured = true;
    watcher.disconnect();
    capture();
  };
  const watcher = new MutationObserver((records) => {
    const main = document.querySelector('main');
    if (!main) return;
    const after = records.some((r) => [...r.addedNodes].some((n) => n.localName === 'script' && !main.contains(n) && main.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING));
    if (after) captureOnce();
  });
  watcher.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'interactive') captureOnce();
  });
  document.addEventListener('DOMContentLoaded', render);
})();
