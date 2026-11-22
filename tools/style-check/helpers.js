/**
 * helpers.js
 * ============================================================================
 * Shared definitions for the style rules, passed to every rule as `ctx`, so
 * the rules agree with each other:
 *
 *   attr(el, name)         the attribute ({ value, dynamic, … }) or null
 *   has(el, name)          the attribute is present
 *   variant(el)            a button's variant: 'primary' when missing,
 *                          null when dynamic
 *   isFilled(el)           variant missing, primary, secondary or danger
 *                          (ghost is not filled); null when dynamic
 *   footerButtons(el)      kakao-button children with slot="footer", or the
 *                          kakao-buttons inside the slot="footer" child, in
 *                          document order: { buttons, footer }
 *   mainButton(buttons)    index of the main button: the first primary (or
 *                          variant-less) or danger one, else the first filled
 *                          one; -1 for none; null when a variant is dynamic
 *   describe(el)           a short name for messages: <kakao-button "Save">
 *   VALUES                 the attribute value table (attribute-values rule)
 *
 * VALUES lists every attribute with a fixed set of values, as the component
 * headers document them. Adding a value to a component includes adding it
 * here (see AGENTS.md).
 * ============================================================================
 */
'use strict';

const SIZES = ['sm', 'md', 'lg'];
const STATUS_TONES = ['neutral', 'primary', 'success', 'danger', 'ink'];
const COLLAPSE = ['auto', 'always', 'never'];

const VALUES = {
  'kakao-button': { variant: ['primary', 'secondary', 'ghost', 'danger'], size: SIZES },
  'kakao-badge': { tone: STATUS_TONES },
  'kakao-chip': { tone: STATUS_TONES },
  'kakao-dialog': { size: SIZES, 'button-position': ['left', 'center', 'right'] },
  'kakao-breadcrumb': { start: ['icon', 'text', 'none'] },
  'kakao-avatar': {
    size: ['xs', 'sm', 'md', 'lg', 'xl'],
    shape: ['circle', 'square'],
    status: ['online', 'away', 'busy', 'offline'],
    tone: ['auto', 'neutral', 'primary', 'success', 'warning', 'danger'],
  },
  'kakao-avatar-group': { size: ['xs', 'sm', 'md', 'lg', 'xl'], shape: ['circle', 'square'] },
  'kakao-copy-button': { variant: ['secondary', 'ghost'], size: SIZES },
  'kakao-image': { fit: ['cover', 'contain'], loading: ['lazy', 'eager'] },
  'kakao-kbd': { platform: ['auto', 'mac', 'other'], size: ['sm', 'md'] },
  'kakao-menu': { placement: ['bottom-start', 'bottom-end', 'top-start', 'top-end'] },
  'kakao-pagination': { size: SIZES, collapse: COLLAPSE },
  'kakao-rating': { size: SIZES, step: ['1', '0.5'] },
  'kakao-skeleton': {
    shape: ['text', 'circle', 'block', 'row', 'card'],
    animation: ['shimmer', 'pulse', 'none'],
  },
  'kakao-spinner': { size: SIZES, tone: ['none', 'primary', 'success', 'warning', 'danger', 'muted'] },
  'kakao-stack': { position: ['inline', 'bottom-right', 'bottom-left', 'top-right', 'top-left'] },
  'kakao-toast': { position: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
  'kakao-stepper': { orientation: ['horizontal', 'vertical'], collapse: COLLAPSE, clickable: ['', 'done', 'all'] },
  'kakao-toc': { collapse: COLLAPSE, nested: ['all', 'active'] },
  'kakao-tooltip': { placement: ['top', 'bottom', 'left', 'right'] },
  'kakao-tree-view': { selection: ['single', 'multiple', 'none'] },
};

const FILLED = new Set(['primary', 'secondary', 'danger']);

function attr(el, name) {
  return (el && el.attrs.get(name)) || null;
}

function has(el, name) {
  return !!attr(el, name);
}

function variant(el) {
  const a = attr(el, 'variant');
  if (!a) return el.dynamicAttrs ? null : 'primary';
  if (a.dynamic) return null;
  return a.value.trim() || 'primary';
}

function isFilled(el) {
  const v = variant(el);
  return v === null ? null : FILLED.has(v);
}

function collectButtons(el, out) {
  for (const child of el.children) {
    if (child.tag === 'kakao-button') out.push(child);
    else if (!child.tag.startsWith('kakao-')) collectButtons(child, out);
  }
  return out;
}

function footerButtons(el) {
  const buttons = [];
  let footer = null;
  for (const child of el.children) {
    if (child.slot !== 'footer') continue;
    if (child.tag === 'kakao-button') buttons.push(child);
    else if (!child.tag.startsWith('kakao-')) {
      footer = footer || child;
      collectButtons(child, buttons);
    }
  }
  return { buttons, footer };
}

function mainButton(buttons) {
  const variants = buttons.map(variant);
  if (variants.includes(null)) return null;
  let index = variants.findIndex((v) => v === 'primary' || v === 'danger');
  if (index < 0) index = variants.findIndex((v) => FILLED.has(v));
  return index;
}

function describe(el) {
  const label = attr(el, 'label') || attr(el, 'aria-label');
  if (label && !label.dynamic && label.value.trim()) return `<${el.tag} "${label.value.trim()}">`;
  return `<${el.tag}>`;
}

module.exports = { VALUES, attr, has, variant, isFilled, footerButtons, mainButton, describe };
