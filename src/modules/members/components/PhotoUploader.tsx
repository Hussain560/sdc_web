'use client';

import { CircleAlert, ShieldCheck } from 'lucide-react';
import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Alert, Avatar, Button, Dialog, ImageCropper, RadioGroup, useToast } from '@/components/ui';
import type { CroppedPhoto } from '@/components/ui/ImageCropper';
import { removeMyPhoto, uploadMyPhoto } from '../photo-actions';
import { PHOTO_COPY } from '../photo-copy';
import { checkPhotoFile, type PhotoProblem } from '../photo';

type Lang = 'ar' | 'en';
type Step = 'idle' | 'crop' | 'consent' | 'uploading';
type Problem = PhotoProblem | 'offline' | 'server';

/**
 * Profile photo: choose or drop a picture, crop it, answer the consent question once (at the first upload), save.
 * The editor owns the "show my photo" switch; this component only reports what happened through `onSaved`.
 */
export function PhotoUploader({
  lang,
  name,
  photoUrl,
  onSaved,
  savedText,
  removedText,
}: {
  lang: Lang;
  name: string;
  /** The member's current photo (address of the 512 px file), or null. */
  photoUrl: string | null;
  /** Called with the new address (null when removed) and the consent answer when it was just given. */
  onSaved: (url: string | null, shown?: boolean) => void;
  /** Toast text after a save, for example "Photo saved. Your profile is 80 % complete." */
  savedText: string;
  removedText: string;
}) {
  const t = PHOTO_COPY[lang];
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [cropped, setCropped] = useState<CroppedPhoto | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [show, setShow] = useState<'yes' | 'no'>('yes');
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setStep('idle');
    setFile(null);
    setCropped(null);
  };

  const pick = useCallback((f: File | undefined | null) => {
    if (!f) return;
    const problem = checkPhotoFile(f);
    if (problem) {
      setProblems([problem]);
      return;
    }
    setProblems([]);
    setFile(f);
    setStep('crop');
  }, []);

  const upload = async (photo: CroppedPhoto, shown: boolean | undefined) => {
    setStep('uploading');
    const form = new FormData();
    form.set('full', new File([photo.full], `photo.${photo.ext}`, { type: photo.full.type }));
    form.set('thumb', new File([photo.thumb], `thumb.${photo.ext}`, { type: photo.thumb.type }));
    if (shown !== undefined) form.set('show', String(shown));
    try {
      const r = await uploadMyPhoto(form, { lang });
      if (!r.ok) {
        setProblems([
          r.code === 'FILE_TOO_LARGE' ? 'size' : r.code === 'FILE_TYPE' ? 'type' : 'server',
        ]);
        reset();
        return;
      }
      toast.success(savedText);
      onSaved(r.data.url, shown);
      reset();
    } catch {
      setProblems(['offline']);
      reset();
    }
  };

  const confirmCrop = (photo: CroppedPhoto) => {
    setCropped(photo);
    // Ask about showing the photo once: only when there is no photo yet (the first upload, or after a removal).
    if (photoUrl) void upload(photo, undefined);
    else setStep('consent');
  };

  const remove = async () => {
    setRemoving(true);
    try {
      const r = await removeMyPhoto({ lang });
      if (r.ok) {
        toast.success(removedText);
        onSaved(null);
      } else toast.error(r.message);
    } catch {
      setProblems(['offline']);
    } finally {
      setRemoving(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const label: Record<Problem, [string, string?]> = {
    size: [t.tooLarge, t.tooLargeHint],
    type: [t.wrongType, t.wrongTypeHint],
    offline: [t.offline],
    server: [t.offline],
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col gap-4 rounded-shape-lg border-2 border-dashed p-1 transition-colors ${dragging ? 'border-accent bg-accent-soft' : 'border-transparent'}`}
    >
      <div className="flex flex-wrap items-center gap-5">
        <Avatar
          name={name}
          src={photoUrl}
          alt={photoUrl ? t.photoOf(name) : undefined}
          size={120}
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => input.current?.click()}>
              {photoUrl ? t.change : t.choose}
            </Button>
            {photoUrl && (
              <Button type="button" variant="ghost" loading={removing} onClick={remove}>
                {removing ? t.removing : t.remove}
              </Button>
            )}
          </div>
          <p className="t-body-sm text-muted">
            {t.formats} {t.drop}
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {problems.length > 0 && (
        <Alert tone="danger" title={t.errorsTitle}>
          <ul className="flex flex-col gap-2">
            {problems.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>{label[p][0]}</strong>
                  {label[p][1] && <span className="block text-muted">{label[p][1]}</span>}
                  {(p === 'offline' || p === 'server') && cropped && (
                    <button
                      type="button"
                      className="mt-1 font-semibold underline"
                      onClick={() => {
                        setProblems([]);
                        void upload(cropped, undefined);
                      }}
                    >
                      {t.retry}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <Dialog
        open={step === 'crop' && !!file}
        // The browser also fires close when this dialog is closed to move on to the next step: only a close
        // while this step is showing means the person abandoned the flow.
        onClose={() => step === 'crop' && reset()}
        title={t.cropTitle}
        size="md"
        closeLabel={t.close}
      >
        {file && (
          <ImageCropper
            file={file}
            texts={t.crop}
            onConfirm={confirmCrop}
            onAnother={() => {
              reset();
              input.current?.click();
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={step === 'consent'}
        onClose={() => step === 'consent' && reset()}
        title={t.consentTitle}
        description={t.consentIntro}
        closeLabel={t.close}
        footer={
          <Button type="button" onClick={() => cropped && upload(cropped, show === 'yes')}>
            {t.consentContinue}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <RadioGroup
            legend={t.consentTitle}
            value={show}
            onChange={setShow}
            options={[
              { value: 'yes', label: t.consentYes, hint: t.consentYesHint },
              { value: 'no', label: t.consentNo, hint: t.consentNoHint },
            ]}
          />
          <p className="t-body-sm flex items-start gap-2 rounded-shape-sm bg-surface-raised p-3 text-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t.consentPrivacy}
          </p>
        </div>
      </Dialog>

      <Dialog
        open={step === 'uploading'}
        onClose={() => {}}
        title={t.uploading}
        description={t.uploadingHint}
        busy
      >
        <div role="status" aria-live="polite" className="sr-only">
          {t.uploading}
        </div>
      </Dialog>
    </div>
  );
}
