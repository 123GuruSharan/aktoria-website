import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

function writePNG(filename, width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgbaBuffer.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  fs.writeFileSync(filename, Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]));
}

function decodePNG(f) {
  const buf = fs.readFileSync(f);
  let pos = 8;
  const chunks = [];
  let ihdr;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      ihdr = { w: buf.readUInt32BE(pos + 8), h: buf.readUInt32BE(pos + 12) };
    } else if (type === 'IDAT') {
      chunks.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(chunks));
  const w = ihdr.w;
  const h = ihdr.h;
  const stride = w * 4 + 1;
  let prev = Buffer.alloc(w * 4);
  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const filter = decompressed[y * stride];
    const scanline = decompressed.subarray(y * stride + 1, (y + 1) * stride);
    const cur = Buffer.alloc(w * 4);
    for (let x = 0; x < w * 4; x++) {
      const a = x >= 4 ? cur[x - 4] : 0;
      const b = prev[x];
      const c = x >= 4 ? prev[x - 4] : 0;
      let val = scanline[x];
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        val = (val + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c))) & 0xff;
      }
      cur[x] = val;
    }
    cur.copy(raw, y * w * 4);
    prev = cur;
  }
  return { w, h, raw };
}

const { w, h, raw } = decodePNG('public/assets/arm-photo.png');
console.log('Decoded public/assets/arm-photo.png:', w, 'x', h);

// Compute luminance channel & alpha mask
const lum = new Float32Array(w * h);
const alpha = new Float32Array(w * h);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    const a = raw[idx + 3] / 255;
    alpha[y * w + x] = a;
    if (a > 0.05) {
      lum[y * w + x] = (0.299 * raw[idx] + 0.587 * raw[idx + 1] + 0.114 * raw[idx + 2]);
    } else {
      lum[y * w + x] = 0;
    }
  }
}

// Sobel gradient on luminance and on alpha
const edgeBuf = new Float32Array(w * h);

for (let y = 1; y < h - 1; y++) {
  for (let x = 1; x < w - 1; x++) {
    const a = alpha[y * w + x];
    if (a < 0.02) continue;

    // Alpha gradient (silhouette edge)
    const gaX = (alpha[(y - 1) * w + (x + 1)] + 2 * alpha[y * w + (x + 1)] + alpha[(y + 1) * w + (x + 1)]) -
                (alpha[(y - 1) * w + (x - 1)] + 2 * alpha[y * w + (x - 1)] + alpha[(y + 1) * w + (x - 1)]);
    const gaY = (alpha[(y + 1) * w + (x - 1)] + 2 * alpha[(y + 1) * w + x] + alpha[(y + 1) * w + (x + 1)]) -
                (alpha[(y - 1) * w + (x - 1)] + 2 * alpha[(y - 1) * w + x] + alpha[(y - 1) * w + (x + 1)]);
    const edgeA = Math.hypot(gaX, gaY);

    // Luminance gradient (hardware internal contours: slots, bolts, motor caps, cables)
    const glX = (lum[(y - 1) * w + (x + 1)] + 2 * lum[y * w + (x + 1)] + lum[(y + 1) * w + (x + 1)]) -
                (lum[(y - 1) * w + (x - 1)] + 2 * lum[y * w + (x - 1)] + lum[(y + 1) * w + (x - 1)]);
    const glY = (lum[(y + 1) * w + (x - 1)] + 2 * lum[(y + 1) * w + x] + lum[(y + 1) * w + (x + 1)]) -
                (lum[(y - 1) * w + (x - 1)] + 2 * lum[(y - 1) * w + x] + lum[(y - 1) * w + (x + 1)]);
    const edgeL = Math.hypot(glX, glY);

    let edgeVal = 0;
    if (edgeA > 0.4) {
      edgeVal = Math.min(1.0, edgeA * 0.9);
    }
    if (edgeL > 65) {
      edgeVal = Math.max(edgeVal, Math.min(1.0, (edgeL - 45) / 120));
    }
    edgeBuf[y * w + x] = edgeVal;
  }
}

// Generate warm-white technical contours: RGBA (232, 230, 223, alpha)
const outlineRGBA = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    const e = edgeBuf[y * w + x];
    if (e > 0.15) {
      outlineRGBA[idx] = 236;     // R (warm-white / cream)
      outlineRGBA[idx + 1] = 234; // G
      outlineRGBA[idx + 2] = 228; // B
      outlineRGBA[idx + 3] = Math.round(Math.min(255, e * 255 * 0.92));
    }
  }
}

writePNG('public/assets/arm-outline.png', w, h, outlineRGBA);
console.log('Generated matching public/assets/arm-outline.png:', w, 'x', h, 'size:', fs.statSync('public/assets/arm-outline.png').size);

