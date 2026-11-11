/**
 * Design-resolution scaling and rotation (spec §6.4, DEC-09).
 *
 * The stage is a fixed `canvasWidth x canvasHeight` element in design
 * pixels. It is placed with `transform-origin: 0 0` and:
 *
 *     transform: translate(tx, ty) rotate(r) scale(sx, sy)
 *
 * so the rotated, scaled content is centered on the viewport according to
 * the scale mode. Everything here is pure math; no DOM required.
 */

export type ScaleMode = 'fit' | 'fill' | 'stretch';
export type Rotation = 0 | 90 | 180 | 270;

export interface ScaleInput {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  mode: ScaleMode;
  rotation: Rotation;
}

export interface Transform {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

export function computeTransform(input: ScaleInput): Transform {
  const { canvasWidth, canvasHeight, viewportWidth, viewportHeight, mode, rotation } = input;
  const swap = rotation === 90 || rotation === 270;
  // Footprint of the rotated canvas on the viewport.
  const footW = swap ? canvasHeight : canvasWidth;
  const footH = swap ? canvasWidth : canvasHeight;

  let scaleX: number;
  let scaleY: number;
  if (mode === 'stretch') {
    scaleX = viewportWidth / footW;
    scaleY = viewportHeight / footH;
  } else {
    const s =
      mode === 'fit'
        ? Math.min(viewportWidth / footW, viewportHeight / footH)
        : Math.max(viewportWidth / footW, viewportHeight / footH);
    scaleX = s;
    scaleY = s;
  }

  // Center the rotated content box inside the viewport (transform-origin 0 0).
  if (rotation === 0) {
    return {
      scaleX,
      scaleY,
      translateX: (viewportWidth - canvasWidth * scaleX) / 2,
      translateY: (viewportHeight - canvasHeight * scaleY) / 2,
    };
  }
  if (rotation === 180) {
    return {
      scaleX,
      scaleY,
      translateX: (viewportWidth + canvasWidth * scaleX) / 2,
      translateY: (viewportHeight + canvasHeight * scaleY) / 2,
    };
  }
  if (rotation === 90) {
    return {
      scaleX,
      scaleY,
      translateX: (viewportWidth + canvasHeight * scaleY) / 2,
      translateY: (viewportHeight - canvasWidth * scaleX) / 2,
    };
  }
  return {
    scaleX,
    scaleY,
    translateX: (viewportWidth - canvasHeight * scaleY) / 2,
    translateY: (viewportHeight + canvasWidth * scaleX) / 2,
  };
}

/** CSS transform string for the stage (remember: `transform-origin: 0 0`). */
export function transformCss(t: Transform, rotation: Rotation): string {
  return `translate(${t.translateX}px, ${t.translateY}px) rotate(${rotation}deg) scale(${t.scaleX}, ${t.scaleY})`;
}
