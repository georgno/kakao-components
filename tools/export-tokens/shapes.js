'use strict';
/**
 * shapes.js - turns parsed values that are really a shadow or a font
 * shorthand into their own node types, so a consumer gets layers and parts
 * instead of a bare token list.
 *
 *   shadow  { type: 'shadow', layers: [{ x, y, blur, spread, color, inset }] }
 *           `none` is a shadow with no layers.
 *   font    { type: 'font', style?, weight?, size, lineHeight, family }
 *           (`0.95rem/1.4 var(--kakao-font-family, …)`, `550 0.875rem/1 …`)
 */
const { ParseError } = require('./parse');

const isLength = (n) => n && ['length', 'em', 'cap', 'viewport', 'percent', 'calc'].includes(n.type);
const isZero = (n) => n && n.type === 'number' && n.value === 0;
const isColorish = (n) => n && ['color', 'mix', 'ref', 'currentColor'].includes(n.type);

function readLayer(node) {
  const items = node.type === 'list' && node.separator === 'space' ? node.items : [node];
  const lengths = [];
  let color = null;
  let inset = false;
  for (const it of items) {
    if (it.type === 'keyword' && it.value === 'inset') inset = true;
    else if (isLength(it) || isZero(it)) lengths.push(isZero(it) ? { type: 'length', px: 0 } : it);
    else if (isColorish(it) && !color) color = it;
    else throw new ParseError(`not a shadow layer part: ${JSON.stringify(it)}`);
  }
  if (lengths.length < 2 || lengths.length > 4) throw new ParseError('a shadow layer needs 2 to 4 lengths');
  const zero = { type: 'length', px: 0 };
  return {
    x: lengths[0],
    y: lengths[1],
    blur: lengths[2] || zero,
    spread: lengths[3] || zero,
    color: color || { type: 'currentColor' },
    inset,
  };
}

/** A parsed box-shadow value as a shadow node. */
function readShadow(node) {
  if (node.type === 'none') return { type: 'shadow', layers: [] };
  if (node.type === 'ref') return node; // a token or setting that is itself a shadow
  const layers = node.type === 'list' && node.separator === 'comma' ? node.items : [node];
  return { type: 'shadow', layers: layers.map(readLayer) };
}

/** A parsed `font` shorthand (size[/line-height] family) as a font node. */
function readFont(node) {
  if (node.type !== 'slash') {
    // No size: the value is a family (or a ref to one).
    return node;
  }
  // [style] [weight] size / line-height family
  const lead = node.before.type === 'list' && node.before.separator === 'space' ? node.before.items : [node.before];
  const size = lead[lead.length - 1];
  if (!isLength(size)) throw new ParseError('a font shorthand needs its size before the "/"');
  let weight = null;
  let style = null;
  for (const it of lead.slice(0, -1)) {
    if (it.type === 'number' && !weight) weight = it;
    else if (it.type === 'keyword' && ['italic', 'normal', 'oblique'].includes(it.value) && !style) style = it;
    else throw new ParseError(`not a font shorthand part: ${JSON.stringify(it)}`);
  }
  const after = node.after.type === 'list' && node.after.separator === 'space' ? node.after.items : [node.after];
  const [lineHeight, ...family] = after;
  if (!family.length) throw new ParseError('a font shorthand needs a family');
  return {
    type: 'font',
    ...(style ? { style } : {}),
    ...(weight ? { weight } : {}),
    size,
    lineHeight,
    family: family.length === 1 ? family[0] : { type: 'list', separator: 'space', items: family },
  };
}

/** Applies the shape a setting's name calls for (shadows, font shorthands). */
function shape(alias, node) {
  if (/(^|-)shadow$/.test(alias)) return readShadow(node);
  if (/(^|-)font$/.test(alias)) return readFont(node);
  return node;
}

module.exports = { readShadow, readFont, shape };
