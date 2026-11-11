import {
  resolveMarkers,
  type Layout,
  type LayoutElement,
  type ThemeTokens,
  type Variables,
} from '@cartelera/shared';

/**
 * DOM mounting of a layout (spec §7.2). The same engine is used by the
 * editor, the preview and the player (DEC-08): absolute positioning in
 * design pixels, plain DOM API only — never `innerHTML` with content.
 *
 * Widget runtimes (image, clock, menu, playlist, …) plug into the mounted
 * shells in later phases; at F0 non-text widgets render a labelled
 * placeholder so the editor can already position everything.
 */

export interface MountOptions {
  theme?: Partial<ThemeTokens>;
  variables?: Variables;
  document?: Document;
}

export interface MountHandle {
  /** Stage element sized after the design canvas. */
  root: HTMLElement;
  /** Element shells keyed by their stable element id. */
  shells: Map<string, HTMLElement>;
  destroy(): void;
}

function px(value: number): string {
  return `${value}px`;
}

function styleNumber(value: number | undefined, unit: string): string | undefined {
  return value === undefined ? undefined : `${value}${unit}`;
}

function applyStyleMarkers(
  el: HTMLElement,
  style: LayoutElement['style'],
  theme: Partial<ThemeTokens>,
  variables: Variables,
): void {
  if (style === undefined) return;
  const color = style.color !== undefined ? resolveMarkers(style.color, theme, variables) : null;
  if (color !== null) el.style.color = color.value;
  const fontFamily =
    style.fontFamily !== undefined ? resolveMarkers(style.fontFamily, theme, variables) : null;
  if (fontFamily !== null) el.style.fontFamily = fontFamily.value;
  const size = styleNumber(style.fontSize, 'px');
  if (size !== undefined) el.style.fontSize = size;
  const background =
    style.backgroundColor !== undefined
      ? resolveMarkers(style.backgroundColor, theme, variables)
      : null;
  if (background !== null) el.style.backgroundColor = background.value;
  if (style.textAlign !== undefined) el.style.textAlign = style.textAlign;
}

function mountTextProps(
  shell: HTMLElement,
  element: Extract<LayoutElement, { type: 'text' }>,
  theme: Partial<ThemeTokens>,
  variables: Variables,
): void {
  for (const paragraph of element.props.paragraphs) {
    const p = shell.ownerDocument.createElement('p');
    p.className = 'cb-paragraph';
    if (paragraph.align !== undefined) p.style.textAlign = paragraph.align;
    for (const run of paragraph.runs) {
      const text = resolveMarkers(run.text, theme, variables);
      let node: HTMLElement = p;
      if (run.bold === true) {
        const strong = p.ownerDocument.createElement('strong');
        p.appendChild(strong);
        node = strong;
      }
      if (run.italic === true) {
        const em = node.ownerDocument.createElement('em');
        (node === p ? p : node).appendChild(em);
        node = em;
      }
      if (run.underline === true) {
        const u = node.ownerDocument.createElement('u');
        node.appendChild(u);
        node = u;
      }
      node.appendChild(node.ownerDocument.createTextNode(text.value));
      if (run.color !== undefined)
        node.style.color = resolveMarkers(run.color, theme, variables).value;
      if (run.size !== undefined) node.style.fontSize = px(run.size);
    }
    shell.appendChild(p);
  }
}

function mountElement(
  stage: HTMLElement,
  element: LayoutElement,
  options: MountOptions,
  shells: Map<string, HTMLElement>,
): void {
  const doc = options.document ?? stage.ownerDocument;
  const theme = options.theme ?? {};
  const variables = options.variables ?? {};

  const shell = doc.createElement('div');
  shell.className = `cb-element cb-element-${element.type}`;
  shell.dataset.elementId = element.id;
  shell.dataset.elementType = element.type;
  shell.setAttribute('aria-label', element.name);

  const { frame } = element;
  shell.style.position = 'absolute';
  shell.style.left = px(frame.x);
  shell.style.top = px(frame.y);
  shell.style.width = px(frame.w);
  shell.style.height = px(frame.h);
  shell.style.zIndex = String(frame.z);
  shell.style.opacity = String(frame.opacity);
  if (frame.rotation !== 0) {
    shell.style.transform = `rotate(${frame.rotation}deg)`;
  }
  if (element.hidden) {
    shell.style.display = 'none';
  }
  applyStyleMarkers(shell, element.style, theme, variables);

  if (element.type === 'text') {
    mountTextProps(shell, element, theme, variables);
  } else {
    // Placeholder until widget runtimes land (F2/F3).
    const label = doc.createElement('div');
    label.className = 'cb-widget-placeholder';
    label.textContent = element.name;
    shell.appendChild(label);
  }

  stage.appendChild(shell);
  shells.set(element.id, shell);
}

/**
 * Mounts `layout` inside `container` and returns a handle to the created
 * stage. The caller is responsible for scaling the stage (see `computeTransform`).
 */
export function mountLayout(
  container: HTMLElement,
  layout: Layout,
  options: MountOptions = {},
): MountHandle {
  const doc = options.document ?? container.ownerDocument;
  const theme = options.theme ?? {};
  const variables = options.variables ?? {};

  const root = doc.createElement('div');
  root.className = 'cb-stage';
  root.style.position = 'absolute';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = px(layout.canvas.width);
  root.style.height = px(layout.canvas.height);
  const background = resolveMarkers(layout.canvas.background.value, theme, variables);
  root.style.backgroundColor = background.value;

  const shells = new Map<string, HTMLElement>();
  const ordered = [...layout.elements].sort((a, b) => a.frame.z - b.frame.z);
  for (const element of ordered) {
    mountElement(root, element, options, shells);
  }

  container.appendChild(root);
  return {
    root,
    shells,
    destroy() {
      if (root.parentNode !== null) {
        root.parentNode.removeChild(root);
      }
      shells.clear();
    },
  };
}

/** Publishes theme tokens as CSS custom properties (`--cb-*`) on `target`. */
export function applyThemeVars(target: HTMLElement, theme: ThemeTokens): void {
  target.style.setProperty('--cb-bg', theme.bg);
  target.style.setProperty('--cb-surface', theme.surface);
  target.style.setProperty('--cb-text', theme.text);
  target.style.setProperty('--cb-text-muted', theme.textMuted);
  target.style.setProperty('--cb-primary', theme.primary);
  target.style.setProperty('--cb-accent', theme.accent);
  target.style.setProperty('--cb-danger', theme.danger);
  target.style.setProperty('--cb-font-heading', theme.fontHeading);
  target.style.setProperty('--cb-font-body', theme.fontBody);
  target.style.setProperty('--cb-radius', `${theme.radius}px`);
}
