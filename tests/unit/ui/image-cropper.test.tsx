import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageCropper, type CropTexts } from '@/components/ui/ImageCropper';

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

const texts: CropTexts = {
  instructions: 'Drag the picture so your face is inside the circle',
  zoom: 'Zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  rotate: 'Rotate',
  keys: 'Arrows move, plus and minus zoom, R rotates',
  use: 'Use photo',
  another: 'Choose another',
  unreadable: 'This picture cannot be read',
};

const ctx = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  imageSmoothingQuality: 'high',
};

function stubImage(ok: boolean) {
  class FakeImage {
    naturalWidth = 1600;
    naturalHeight = 1200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      queueMicrotask(() => (ok ? this.onload?.() : this.onerror?.()));
    }
  }
  vi.stubGlobal('Image', FakeImage);
}

beforeEach(() => {
  vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    cb(new Blob(['x'], { type: type ?? 'image/png' }));
  };
});
afterEach(() => vi.unstubAllGlobals());

const file = new File(['x'], 'me.png', { type: 'image/png' });

describe('ImageCropper', () => {
  it('shows the instructions, the controls and the keyboard help', async () => {
    stubImage(true);
    render(<ImageCropper file={file} texts={texts} onConfirm={() => {}} onAnother={() => {}} />);
    expect(screen.getAllByText(texts.instructions).length).toBeGreaterThan(0);
    expect(screen.getByRole('slider', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rotate' })).toBeInTheDocument();
    expect(screen.getByText(texts.keys)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
  });

  it('zooms with the plus key and the buttons', async () => {
    stubImage(true);
    const user = userEvent.setup();
    render(<ImageCropper file={file} texts={texts} onConfirm={() => {}} onAnother={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
    const slider = screen.getByRole('slider', { name: 'Zoom' }) as HTMLInputElement;
    expect(Number(slider.value)).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(Number(slider.value)).toBeCloseTo(1.25);
    screen.getByRole('group').focus();
    await user.keyboard('+');
    expect(Number(slider.value)).toBeCloseTo(1.35);
    await user.keyboard('-');
    expect(Number(slider.value)).toBeCloseTo(1.25);
  });

  it('never zooms out below 1 or in above 4', async () => {
    stubImage(true);
    const user = userEvent.setup();
    render(<ImageCropper file={file} texts={texts} onConfirm={() => {}} onAnother={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
    const slider = screen.getByRole('slider', { name: 'Zoom' }) as HTMLInputElement;
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(Number(slider.value)).toBe(1);
    for (let i = 0; i < 20; i++) await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(Number(slider.value)).toBe(4);
  });

  it('hands back a 512 px photo and a thumbnail when the person confirms', async () => {
    stubImage(true);
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ImageCropper file={file} texts={texts} onConfirm={onConfirm} onAnother={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    const out = onConfirm.mock.calls[0]![0];
    expect(out.full).toBeInstanceOf(Blob);
    expect(out.thumb).toBeInstanceOf(Blob);
    expect(['webp', 'jpg']).toContain(out.ext);
  });

  it('lets the person choose another picture', async () => {
    stubImage(true);
    const user = userEvent.setup();
    const onAnother = vi.fn();
    render(<ImageCropper file={file} texts={texts} onConfirm={() => {}} onAnother={onAnother} />);
    await user.click(screen.getByRole('button', { name: 'Choose another' }));
    expect(onAnother).toHaveBeenCalledOnce();
  });

  it('says so when the picture cannot be read', async () => {
    stubImage(false);
    const onUnreadable = vi.fn();
    render(
      <ImageCropper
        file={file}
        texts={texts}
        onConfirm={() => {}}
        onAnother={() => {}}
        onUnreadable={onUnreadable}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('This picture cannot be read');
    expect(onUnreadable).toHaveBeenCalled();
  });
});
