# ASCII Image Converter

Converts any image into ASCII art using block or symbol characters. Built on [Jimp](https://github.com/jimp-dev/jimp) for image processing.

---

## How It Works

1. **Load** the image with Jimp
2. **Greyscale** — strip all color information
3. **Normalize** — stretch the tonal range so the darkest pixel maps to black and the brightest to white
4. **Brightness +0.1** — slight lift to prevent crushed shadows
5. **Contrast +0.4** — punch up edges so faces and shapes read clearly (matches ~139% contrast on a CP437 tool)
6. **Resize** to the target width; height is auto-calculated with a `× 0.45` aspect-ratio correction because terminal characters are roughly twice as tall as they are wide
7. **Map each pixel** to a character — dark pixels → dense/heavy character, light pixels → sparse/space character

### Charsets

| Name    | Characters      | Description                                  |
|---------|-----------------|----------------------------------------------|
| `block` | `█▓▒░ `        | CP437-style gradient, default. Best for photos |
| `dense` | `@%#*+=- `     | Classic ASCII symbol ramp                    |
| `fade`  | `@#*+. `       | Minimal/subtle ramp                          |

---

## CLI Usage

```powershell
node src/ascii-convert.js <image> [width] [charset] [invert]
```

| Argument  | Required | Default | Description                          |
|-----------|----------|---------|--------------------------------------|
| `<image>` | Yes      | —       | Path to image file (`.jpg`, `.png`, etc.) |
| `[width]` | No       | `165`   | Output width in characters            |
| `[charset]`| No      | `dense` | `block`, `dense`, or `fade`           |
| `[invert]`| No       | off     | Invert dark/light mapping             |

### Examples

```powershell
# Default — 165 chars wide, dense charset
node src/ascii-convert.js assets/profilePic.jpg

# 80 chars wide with CP437 block shading
node src/ascii-convert.js assets/profilePic.jpg 80 block

# 120 chars, classic symbol ramp
node src/ascii-convert.js assets/profilePic.jpg 120 dense

# Inverted (dark background portrait)
node src/ascii-convert.js assets/profilePic.jpg 80 block invert

# Absolute path with spaces
node src/ascii-convert.js "C:\Users\me\Pictures\photo.jpg" 100 block
```

> The output is printed to the terminal **and** saved automatically as a `.txt` file next to the source image (e.g. `assets/profilePic.txt`).

---

## npm Script

A shortcut is available in `package.json`:

```powershell
npm run convert -- assets/profilePic.jpg 80 block
```

---

## Module Usage

You can also import the converter into your own Node.js code:

```js
const { imageToAscii } = require('./src/ascii-convert');

const art = await imageToAscii('assets/profilePic.jpg', {
  width:   80,
  charset: 'block',  // 'block' | 'dense' | 'fade'
  invert:  false,
});

console.log(art);
```

### `imageToAscii(imagePath, opts)` → `Promise<string>`

| Option    | Type    | Default   | Description                     |
|-----------|---------|-----------|---------------------------------|
| `width`   | number  | `60`      | Output width in characters      |
| `charset` | string  | `'block'` | Character ramp to use           |
| `invert`  | boolean | `false`   | Swap dark ↔ light mapping       |

---

## Inside the SSH Session

Once `node server.js` is running and you connect with:

```bash
ssh -p 2222 -o StrictHostKeyChecking=no localhost
```

You can run the converter directly from the terminal UI:

```
convert assets/profilePic.jpg 80 block
convert "C:\path with spaces\photo.jpg" 120 dense
```

The result is printed in the terminal and saved as a `.txt` file alongside the source image.

---

## Supported Formats

Jimp supports: `.jpg` / `.jpeg`, `.png`, `.bmp`, `.gif`, `.tiff`
