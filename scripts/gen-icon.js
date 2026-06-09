// Dependency-free app-icon generator for "Learning Battle".
// Draws a white lightning bolt (the app's ⚡ logo) on the brand
// blue→deep-purple gradient (#4361EE → #3A0CA3), with anti-aliasing
// via 4×4 supersampling, and encodes a PNG using Node's zlib.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
function lerp(a, b, t) { return a + (b - a) * t; }

// Lightning-bolt polygon in a 0..100 design box (y points down).
const BOLT = [
  [62, 6], [28, 54], [47, 54], [38, 94], [76, 42], [53, 42],
];
function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// Render an RGBA buffer.
// opts: { size, c1, c2, bg, boltScale, boltColor }
function render({ size, c1, c2, bg, boltScale, boltColor }) {
  const A = hex(c1), B = hex(c2);
  const BG = bg ? hex(bg) : null;
  const WHITE = hex(boltColor || '#FFFFFF');
  const buf = Buffer.alloc(size * size * 4);

  // Center the bolt's bounding box (x 28..76, y 6..94) → center (52,50).
  const boxCx = 52, boxCy = 50, boxH = 88;
  const scale = (size * boltScale) / boxH; // bolt height = boltScale * size
  const toDesign = (p) => ((p - size / 2) / scale) + (p === 0 ? 0 : 0); // placeholder

  const SS = 4; // supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS;
          const fy = y + (sy + 0.5) / SS;
          // Background: diagonal gradient, or solid bg if provided.
          let br, bg2, bb;
          if (BG) { br = BG[0]; bg2 = BG[1]; bb = BG[2]; }
          else {
            const t = (fx + fy) / (2 * size);
            br = lerp(A[0], B[0], t); bg2 = lerp(A[1], B[1], t); bb = lerp(A[2], B[2], t);
          }
          // Bolt sample → design space.
          const dx = (fx - size / 2) / scale + boxCx;
          const dy = (fy - size / 2) / scale + boxCy;
          if (inPoly(dx, dy, BOLT)) { br = WHITE[0]; bg2 = WHITE[1]; bb = WHITE[2]; }
          r += br; g += bg2; b += bb;
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      buf[o] = Math.round(r / n);
      buf[o + 1] = Math.round(g / n);
      buf[o + 2] = Math.round(b / n);
      buf[o + 3] = 255;
    }
  }
  return buf;
}

function encodePNG(buf, size) {
  // Add filter byte (0) at the start of each scanline.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    buf.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

let CRC_TABLE;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return ~crc;
}

const outDir = path.join(__dirname, '..', 'assets');
const C1 = '#4361EE', C2 = '#3A0CA3';

function write(name, opts) {
  const buf = render(opts);
  fs.writeFileSync(path.join(outDir, name), encodePNG(buf, opts.size));
  console.log('wrote', name, opts.size + 'px');
}

// Main icon: full-bleed gradient, bolt at ~52% height.
write('icon.png', { size: 1024, c1: C1, c2: C2, boltScale: 0.52 });
// Adaptive foreground: gradient fills the canvas (so masking shows no white),
// bolt kept smaller to stay inside Android's ~66% safe zone.
write('adaptive-icon.png', { size: 1024, c1: C1, c2: C2, boltScale: 0.40 });
// Splash: same as main icon (contain-fit on white per app.json).
write('splash-icon.png', { size: 1024, c1: C1, c2: C2, boltScale: 0.52 });
// Favicon: small, bolt slightly larger for legibility.
write('favicon.png', { size: 96, c1: C1, c2: C2, boltScale: 0.58 });
