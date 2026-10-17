import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui';
import { PhotoUploader } from '@/modules/members/components/PhotoUploader';

const actions = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn() }));
vi.mock('@/modules/members/photo-actions', () => ({
  uploadMyPhoto: actions.upload,
  removeMyPhoto: actions.remove,
}));
vi.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }));
vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

const ctx = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  imageSmoothingQuality: 'high',
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

beforeEach(() => {
  actions.upload.mockReset();
  actions.remove.mockReset();
  class FakeImage {
    naturalWidth = 1600;
    naturalHeight = 1200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    cb(new Blob(['x'], { type: type ?? 'image/png' }));
  };
});
afterEach(() => vi.unstubAllGlobals());

const png = () => new File(['x'], 'me.png', { type: 'image/png' });

function setup(props: { photoUrl?: string | null } = {}) {
  const onSaved = vi.fn();
  const view = render(
    <ToastProvider>
      <PhotoUploader
        lang="en"
        name="Sara Alotaibi"
        photoUrl={props.photoUrl ?? null}
        onSaved={onSaved}
        savedText="Photo saved. Your profile is 80 % complete."
        removedText="Photo removed."
      />
    </ToastProvider>,
  );
  const fileInput = view.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { onSaved, fileInput, ...view };
}

const ok = {
  ok: true,
  data: { path: 'u/t.webp', url: 'https://x/u/t.webp', thumbUrl: 'https://x/u/t-128.webp' },
};

describe('PhotoUploader', () => {
  it('refuses a picture over 2 MB with a reason and a way out', async () => {
    const user = userEvent.setup();
    const { fileInput } = setup();
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    await user.upload(fileInput, big);
    expect(await screen.findByText('The picture is larger than 2 MB')).toBeInTheDocument();
    expect(screen.getByText(/smaller picture/)).toBeInTheDocument();
    expect(actions.upload).not.toHaveBeenCalled();
  });

  it('refuses a file type that is not JPG, PNG or WebP', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { fileInput } = setup();
    await user.upload(fileInput, new File(['x'], 'a.gif', { type: 'image/gif' }));
    expect(await screen.findByText('This file type is not supported')).toBeInTheDocument();
    expect(screen.getByText('We accept JPG, PNG and WebP only.')).toBeInTheDocument();
  });

  it('asks about showing the photo on the first upload, then saves with the answer', async () => {
    actions.upload.mockResolvedValue(ok);
    const user = userEvent.setup();
    const { fileInput, onSaved } = setup();
    await user.upload(fileInput, png());
    await user.click(await screen.findByRole('button', { name: 'Use photo' }));
    const ask = await screen.findByRole('dialog', { name: 'Show your photo to visitors?' });
    expect(within(ask).getByRole('radio', { name: /Yes, show it/ })).toBeChecked();
    await user.click(within(ask).getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(actions.upload).toHaveBeenCalledOnce());
    const form = actions.upload.mock.calls[0]![0] as FormData;
    expect(form.get('show')).toBe('true');
    expect(form.get('full')).toBeInstanceOf(File);
    expect(form.get('thumb')).toBeInstanceOf(File);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('https://x/u/t.webp', true));
    expect(
      await screen.findByText('Photo saved. Your profile is 80 % complete.'),
    ).toBeInTheDocument();
  });

  it('saves "no" when the member keeps the photo private', async () => {
    actions.upload.mockResolvedValue(ok);
    const user = userEvent.setup();
    const { fileInput, onSaved } = setup();
    await user.upload(fileInput, png());
    await user.click(await screen.findByRole('button', { name: 'Use photo' }));
    const ask = await screen.findByRole('dialog', { name: 'Show your photo to visitors?' });
    await user.click(within(ask).getByRole('radio', { name: /No, use it inside/ }));
    await user.click(within(ask).getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('https://x/u/t.webp', false));
    expect((actions.upload.mock.calls[0]![0] as FormData).get('show')).toBe('false');
  });

  it('does not ask again when the member already has a photo', async () => {
    actions.upload.mockResolvedValue(ok);
    const user = userEvent.setup();
    const { fileInput, onSaved } = setup({ photoUrl: 'https://x/old.webp' });
    await user.upload(fileInput, png());
    await user.click(await screen.findByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(actions.upload).toHaveBeenCalledOnce());
    expect((actions.upload.mock.calls[0]![0] as FormData).get('show')).toBeNull();
    expect(
      screen.queryByRole('dialog', { name: 'Show your photo to visitors?' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows the server refusal as an upload error', async () => {
    actions.upload.mockResolvedValue({ ok: false, code: 'FILE_TOO_LARGE', message: 'big' });
    const user = userEvent.setup();
    const { fileInput } = setup({ photoUrl: 'https://x/old.webp' });
    await user.upload(fileInput, png());
    await user.click(await screen.findByRole('button', { name: 'Use photo' }));
    expect(await screen.findByText('The picture is larger than 2 MB')).toBeInTheDocument();
  });

  it('offers a retry when the connection drops', async () => {
    actions.upload.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(ok);
    const user = userEvent.setup();
    const { fileInput } = setup({ photoUrl: 'https://x/old.webp' });
    await user.upload(fileInput, png());
    await user.click(await screen.findByRole('button', { name: 'Use photo' }));
    expect(await screen.findByText('The connection dropped')).toBeInTheDocument();
  });

  it('removes the photo', async () => {
    actions.remove.mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    const { onSaved } = setup({ photoUrl: 'https://x/old.webp' });
    await user.click(screen.getByRole('button', { name: 'Remove photo' }));
    await waitFor(() => expect(actions.remove).toHaveBeenCalledOnce());
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(null));
  });

  it('shows "Choose a photo" without a photo and "Change photo" with one', () => {
    const a = setup();
    expect(screen.getByRole('button', { name: 'Choose a photo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument();
    a.unmount();
    setup({ photoUrl: 'https://x/old.webp' });
    expect(screen.getByRole('button', { name: 'Change photo' })).toBeInTheDocument();
  });
});
