/* ============================================================
   scripts/fix-gallery-images.js
   Las imágenes en img/pasoN.png tienen el header PNG con
   dimensiones infladas (~327680x150024 = 49 gigapíxeles).
   Los datos comprimidos (IDAT) sí corresponden a una imagen
   "real" mucho más pequeña.
   Este script:
     1) Parsea los chunks del PNG manualmente
     2) Descomprime el IDAT con zlib
     3) Calcula las dimensiones reales a partir de los bytes
        descomprimidos y el bit depth / color type del header
     4) Reescribe un PNG válido con dimensiones correctas
     5) Lo guarda en disco (sobrescribe)
   ============================================================ */
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');
const { PNG } = require('pngjs');

const imgDir = path.resolve(__dirname, '..', 'img');

function parsePngChunks(buf) {
  // Aceptar firma estándar o variantes corruptas que aparecen en estos archivos
  const sig = buf.slice(0, 8);
  const std  = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const bad1 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0a, 0x1a, 0x0a, 0x00]);
  if (!sig.equals(std) && !sig.equals(bad1)) {
    console.log('  ⚠ firma no reconocida:', [...sig].map(x => x.toString(16).padStart(2,'0')).join(' '));
  }
  const chunks = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.slice(off + 4, off + 8).toString('ascii');
    const data = buf.slice(off + 8, off + 8 + len);
    chunks.push({ type, data });
    off += 8 + len + 4; // + CRC
    if (type === 'IEND') break;
  }
  return chunks;
}

function getIhdr(chunks) {
  const ihdr = chunks.find(c => c.type === 'IHDR');
  if (!ihdr) throw new Error('Sin IHDR');
  const d = ihdr.data;
  return {
    width:       d.readUInt32BE(0),
    height:      d.readUInt32BE(4),
    bitDepth:    d[8],
    colorType:   d[9],   // 0=G, 2=RGB, 3=palette, 4=GA, 6=RGBA
    compression: d[10],
    filter:      d[11],
    interlace:   d[12]
  };
}

function getIdat(chunks) {
  return Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
}

function channelsForColorType(colorType) {
  return [0, 1, 3, 1, 2, 0, 4][colorType] || 3;
}

function buildPng(width, height, bitDepth, colorType, rawRgba) {
  const png = new PNG({ width, height, colorType: 6 });
  png.data = rawRgba;
  return PNG.sync.write(png);
}

function nearestNeighbor(src, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor(y * srcH / dstH));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor(x * srcW / dstW));
      const sIdx = (sy * srcW + sx) << 2;
      const dIdx = (y * dstW + x) << 2;
      dst[dIdx]     = src[sIdx];
      dst[dIdx + 1] = src[sIdx + 1];
      dst[dIdx + 2] = src[sIdx + 2];
      dst[dIdx + 3] = src[sIdx + 3];
    }
  }
  return dst;
}

const MAX_WIDTH = 1280;

(async () => {
  const files = fs.readdirSync(imgDir).filter(f => /\.png$/i.test(f));

  for (const f of files) {
    const src = path.join(imgDir, f);
    const buf = fs.readFileSync(src);

    const chunks = parsePngChunks(buf);
    const ihdr   = getIhdr(chunks);
    const idat   = getIdat(chunks);
    const chans  = channelsForColorType(ihdr.colorType);
    const bpp    = chans * (ihdr.bitDepth / 8);

    const inflated = zlib.inflateSync(idat);
    const dataBytes = inflated.length;

    // Cada fila tiene: 1 byte de filtro + (width * bpp) bytes
    // dataBytes = height * (1 + width * bpp)
    // Asumimos dimensiones "razonables" (< 10000) para encontrar la combinación
    // Probamos alturas de 200..4000 hasta encontrar width entera consistente.
    let realW = 0, realH = 0;
    for (let h = 200; h <= 4000; h++) {
      const w = (dataBytes / h - 1) / bpp;
      if (Math.abs(w - Math.round(w)) < 0.001 && Math.round(w) > 50) {
        realW = Math.round(w);
        realH = h;
        break;
      }
    }

    if (!realW) {
      console.log(`⚠ ${f}: no se pudo inferir tamaño (dataBytes=${dataBytes}, bpp=${bpp})`);
      continue;
    }

    // Decodificar: convertir de (filter + raw) a RGBA plano
    const rgba = Buffer.alloc(realW * realH * 4);
    for (let y = 0; y < realH; y++) {
      const filter = inflated[y * (1 + realW * bpp)];
      const rowStart = y * (1 + realW * bpp) + 1;
      // (sólo soportamos filter=0 = None; los demás requerirían desfiltrar)
      if (filter !== 0) {
        console.log(`⚠ ${f}: fila ${y} usa filter=${filter}, no soportado`);
      }
      for (let x = 0; x < realW; x++) {
        const sOff = rowStart + x * bpp;
        const dOff = (y * realW + x) << 2;
        switch (ihdr.colorType) {
          case 6: // RGBA
            rgba[dOff]     = inflated[sOff];
            rgba[dOff + 1] = inflated[sOff + 1];
            rgba[dOff + 2] = inflated[sOff + 2];
            rgba[dOff + 3] = inflated[sOff + 3];
            break;
          case 2: // RGB
            rgba[dOff]     = inflated[sOff];
            rgba[dOff + 1] = inflated[sOff + 1];
            rgba[dOff + 2] = inflated[sOff + 2];
            rgba[dOff + 3] = 255;
            break;
          case 0: // G
            rgba[dOff]     = inflated[sOff];
            rgba[dOff + 1] = inflated[sOff];
            rgba[dOff + 2] = inflated[sOff];
            rgba[dOff + 3] = 255;
            break;
          default:
            rgba[dOff] = rgba[dOff + 1] = rgba[dOff + 2] = 0; rgba[dOff + 3] = 255;
        }
      }
    }

    // Redimensionar si excede MAX_WIDTH
    let finalW = realW, finalH = realH, finalRgba = rgba;
    if (realW > MAX_WIDTH) {
      finalW = MAX_WIDTH;
      finalH = Math.round(realH * MAX_WIDTH / realW);
      finalRgba = nearestNeighbor(rgba, realW, realH, finalW, finalH);
    }

    const out = buildPng(finalW, finalH, 8, 6, finalRgba);
    const before = (buf.length / 1024).toFixed(1);
    const after  = (out.length / 1024).toFixed(1);
    fs.writeFileSync(src, out);
    console.log(`✔ ${f}: header mentía ${ihdr.width}x${ihdr.height} → real ${realW}x${realH}${finalW !== realW ? ` → ${finalW}x${finalH}` : ''} · ${before}KB → ${after}KB`);
  }
  console.log('\n✅ Imágenes corregidas en /img');
})().catch(e => { console.error(e); process.exit(1); });
