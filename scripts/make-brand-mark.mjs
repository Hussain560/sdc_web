// Turns the brand emblem (white background) into a transparent PNG for the site: `node scripts/make-brand-mark.mjs <src.png>`.
import sharp from 'sharp';

const [src, out = 'public/assets/brand/sdc-mark.png'] = process.argv.slice(2);
if (!src) {
  console.error('Usage: node scripts/make-brand-mark.mjs <emblem.png> [out.png]');
  process.exit(1);
}
const { data, info } = await sharp(src)
  .trim({ threshold: 20 })
  .resize({ height: 512 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2; // near white becomes transparent, edges are feathered
  const alpha = Math.max(0, Math.min(255, (240 - lightness) * 6));
  data[i + 3] = Math.min(255, alpha);
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(out);
console.log(`wrote ${out} ${info.width}x${info.height}`);
