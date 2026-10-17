import { describe, expect, it } from 'vitest';
import {
  checkPhotoFile,
  clampCrop,
  cropReducer,
  cropSide,
  dragToMove,
  initialCrop,
  sniffImageType,
  memberPhotoPaths,
  sourceRect,
  thumbPathOf,
  turnedSize,
  type Crop,
} from '@/modules/members/photo';

describe('photo file checks', () => {
  it('accepts JPG, PNG and WebP up to 2 MB', () => {
    expect(checkPhotoFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(checkPhotoFile({ type: 'image/png', size: 2 * 1024 * 1024 })).toBeNull();
    expect(checkPhotoFile({ type: 'image/webp', size: 10 })).toBeNull();
  });

  it('rejects other types before looking at the size', () => {
    expect(checkPhotoFile({ type: 'image/gif', size: 99_000_000 })).toBe('type');
    expect(checkPhotoFile({ type: 'application/pdf', size: 10 })).toBe('type');
  });

  it('rejects a picture over 2 MB', () => {
    expect(checkPhotoFile({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toBe('size');
  });
});

describe('crop maths', () => {
  const W = 1600;
  const H = 1200;

  it('starts centred and showing the shorter side', () => {
    const c = initialCrop(W, H);
    expect(c).toEqual({ zoom: 1, cx: 800, cy: 600, turns: 0 });
    expect(cropSide(W, H, 0, 1)).toBe(1200);
    expect(sourceRect(c, W, H)).toEqual({ x: 200, y: 0, side: 1200 });
  });

  it('zooming halves the visible side', () => {
    expect(cropSide(W, H, 0, 2)).toBe(600);
    expect(cropSide(W, H, 0, 4)).toBe(300);
  });

  it('keeps the zoom between 1 and 4', () => {
    const c = initialCrop(W, H);
    expect(cropReducer(c, { type: 'zoom', zoom: 9 }, W, H).zoom).toBe(4);
    expect(cropReducer(c, { type: 'zoom', zoom: 0.2 }, W, H).zoom).toBe(1);
  });

  it('never lets the square leave the picture', () => {
    const c = cropReducer(initialCrop(W, H), { type: 'zoom', zoom: 2 }, W, H);
    const far = cropReducer(c, { type: 'move', dx: 99_999, dy: -99_999 }, W, H);
    const r = sourceRect(far, W, H);
    expect(r.x + r.side).toBeLessThanOrEqual(W);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y + r.side).toBeLessThanOrEqual(H);
  });

  it('a square picture can only zoom, not move, at zoom 1', () => {
    const c = initialCrop(1000, 1000);
    expect(cropReducer(c, { type: 'move', dx: 50, dy: 50 }, 1000, 1000)).toEqual(c);
  });

  it('turns by quarters and swaps the picture size', () => {
    expect(turnedSize(W, H, 1)).toEqual({ w: H, h: W });
    expect(turnedSize(W, H, 2)).toEqual({ w: W, h: H });
    let c: Crop = initialCrop(W, H);
    c = cropReducer(c, { type: 'rotate' }, W, H);
    expect(c.turns).toBe(1);
    // After a quarter turn the picture is 1200 wide and 1600 tall, so the square is centred on that.
    expect(c.cx).toBeCloseTo(600);
    expect(c.cy).toBeCloseTo(800);
    for (let i = 0; i < 3; i++) c = cropReducer(c, { type: 'rotate' }, W, H);
    expect(c.turns).toBe(0);
    expect(c.cx).toBeCloseTo(800);
    expect(c.cy).toBeCloseTo(600);
  });

  it('keeps an off-centre point while turning, then clamps it', () => {
    let c = cropReducer(initialCrop(W, H), { type: 'zoom', zoom: 2 }, W, H);
    c = cropReducer(c, { type: 'move', dx: 300, dy: 100 }, W, H);
    const turned = cropReducer(c, { type: 'rotate' }, W, H);
    const t = turnedSize(W, H, 1);
    const r = sourceRect(turned, W, H);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.side).toBeLessThanOrEqual(t.w);
    expect(r.y + r.side).toBeLessThanOrEqual(t.h);
  });

  it('reset goes back to the start', () => {
    const c = cropReducer(initialCrop(W, H), { type: 'zoom', zoom: 3 }, W, H);
    expect(cropReducer(c, { type: 'reset' }, W, H)).toEqual(initialCrop(W, H));
  });

  it('clampCrop fixes an out-of-range crop', () => {
    const c = clampCrop({ zoom: 10, cx: -50, cy: 5000, turns: 0 }, W, H);
    expect(c.zoom).toBe(4);
    expect(c.cx).toBe(150);
    expect(c.cy).toBe(1050);
  });
});

describe('dragging', () => {
  it('dragging the picture right moves the centre left, scaled by zoom', () => {
    const c: Crop = { zoom: 2, cx: 800, cy: 600, turns: 0 };
    // side 600 px of picture shown in a 300 px viewport: 2 picture pixels per screen pixel.
    expect(dragToMove(30, -10, c, 1600, 1200, 300)).toEqual({ dx: -60, dy: 20 });
  });
});

describe('storage paths', () => {
  it('keeps both files in the member folder and finds the thumbnail', () => {
    const p = memberPhotoPaths('user-1', 'abc');
    expect(p.full).toBe('user-1/abc.webp');
    expect(p.thumb).toBe('user-1/abc-128.webp');
    expect(thumbPathOf(p.full)).toBe(p.thumb);
    const j = memberPhotoPaths('user-1', 'abc', 'jpg');
    expect(j.full).toBe('user-1/abc.jpg');
    expect(thumbPathOf(j.full)).toBe('user-1/abc-128.jpg');
  });
});

describe('sniffImageType', () => {
  const bytes = (...b: number[]) => new Uint8Array(b);
  it('knows JPEG, PNG and WebP by their first bytes', () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d))).toBe('image/png');
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe(
      'image/webp',
    );
  });
  it('refuses everything else, including a renamed file', () => {
    expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull();
    expect(sniffImageType(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
    // a RIFF container that is not WebP (for example WAV)
    expect(
      sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45)),
    ).toBeNull();
  });
});
