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
