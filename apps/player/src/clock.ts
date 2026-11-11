/**
 * Pure helpers of the waiting screen.
 *
 * Player rules (spec §5.3): no `Intl`, no timezone database, only APIs that
 * exist in Chromium 53. `tsc --target ES5` lowers the syntax; this file must
 * stay free of modern *APIs* so the ES5 bundle stays honest.
 */

export interface FitTransform {
  scale: number;
  x: number;
  y: number;
}

/** Fit scaling of a fixed design canvas inside the viewport, centered (DEC-09). */
export function computeFitTransform(
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): FitTransform {
  const scale = Math.min(viewportWidth / canvasWidth, viewportHeight / canvasHeight);
  return {
    scale,
    x: (viewportWidth - canvasWidth * scale) / 2,
    y: (viewportHeight - canvasHeight * scale) / 2,
  };
}

export function pad2(value: number): string {
  return value < 10 ? '0' + String(value) : String(value);
}

/** `HH:mm` or `HH:mm:ss` from the device clock (server sync arrives in F2). */
export function formatClock(now: Date, showSeconds: boolean): string {
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  if (showSeconds) {
    return hours + ':' + minutes + ':' + pad2(now.getSeconds());
  }
  return hours + ':' + minutes;
}
