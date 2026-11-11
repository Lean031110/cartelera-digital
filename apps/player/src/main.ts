/**
 * Cartelera player — waiting screen (F0).
 *
 * A screen is any device that opens a URL in a browser (spec §5.1). Until a
 * screen is linked and receives a manifest, it shows this built-in waiting
 * layout (spec §7.3.4): screen name, clock and a hint, rendered inside a
 * fixed 1920x1080 design canvas scaled with a transform (DEC-09).
 *
 * Constraints (spec §5.3, DEC-07): classic script (no modules), ES5 output,
 * no CSS Grid, no `gap` in flexbox, no `inset`, no `aspect-ratio`, absolute
 * positioning in design pixels. UI strings go through the STRINGS table.
 */

import { computeFitTransform, formatClock } from './clock.js';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const REFRESH_MS = 1000;

interface WaitingStrings {
  waitingTitle: string;
  linkHint: string;
}

/** Player-side i18n: a table, no framework, no module loader. */
const STRINGS: Record<string, WaitingStrings> = {
  es: {
    waitingTitle: 'Pantalla en espera',
    linkHint: 'Vincula esta pantalla desde el panel de administración',
  },
};

function queryParam(name: string): string | null {
  if (typeof window === 'undefined' || window.location.search === '') return null;
  const query = window.location.search.substring(1);
  const pairs = query.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]!.split('=');
    const key = pair[0] ?? '';
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(pair[1] ?? '');
    }
  }
  return null;
}

function absolutely(position: {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
}): Partial<CSSStyleDeclaration> {
  const style: Record<string, string> = { position: 'absolute' };
  if (position.left !== undefined) style.left = position.left + 'px';
  if (position.top !== undefined) style.top = position.top + 'px';
  if (position.right !== undefined) style.right = position.right + 'px';
  if (position.bottom !== undefined) style.bottom = position.bottom + 'px';
  if (position.width !== undefined) style.width = position.width + 'px';
  if (position.height !== undefined) style.height = position.height + 'px';
  return style as Partial<CSSStyleDeclaration>;
}

function applyStyles(el: HTMLElement, style: Partial<CSSStyleDeclaration>): void {
  const keys = Object.keys(style);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const value = (style as Record<string, string>)[key];
    if (value !== undefined) {
      (el.style as unknown as Record<string, string>)[key] = value;
    }
  }
}

/** Boots the waiting screen inside `root`. Exported for tests. */
export function boot(root: HTMLElement): void {
  const locale = queryParam('lang') ?? 'es';
  const strings = STRINGS[locale] ?? STRINGS['es']!;
  const screenName = queryParam('name') ?? 'Cartelera';
  const doc = root.ownerDocument;

  // Stage: fixed design canvas (DEC-09).
  const stage = doc.createElement('div');
  stage.id = 'cb-stage';
  applyStyles(stage, absolutely({ left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT }));
  stage.style.overflow = 'hidden';
  stage.style.backgroundColor = '#0b0f19';
  stage.style.fontFamily = "'Segoe UI', 'Noto Sans SC', sans-serif";

  const nameEl = doc.createElement('div');
  applyStyles(nameEl, absolutely({ left: 60, top: 48 }));
  nameEl.style.color = '#f2f5fa';
  nameEl.style.fontSize = '44px';
  nameEl.appendChild(doc.createTextNode(screenName));

  const titleEl = doc.createElement('h1');
  applyStyles(titleEl, absolutely({ top: 380, width: CANVAS_WIDTH, height: 120 }));
  titleEl.style.textAlign = 'center';
  titleEl.style.fontSize = '64px';
  titleEl.style.fontWeight = '400';
  titleEl.style.color = '#8b94a7';
  titleEl.appendChild(doc.createTextNode(strings.waitingTitle));

  const clockEl = doc.createElement('div');
  clockEl.setAttribute('data-testid', 'clock');
  applyStyles(clockEl, absolutely({ top: 560, width: CANVAS_WIDTH, height: 260 }));
  clockEl.style.textAlign = 'center';
  clockEl.style.fontSize = '200px';
  clockEl.style.fontWeight = '700';
  clockEl.style.lineHeight = '260px';
  clockEl.style.color = '#f2f5fa';

  const hintEl = doc.createElement('div');
  applyStyles(hintEl, absolutely({ bottom: 56, width: CANVAS_WIDTH, height: 40 }));
  hintEl.style.textAlign = 'center';
  hintEl.style.fontSize = '30px';
  hintEl.style.color = '#8b94a7';
  hintEl.appendChild(doc.createTextNode(strings.linkHint));

  stage.appendChild(nameEl);
  stage.appendChild(titleEl);
  stage.appendChild(clockEl);
  stage.appendChild(hintEl);
  root.appendChild(stage);

  const applyTransform = (): void => {
    const t = computeFitTransform(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      window.innerWidth,
      window.innerHeight,
    );
    stage.style.transformOrigin = '0 0';
    stage.style.transform = 'translate(' + t.x + 'px, ' + t.y + 'px) scale(' + t.scale + ')';
  };
  applyTransform();
  window.addEventListener('resize', applyTransform);

  const tick = (): void => {
    clockEl.textContent = formatClock(new Date(), false);
  };
  tick();
  window.setInterval(tick, REFRESH_MS);
}

// Auto-boot when loaded as a classic <script> (no-op under tests in Node).
if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
  const root = document.getElementById('cartelera-player-root');
  if (root !== null) {
    boot(root);
  }
}
