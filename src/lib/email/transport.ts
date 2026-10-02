import 'server-only';
import nodemailer from 'nodemailer';

export type MailMessage = { to: string; subject: string; html: string; text: string };
export type MailResult = { provider: string; messageId: string | null };

const FROM = () => process.env.EMAIL_FROM ?? 'المجتمع السعودي للمطورين <no-reply@sdc.example>';

function parseFrom(from: string): { Email: string; Name: string } {
  const m = /^(.*)<([^>]+)>\s*$/.exec(from);
  return m
    ? { Name: m[1]!.trim().replace(/^"|"$/g, ''), Email: m[2]!.trim() }
    : { Name: '', Email: from };
}

/**
 * Provider adapter (docs/11-modules/notifications). EMAIL_TRANSPORT picks the provider:
 * mailpit (local HTTP API), smtp (hosted, SMTP_URL) or log (print only). Throws on failure; callers record it.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  const mode = process.env.EMAIL_TRANSPORT ?? 'mailpit';

  if (mode === 'log') {
    console.info(`[email:log] to=${msg.to} subject=${msg.subject}`);
    return { provider: 'log', messageId: null };
  }

  if (mode === 'smtp') {
    const url = process.env.SMTP_URL;
    if (!url) throw new Error('SMTP_URL is not set');
    const info = await nodemailer.createTransport(url).sendMail({
      from: FROM(),
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return { provider: 'smtp', messageId: info.messageId ?? null };
  }

  const base = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';
  const res = await fetch(`${base}/api/v1/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      From: parseFrom(FROM()),
      To: [{ Email: msg.to }],
      Subject: msg.subject,
      HTML: msg.html,
      Text: msg.text,
    }),
  });
  if (!res.ok) throw new Error(`mailpit responded ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as { ID?: string };
  return { provider: 'mailpit', messageId: body.ID ?? null };
}
