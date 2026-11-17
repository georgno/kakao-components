'use strict';
/**
 * resolve.js - works out what each value comes to in one theme and contrast
 * mode, the way the browser does with no overrides set:
 *
 * - var(--_alias)            the component's own setting, resolved in turn
 * - var(--kakao-<token>)     the shared token (colour roles per theme)
 * - var(--kakao-<setting>)   another settings property (an override hook,
 *                            unset by default): its fallback
 * - any other var()          set at runtime by a component (for example
 *                            --kakao-header-bar-rendered-height): kept as a
 *                            ref, with its fallback resolved
 * - color-mix(in srgb, …)    computed (CSS Color 4: premultiplied alpha)
 * - em, cap, viewport units, percentages, calc / clamp / min / max,
 *   currentColor, inherit    kept as typed nodes, their parts resolved
 */
const { hexToRgba, rgbaToHex } = require('./parse');

class ResolveError extends Error {}

/**
 * @param {object} env
 *   tokens:    Map name → parsed node (shared tokens, colours of this theme/mode)
 *   locals:    Map alias → parsed default node (the component's settings)
 *   hooks:     Set of every settings property name (override hooks)
 */
function resolve(node, env, stack = []) {
  const r = (n) => resolve(n, env, stack);
  switch (node.type) {
    case 'ref': {
      const { name } = node;
      if (stack.includes(name)) throw new ResolveError(`reference cycle: ${[...stack, name].join(' → ')}`);
      const next = [...stack, name];
      if (name.startsWith('--_')) {
        const local = env.locals && env.locals.get(name);
        if (!local) throw new ResolveError(`${name} is not a setting of this component`);
        return resolve(local, env, next);
      }
      if (env.tokens.has(name)) return resolve(env.tokens.get(name), env, next);
      if (env.hooks.has(name) && node.fallback) return resolve(node.fallback, env, next);
      if (node.fallback) return { type: 'ref', name, fallback: r(node.fallback) };
      throw new ResolveError(`${name} has no value and no fallback`);
    }
    case 'mix': {
      const a = r(node.a.color);
      const b = r(node.b.color);
      if (a.type !== 'color' || b.type !== 'color') {
        return { type: 'mix', space: 'srgb', a: { color: a, percent: node.a.percent }, b: { color: b, percent: node.b.percent } };
      }
      return { type: 'color', hex: mixSrgb(a.hex, node.a.percent, b.hex, node.b.percent) };
    }
    case 'list':
      return { ...node, items: node.items.map(r) };
    case 'slash':
      return { type: 'slash', before: r(node.before), after: r(node.after) };
    case 'op':
      return { type: 'op', op: node.op, left: r(node.left), right: r(node.right) };
    case 'calc':
      return { type: 'calc', expr: r(node.expr) };
    case 'clamp':
    case 'min':
    case 'max':
      return { type: node.type, args: node.args.map(r) };
    case 'shadow':
      return {
        type: 'shadow',
        layers: node.layers.map((l) => ({
          x: r(l.x),
          y: r(l.y),
          blur: r(l.blur),
          spread: r(l.spread),
          color: r(l.color),
          inset: l.inset,
        })),
      };
    case 'font':
      return {
        type: 'font',
        ...(node.style ? { style: node.style } : {}),
        ...(node.weight ? { weight: node.weight } : {}),
        size: r(node.size),
        lineHeight: r(node.lineHeight),
        family: r(node.family),
      };
    default:
      return node;
  }
}

/**
 * color-mix(in srgb, a p%, b q%) per CSS Color 4: missing percentages make
 * up 100; channels are interpolated premultiplied by alpha; a sum under 100%
 * scales the alpha down.
 */
function mixSrgb(hexA, pA, hexB, pB) {
  let p = pA;
  let q = pB;
  if (p == null && q == null) p = q = 50;
  else if (p == null) p = 100 - q;
  else if (q == null) q = 100 - p;
  const sum = p + q;
  if (sum <= 0) throw new ResolveError('color-mix() percentages add up to 0');
  const wa = p / sum;
  const wb = q / sum;
  const A = hexToRgba(hexA.slice(1));
  const B = hexToRgba(hexB.slice(1));
  const alpha = A.a * wa + B.a * wb;
  const ch = (k) => (alpha === 0 ? 0 : (A[k] * A.a * wa + B[k] * B.a * wb) / alpha);
  return rgbaToHex({ r: ch('r'), g: ch('g'), b: ch('b'), a: alpha * Math.min(1, sum / 100) });
}

module.exports = { resolve, mixSrgb, ResolveError };
