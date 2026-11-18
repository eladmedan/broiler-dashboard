/**
 * Small helpers that reproduce the parts of the Claude Design "dc" runtime
 * the prototype relied on, so the ported components can stay faithful to the
 * original markup.
 */
import type { CSSProperties } from 'react';

const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Convert an inline CSS string ("a:b;c:d") to a React style object. */
export function css(str: string | CSSProperties | undefined | null): CSSProperties | undefined {
  if (str == null) return undefined;
  if (typeof str !== 'string') return str;
  const o: Record<string, string> = {};
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  return o as CSSProperties;
}

/**
 * Replacement for the runtime's `style-hover="…"` / `style-active="…"`
 * attributes: registers a generated class with the given declarations under
 * the pseudo-class and returns the class name. Rules are deduplicated.
 */
const pseudoCache = new Map<string, string>();
let sheet: CSSStyleSheet | null = null;
export function pseudo(kind: 'hover' | 'active' | 'focus' | 'focus-visible', decls: string): string {
  const key = kind + '|' + decls;
  const hit = pseudoCache.get(key);
  if (hit) return hit;
  const cls = 'ps' + pseudoCache.size.toString(36) + '-' + kind;
  pseudoCache.set(key, cls);
  if (typeof document !== 'undefined') {
    if (!sheet) {
      const el = document.createElement('style');
      el.setAttribute('data-pseudo', '');
      document.head.appendChild(el);
      sheet = el.sheet as CSSStyleSheet;
    }
    const body = decls
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => (/!important\s*$/.test(d) ? d : d + ' !important'))
      .join(';');
    try {
      sheet.insertRule(`.${cls}:${kind}{${body}}`, sheet.cssRules.length);
    } catch {
      /* ignore malformed rule */
    }
  }
  return cls;
}

/** Join class names, skipping falsy entries. */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
