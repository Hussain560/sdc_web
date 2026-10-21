'use client';

import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  PHOTO_SIZE,
  THUMB_SIZE,
  cropReducer,
  dragToMove,
  initialCrop,
  sourceRect,
  turnedSize,
  type Crop,
  type PhotoExt,
} from '@/modules/members/photo';
import { Button } from './Button';
import { cn } from './cn';

export type CropTexts = {
  /** Explains what to do, for example "Drag the picture so your face is inside the circle". */
  instructions: string;
  zoom: string;
  zoomIn: string;
  zoomOut: string;
  rotate: string;
  /** "Keyboard: arrows move, + and - zoom, R rotates". */
  keys: string;
  use: string;
  another: string;
  /** Shown when the picture cannot be read. */
  unreadable: string;
};

export type CroppedPhoto = { full: Blob; thumb: Blob; ext: PhotoExt };

type Loaded = { img: HTMLImageElement; w: number; h: number };

function loadImage(url: string): Promise<Loaded> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('unreadable'));
    img.src = url;
  });
}

/** The picture drawn onto a canvas after `turns` quarter turns clockwise. */
function turnedCanvas(l: Loaded, turns: number): HTMLCanvasElement | null {
  const c = document.createElement('canvas');
  const t = turnedSize(l.w, l.h, turns as 0 | 1 | 2 | 3);
  c.width = t.w;
  c.height = t.h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.translate(t.w / 2, t.h / 2);
  ctx.rotate((turns * Math.PI) / 2);
  ctx.drawImage(l.img, -l.w / 2, -l.h / 2);
  return c;
}

const encode = (canvas: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));

