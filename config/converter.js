'use strict';

const fs   = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Ramps ordered dark → light (index 0 = darkest pixel)
const CHARSETS = {
  block: '█▓▒░ ',
  dense: '@%#*+=-:. ',
  fade:  '█▓▒░· ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1[]?-_+~<>i!lI;:,^. ',
};

/**
 * Convert an image file to ASCII art string.
 *
 * @param {string} imagePath
 * @param {object} [opts]
 * @param {number}  [opts.width=60]
 * @param {string}  [opts.charset='dense']
 * @param {boolean} [opts.invert=false]
 * @returns {Promise<string>}
 */
async function imageToAscii(imagePath, opts = {}) {
  const {
    width   = 60,
    charset = 'block',
    invert  = false,
  } = opts;

  const chars = CHARSETS[charset] ?? CHARSETS.block;

  const image = await Jimp.read(imagePath);
  const { width: iw, height: ih } = image.bitmap;

  // Terminal chars are ~2x taller than wide — compensate aspect ratio
  const targetH = Math.max(1, Math.round(width * (ih / iw) * 0.45));

  image
    .greyscale()
    .normalize()
    .brightness(0.4) // Match the 200% brightness from the tool
    .contrast(0.9)   // Match the 200% contrast for super clean lines
    .resize(width, targetH, Jimp.RESIZE_BICUBIC);

  const n = chars.length;
  let result = '';
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      const { r } = Jimp.intToRGBA(image.getPixelColor(x, y));
      // 0=black → dense char, 255=white → space
      const t   = invert ? r / 255 : 1 - r / 255;
      const idx = Math.min(n - 1, Math.floor(t * n));
      result   += chars[idx];
    }
    result += '\n';
  }

  return result.trimEnd();
}

module.exports = { imageToAscii };

// ── CLI ───────────────────────────────────────────────────
// node src/ascii-convert.js <image> [width] [dense|block|fade|detailed] [invert]
if (require.main === module) {
  const args     = process.argv.slice(2);
  const KEYS     = ['dense', 'block', 'fade', 'detailed', 'invert'];
  const imgArg   = args.find(a => !KEYS.includes(a) && !/^\d+$/.test(a));
  const widthArg = args.find(a => /^\d+$/.test(a));
  const charset  = args.find(a => ['dense','block','fade','detailed'].includes(a)) ?? 'dense';
  const invert   = args.includes('invert');

  if (!imgArg) {
    console.error('Usage: node src/ascii-convert.js <image> [width] [dense|block|fade|detailed] [invert]');
    process.exit(1);
  }

  const imgPath = path.isAbsolute(imgArg)
    ? imgArg
    : path.resolve(process.cwd(), imgArg);

  if (!fs.existsSync(imgPath)) {
    console.error(`File not found: ${imgPath}`);
    process.exit(1);
  }

  const width = widthArg ? parseInt(widthArg, 10) : 165;

  imageToAscii(imgPath, { width, charset, invert }).then(art => {
    const outPath = imgPath.replace(/\.[^.]+$/, '') + '.txt';
    fs.writeFileSync(outPath, art, 'utf8');
    console.log(art);
    console.log(`\nSaved → ${outPath}`);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
