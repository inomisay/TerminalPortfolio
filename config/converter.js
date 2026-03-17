'use strict';

const fs   = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Ramps ordered dark → light (index 0 = darkest pixel)
const CHARSETS = {
  block: '█▓▒░ ',
  dense: '@%#*+=-:. ',
  fade:  '█▓▒░· ',
  punct: '|"\'., ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1[]?-_+~<>i!lI;:,^. ',
};

/**
 * Convert an image file to ASCII art string.
 *
 * @param {string} imagePath
 * @param {object} [opts]
 * @param {number}  [opts.width=60]
 * @param {string}  [opts.charset='dense']
 * @param {string}  [opts.chars]
 * @param {number}  [opts.brightness]
 * @param {number}  [opts.contrast]
 * @param {number}  [opts.gamma]
 * @param {boolean} [opts.invert=false]
 * @returns {Promise<string>}
 */
async function imageToAscii(imagePath, opts = {}) {
  const {
    width   = 60,
    charset = 'block',
    chars,
    brightness,
    contrast,
    gamma,
    invert  = false,
  } = opts;

  const ramp = (typeof chars === 'string' && chars.length >= 2)
    ? chars
    : (CHARSETS[charset] ?? CHARSETS.block);

  const image = await Jimp.read(imagePath);
  const { width: iw, height: ih } = image.bitmap;
  const isPunct = charset === 'punct' || ramp === CHARSETS.punct;
  const brightnessAdj = Number.isFinite(brightness) ? brightness : (isPunct ? 0.06 : 0.2);
  const contrastAdj = Number.isFinite(contrast) ? contrast : (isPunct ? 0.3 : 0.65);
  const gammaAdj = Number.isFinite(gamma) ? gamma : (isPunct ? 1.45 : 1.0);

  // Terminal chars are ~2x taller than wide — compensate aspect ratio
  const targetH = Math.max(1, Math.round(width * (ih / iw) * 0.45));

  image
    .greyscale()
    .normalize()
    .brightness(brightnessAdj)
    .contrast(contrastAdj)
    .resize(Math.max(1, Number(width) || 60), targetH, Jimp.RESIZE_BICUBIC);

  const n = ramp.length;
  let result = '';
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      const { r } = Jimp.intToRGBA(image.getPixelColor(x, y));
      // 0=black → dense char, 255=white → space
      const t0  = invert ? r / 255 : 1 - r / 255;
      const t   = Math.pow(t0, gammaAdj);
      const idx = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
      result   += ramp[idx];
    }
    result += '\n';
  }

  return result.trimEnd();
}

module.exports = { imageToAscii };

// ── CLI ───────────────────────────────────────────────────
// node config/converter.js <image> [width] [dense|block|fade|punct|detailed] [invert] [--out=<path>] [--chars=<ramp>] [--brightness=<n>] [--contrast=<n>] [--gamma=<n>]
if (require.main === module) {
  const args     = process.argv.slice(2);
  const KEYS     = ['dense', 'block', 'fade', 'punct', 'detailed', 'invert'];
  const outArg   = args.find(a => a.startsWith('--out='));
  const charsArg = args.find(a => a.startsWith('--chars='));
  const brightArg = args.find(a => a.startsWith('--brightness='));
  const contrastArg = args.find(a => a.startsWith('--contrast='));
  const gammaArg = args.find(a => a.startsWith('--gamma='));
  const imgArg   = args.find(a => !a.startsWith('--') && !KEYS.includes(a) && !/^\d+$/.test(a));
  const widthArg = args.find(a => /^\d+$/.test(a));
  const charset  = args.find(a => ['dense', 'block', 'fade', 'punct', 'detailed'].includes(a)) ?? 'dense';
  const invert   = args.includes('invert');
  const outPathArg = outArg ? outArg.slice('--out='.length) : null;
  const customChars = charsArg ? charsArg.slice('--chars='.length) : null;
  const brightness = brightArg ? parseFloat(brightArg.slice('--brightness='.length)) : undefined;
  const contrast = contrastArg ? parseFloat(contrastArg.slice('--contrast='.length)) : undefined;
  const gamma = gammaArg ? parseFloat(gammaArg.slice('--gamma='.length)) : undefined;

  if (!imgArg) {
    console.error('Usage: node config/converter.js <image> [width] [dense|block|fade|punct|detailed] [invert] [--out=<path>] [--chars=<ramp>] [--brightness=<n>] [--contrast=<n>] [--gamma=<n>]');
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

  imageToAscii(imgPath, { width, charset, chars: customChars, brightness, contrast, gamma, invert }).then(art => {
    const outPath = outPathArg
      ? (path.isAbsolute(outPathArg) ? outPathArg : path.resolve(process.cwd(), outPathArg))
      : imgPath.replace(/\.[^.]+$/, '') + '.txt';
    fs.writeFileSync(outPath, art, 'utf8');
    console.log(art);
    console.log(`\nSaved → ${outPath}`);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