/** Square copy of the visible area at `size` px, WebP where the browser can encode it, JPEG otherwise. */
async function exportSquare(
  turned: HTMLCanvasElement,
  crop: Crop,
  w: number,
  h: number,
  size: number,
): Promise<{ blob: Blob; ext: PhotoExt } | null> {
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  const r = sourceRect(crop, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(turned, r.x, r.y, r.side, r.side, 0, 0, size, size);
  const webp = await encode(out, 'image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  const jpg = await encode(out, 'image/jpeg', 0.88);
  return jpg ? { blob: jpg, ext: 'jpg' } : null;
}

/**
 * Crop a profile picture (Sprint 17, MEM-012). The picture shows through a circle; drag to move, the slider or the
 * buttons to zoom, the round button to turn. Keyboard: arrows move, + and - zoom, R turns. On "use" the browser
 * makes a 512 px square and a 128 px thumbnail; nothing leaves the device before that.
 */
export function ImageCropper({
  file,
  texts,
  busy,
  onConfirm,
  onAnother,
  onUnreadable,
}: {
  file: File;
  texts: CropTexts;
  busy?: boolean;
  onConfirm: (photo: CroppedPhoto) => void;
  onAnother: () => void;
  onUnreadable?: () => void;
}) {
  const id = useId();
  const view = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dims = loaded ?? { w: 1, h: 1 };
  const [crop, dispatch] = useReducer(
    (s: Crop, a: Parameters<typeof cropReducer>[1]) => cropReducer(s, a, dims.w, dims.h),
    initialCrop(1, 1),
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    let live = true;
    loadImage(url)
      .then((l) => {
        if (!live) return;
        setLoaded(l);
        dispatch({ type: 'reset' });
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        onUnreadable?.();
      });
    return () => {
      live = false;
      URL.revokeObjectURL(url);
    };
  }, [file, onUnreadable]);

  // The turned picture is rebuilt only when it is turned, then reused for the preview and the export.
  const turned = useMemo(
    () => (loaded ? turnedCanvas(loaded, crop.turns) : null),
    [loaded, crop.turns],
  );

  // Draw the visible square into the preview canvas at its real pixel size.
  useEffect(() => {
    const canvas = view.current;
    if (!canvas || !loaded || !turned) return;
    const px = Math.max(
      1,
      Math.round((box.current?.clientWidth ?? 320) * (window.devicePixelRatio || 1)),
    );
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = sourceRect(crop, loaded.w, loaded.h);
    ctx.clearRect(0, 0, px, px);
    ctx.drawImage(turned, r.x, r.y, r.side, r.side, 0, 0, px, px);
  }, [crop, loaded, turned]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !loaded) return;
    const size = box.current?.clientWidth ?? 320;
    const m = dragToMove(
      e.clientX - drag.current.x,
      e.clientY - drag.current.y,
      crop,
      loaded.w,
      loaded.h,
      size,
    );
    drag.current = { x: e.clientX, y: e.clientY };
    dispatch({ type: 'move', ...m });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!loaded) return;
    const step =
      (Math.min(
        turnedSize(loaded.w, loaded.h, crop.turns).w,
        turnedSize(loaded.w, loaded.h, crop.turns).h,
      ) /
        crop.zoom) *
      0.05;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const mv = moves[e.key];
    if (mv) {
      e.preventDefault();
      dispatch({ type: 'move', dx: mv[0], dy: mv[1] });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      dispatch({ type: 'zoomBy', delta: 0.1 });
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      dispatch({ type: 'zoomBy', delta: -0.1 });
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      dispatch({ type: 'rotate' });
    }
  };

  const confirm = useCallback(async () => {
    if (!loaded || !turned) return;
    setExporting(true);
    try {
      const full = await exportSquare(turned, crop, loaded.w, loaded.h, PHOTO_SIZE);
      const thumb = await exportSquare(turned, crop, loaded.w, loaded.h, THUMB_SIZE);
      if (!full || !thumb) {
        setFailed(true);
        return;
      }
      onConfirm({ full: full.blob, thumb: thumb.blob, ext: full.ext });
    } finally {
      setExporting(false);
    }
  }, [crop, loaded, onConfirm, turned]);

  if (failed) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="t-body text-danger">
          {texts.unreadable}
        </p>
        <Button type="button" variant="secondary" onClick={onAnother}>
          {texts.another}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p id={`${id}-help`} className="t-body-sm text-muted">
        {texts.instructions}
      </p>

      <div
        ref={box}
        role="group"
        tabIndex={0}
        aria-label={texts.instructions}
        aria-describedby={`${id}-keys`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative mx-auto aspect-square w-[min(100%,26rem,44dvh)] cursor-grab touch-none overflow-hidden rounded-shape-lg bg-accent-soft select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:cursor-grabbing"
      >
        <canvas ref={view} aria-hidden="true" className="absolute inset-0 size-full" />
        {/* The circle: everything outside it is dimmed, a thin grid helps to place the face. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[6%] rounded-full border-2 border-text shadow-[0_0_0_999px_color-mix(in_srgb,var(--canvas)_55%,transparent)]"
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-y-0 start-1/3 w-px bg-text/25" />
            <div className="absolute inset-y-0 start-2/3 w-px bg-text/25" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-text/25" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-text/25" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'rotate' })}
          aria-label={texts.rotate}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <RotateCw aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'zoomBy', delta: -0.25 })}
          aria-label={texts.zoomOut}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <ZoomOut aria-hidden="true" className="size-5" />
        </button>
        <input
          type="range"
          aria-label={texts.zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => dispatch({ type: 'zoom', zoom: Number(e.target.value) })}
          className={cn('h-11 min-w-0 flex-1 accent-(--accent)')}
        />
        <button
          type="button"
          onClick={() => dispatch({ type: 'zoomBy', delta: 0.25 })}
          aria-label={texts.zoomIn}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <ZoomIn aria-hidden="true" className="size-5" />
        </button>
      </div>
      <p id={`${id}-keys`} className="t-body-sm text-muted max-sm:hidden">
        {texts.keys}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 *:max-sm:w-full">
        <Button
          type="button"
          loading={exporting || busy}
          disabled={!loaded || !turned}
          onClick={confirm}
        >
          {texts.use}
        </Button>
        <Button type="button" variant="ghost" onClick={onAnother} disabled={exporting || busy}>
          {texts.another}
        </Button>
      </div>
    </div>
  );
}
