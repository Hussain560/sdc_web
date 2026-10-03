import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The attendance certificate (A4 landscape), in the light-theme palette of the site: paper = canvas, ink = text,
 * green = accent. PDF colours cannot use CSS variables, so the values are the documented light-theme tokens.
 * Arabic is set with IBM Plex Sans Arabic (shaped and right-to-left by the PDF engine); Latin text uses Inter.
 */
const PAPER = '#f4faf6';
const INK = '#123b35';
const MUTED = '#52766c';
const GREEN = '#0b8f55';

const assets = (...p: string[]) => path.join(process.cwd(), 'public', 'assets', ...p);

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({
    family: 'PlexArabic',
    fonts: [
      {
        src: assets('font', 'IBM_Plex_Sans_Arabic', 'IBMPlexSansArabic-Regular.ttf'),
        fontWeight: 400,
      },
      {
        src: assets('font', 'IBM_Plex_Sans_Arabic', 'IBMPlexSansArabic-Bold.ttf'),
        fontWeight: 700,
      },
    ],
  });
  Font.register({
    family: 'InterPdf',
    fonts: [
      { src: assets('font', 'Inter', 'static', 'Inter_18pt-Regular.ttf'), fontWeight: 400 },
      { src: assets('font', 'Inter', 'static', 'Inter_18pt-SemiBold.ttf'), fontWeight: 600 },
    ],
  });
  // Never hyphenate: Arabic words must not be split.
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

const styles = StyleSheet.create({
  page: { backgroundColor: PAPER, padding: 28, fontFamily: 'PlexArabic', color: INK },
  frame: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: GREEN,
    padding: 26,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 150, height: 64, objectFit: 'contain' },
  title: { fontSize: 34, fontWeight: 700, color: GREEN, textAlign: 'center' },
  titleEn: {
    fontSize: 13,
    fontFamily: 'InterPdf',
    color: MUTED,
    textAlign: 'center',
    marginTop: 2,
  },
  lead: { fontSize: 15, textAlign: 'center', color: MUTED },
  name: { fontSize: 32, fontWeight: 700, textAlign: 'center', marginTop: 6 },
  rule: { width: 160, height: 1.5, backgroundColor: GREEN, marginTop: 8, marginBottom: 8 },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 1.6, maxWidth: 560 },
  event: { fontSize: 22, fontWeight: 700, textAlign: 'center', marginTop: 4, maxWidth: 600 },
  facts: { fontSize: 13, textAlign: 'center', color: MUTED, marginTop: 6 },
  footer: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  verify: { alignItems: 'flex-start', maxWidth: 520 },
  verifyLabel: { fontSize: 10, color: MUTED },
  verifyId: { fontSize: 9, fontFamily: 'InterPdf', color: INK, marginTop: 2 },
  verifyUrl: { fontSize: 9, fontFamily: 'InterPdf', color: GREEN, marginTop: 2 },
  qr: { width: 64, height: 64 },
});

export type CertificateData = {
  id: string;
  recipientName: string;
  titleAr: string;
  titleEn: string | null;
  dateAr: string;
  dateEn: string;
  percent: number;
  sessionsAttended: number;
  sessionsExpected: number;
  verifyUrl: string;
  /** PNG data URL of the verification QR code. */
  qrDataUrl: string;
};

export function CertificateDocument({ c }: { c: CertificateData }) {
  registerFonts();
  // Read as a buffer: a path string is not always resolved by the PDF image loader in server runtimes.
  const logo = { data: readFileSync(assets('navbar.png')), format: 'png' as const };
  return (
    <Document title={`Certificate ${c.id}`} author="Saudi Developer Community">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={{ alignItems: 'center' }}>
            <Image src={logo} style={styles.logo} />
            <Text style={[styles.title, { marginTop: 8 }]}>شهادة حضور</Text>
            <Text style={styles.titleEn}>Certificate of attendance</Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.lead}>تشهد المجتمع السعودي للمطورين بأن</Text>
            <Text style={styles.name}>{c.recipientName}</Text>
            <View style={styles.rule} />
            <Text style={styles.body}>قد أتمّ حضور فعالية</Text>
            <Text style={styles.event}>{c.titleAr}</Text>
            <Text style={styles.facts}>التاريخ: {c.dateAr}</Text>
            <Text style={styles.facts}>
              نسبة الحضور: {c.percent}٪ — حضر {c.sessionsAttended} من {c.sessionsExpected} جلسات
            </Text>
            {c.titleEn ? (
              <Text style={[styles.titleEn, { marginTop: 10 }]}>
                {c.titleEn} — {c.dateEn} — {c.percent}%
              </Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Image src={c.qrDataUrl} style={styles.qr} />
            <View style={styles.verify}>
              <Text style={styles.verifyLabel}>
                للتحقق من صحة الشهادة · Verify this certificate
              </Text>
              <Text style={styles.verifyId}>{c.id}</Text>
              <Text style={styles.verifyUrl}>{c.verifyUrl}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
