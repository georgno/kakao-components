/**
 * Kakao Components - Trigger / Reaction API
 * ============================================================================
 * A tiny pub/sub layer so kakao components can announce what happened and
 * react to each other without knowing each other.
 *
 * A trigger is a custom event named `kakao-trigger:<name>`. Components emit it
 * from themselves; it bubbles and is composed, so any ancestor (also outside a
 * shadow root) and any page-level listener can react.
 *
 *   KakaoComponents.emit(this, 'count-change', { value: 3 });
 *   const off = KakaoComponents.on('count-change', (detail, event) => {
 *     detail.value; // 3
 *     detail.source; // the element that emitted it
 *     detail.trigger; // 'count-change'
 *   });
 *   off(); // unsubscribe
 *
 * Components declare what they emit and what they react to, so pages and
 * documentation tools can discover the wiring:
 *
 *   KakaoComponents.register('kakao-card', {
 *     triggers: [],
 *     reactions: { 'theme-change': 'glow color' },
 *   });
 *   KakaoComponents.meta('kakao-card');
 *
 * Everything is optional: components check `typeof KakaoComponents`, so they
 * still work on pages that don't load this file.
 * ============================================================================
 */
(function (global) {
  'use strict';

  const listeners = new WeakMap(); // handler → wrapper
  const registry = {};

  const type = (trigger) => `kakao-trigger:${trigger}`;

  const KakaoComponents = {
    /** Declare a component's triggers and reactions (for discovery only). */
    register(tagName, { triggers = [], reactions = {} } = {}) {
      registry[tagName] = { triggers: Array.from(triggers), reactions: { ...reactions } };
    },

    /** Registered metadata for a component, or null. */
    meta(tagName) {
      const entry = registry[tagName];
      return entry ? { triggers: [...entry.triggers], reactions: { ...entry.reactions } } : null;
    },

    /**
     * Emit a trigger from `source`. The detail is merged with { source, trigger },
     * so listeners always know where it came from.
     */
    emit(source, trigger, detail = {}) {
      const payload = { source, trigger, ...detail };
      const event = new CustomEvent(type(trigger), { detail: payload, bubbles: true, composed: true });
      // A detached source never reaches the document, so emit there as well.
      if (source && typeof source.dispatchEvent === 'function' && source.isConnected) source.dispatchEvent(event);
      else document.dispatchEvent(event);
    },

    /** Subscribe to a trigger. Returns an unsubscribe function. */
    on(trigger, handler) {
      const wrapper = (e) => handler(e.detail, e);
      listeners.set(handler, wrapper);
      document.addEventListener(type(trigger), wrapper);
      return () => KakaoComponents.off(trigger, handler);
    },

    /** Unsubscribe a handler previously passed to on(). */
    off(trigger, handler) {
      const wrapper = listeners.get(handler);
      if (!wrapper) return;
      document.removeEventListener(type(trigger), wrapper);
      listeners.delete(handler);
    },
  };

  global.KakaoComponents = KakaoComponents;
})(typeof window !== 'undefined' ? window : global);
