/**
 * Member photo rules and crop maths (MEM-012). Pure functions: the component only draws, the numbers live here so
 * they can be tested. A member picks a picture, drags it into a square viewport (shown through a circle), zooms and
 * rotates it, and we save a 512 px square and a 128 px thumbnail as WebP.
 */
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PHOTO_SIZE = 512;
export const THUMB_SIZE = 128;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export type PhotoProblem = 'type' | 'size';

/** The checks the server repeats: type first, then size (2 MB). */
export function checkPhotoFile(file: { type: string; size: number }): PhotoProblem | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return 'type';
  if (file.size > PHOTO_MAX_BYTES) return 'size';
  return null;
}

/** Number of quarter turns clockwise. */
export type Turns = 0 | 1 | 2 | 3;

/**
 * The crop: `zoom` 1 shows the shorter side of the picture, 4 shows a quarter of it. `cx` and `cy` are the centre of
 * the visible square in pixels of the picture AFTER it was turned.
 */
export type Crop = { zoom: number; cx: number; cy: number; turns: Turns };

export function turnedSize(w: number, h: number, turns: Turns) {
  return turns % 2 === 0 ? { w, h } : { w: h, h: w };
}

/** Side of the visible square, in pixels of the turned picture. */
export function cropSide(w: number, h: number, turns: Turns, zoom: number) {
  const t = turnedSize(w, h, turns);
  return Math.min(t.w, t.h) / zoom;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Keeps the zoom in range and the square inside the picture. */
export function clampCrop(c: Crop, w: number, h: number): Crop {
  const zoom = clamp(c.zoom, MIN_ZOOM, MAX_ZOOM);
  const t = turnedSize(w, h, c.turns);
  const half = cropSide(w, h, c.turns, zoom) / 2;
  return {
    zoom,
    turns: c.turns,
    cx: clamp(c.cx, half, t.w - half),
    cy: clamp(c.cy, half, t.h - half),
  };
}

export function initialCrop(w: number, h: number): Crop {
  const t = turnedSize(w, h, 0);
  return { zoom: 1, cx: t.w / 2, cy: t.h / 2, turns: 0 };
}

export type CropAction =
  /** Move by `dx`, `dy` pixels of the turned picture. */
  | { type: 'move'; dx: number; dy: number }
  | { type: 'zoom'; zoom: number }
  | { type: 'zoomBy'; delta: number }
  | { type: 'rotate' }
  | { type: 'reset' };

export function cropReducer(state: Crop, action: CropAction, w: number, h: number): Crop {
  switch (action.type) {
    case 'move':
      return clampCrop({ ...state, cx: state.cx + action.dx, cy: state.cy + action.dy }, w, h);
    case 'zoom':
      return clampCrop({ ...state, zoom: action.zoom }, w, h);
    case 'zoomBy':
      return clampCrop({ ...state, zoom: state.zoom + action.delta }, w, h);
    case 'rotate': {
      const turns = ((state.turns + 1) % 4) as Turns;
      // Turn the picture a quarter clockwise: the centre follows the picture, then the square is kept inside.
      const before = turnedSize(w, h, state.turns);
      return clampCrop({ zoom: state.zoom, turns, cx: before.h - state.cy, cy: state.cx }, w, h);
    }
    case 'reset':
      return initialCrop(w, h);
  }
}

/** The square to copy out of the turned picture. */
export function sourceRect(c: Crop, w: number, h: number) {
  const side = cropSide(w, h, c.turns, c.zoom);
  return { x: c.cx - side / 2, y: c.cy - side / 2, side };
}

/** Where a pointer drag of `dx`, `dy` screen pixels moves the centre, given the viewport size in screen pixels. */
export function dragToMove(
  dx: number,
  dy: number,
  c: Crop,
  w: number,
  h: number,
  viewport: number,
): { dx: number; dy: number } {
  const perScreenPixel = cropSide(w, h, c.turns, c.zoom) / viewport;
  // Dragging the picture right moves the centre left.
  return { dx: -dx * perScreenPixel, dy: -dy * perScreenPixel };
}

/** The file extension of what the browser could encode: WebP where it can, JPEG otherwise (older Safari). */
export type PhotoExt = 'webp' | 'jpg';

/** The member's own folder in the `member-photos` bucket: `<user id>/<token>.<ext>` and `<token>-128.<ext>`. */
export function memberPhotoPaths(userId: string, token: string, ext: PhotoExt = 'webp') {
  return { full: `${userId}/${token}.${ext}`, thumb: `${userId}/${token}-128.${ext}` };
}

/** The thumbnail that belongs to a stored photo path. */
export function thumbPathOf(path: string) {
  return path.replace(/\.(webp|jpg)$/, '-128.$1');
}
