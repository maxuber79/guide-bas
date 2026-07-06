/* ============================================================
   scripts/gen-gallery-placeholders.js
   Las imágenes originales en img/pasoN.png están corruptas
   (header manipulado, dimensiones inválidas, IDAT incompleto).
   Este script genera PNGs placeholder con gradiente + texto,
   coherentes con la estética de la landing (tema monokai).
   Cuando reemplaces con tus screenshots reales, basta con
   sobrescribir img/pasoN.png manteniendo el mismo nombre.
   ============================================================ */
const fs   = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const imgDir = path.resolve(__dirname, '..', 'img');

const STEPS = [
  { num: 1, title: 'Quick Open',         subtitle: 'Ctrl + P',          accent: '#66d9ef' },
  { num: 2, title: 'Login to CF',        subtitle: 'Open SSO page',     accent: '#ae81ff' },
  { num: 3, title: 'Copy passcode',      subtitle: 'Generar código',    accent: '#a6e22e' },
  { num: 4, title: 'Sing In',            subtitle: 'Pegar + entrar',    accent: '#f92672' }
];

function makePng(w, h, fillRgba) {
  return new PNG({ width: w, height: h, colorType: 6, data: fillRgba });
}

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0,2),16), parseInt(m.slice(2,4),16), parseInt(m.slice(4,6),16)];
}

function setPx(png, x, y, r, g, b, a = 255) {
  const i = (y * png.width + x) << 2;
  png.data[i] = r; png.data[i+1] = g; png.data[i+2] = b; png.data[i+3] = a;
}

// Gradiente diagonal con ruido sutil
function drawGradient(png, c1, c2) {
  const [r1,g1,b1] = c1;
  const [r2,g2,b2] = c2;
  for (let y = 0; y < png.height; y++) {
    const t = y / png.height;
    const r = r1 + (r2 - r1) * t;
    const g = g1 + (g2 - g1) * t;
    const b = b1 + (b2 - b1) * t;
    for (let x = 0; x < png.width; x++) {
      const t2 = x / png.width;
      const rr = r + (r2 - r) * t2 * 0.3;
      const gg = g + (g2 - g) * t2 * 0.3;
      const bb = b + (b2 - b) * t2 * 0.3;
      setPx(png, x, y, Math.round(rr), Math.round(gg), Math.round(bb));
    }
  }
}

// Líneas tipo "código"
function drawCodeLines(png, accent) {
  const [ar,ag,ab] = hexToRgb(accent);
  const lines = 12;
  const startY = 30;
  const endY = png.height - 30;
  const spacing = (endY - startY) / lines;
  for (let i = 0; i < lines; i++) {
    const y = Math.round(startY + i * spacing);
    const w = 60 + Math.floor(Math.random() * 200);
    const x = 40 + Math.floor(Math.random() * (png.width - 80 - w));
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        if (y + dy < png.height) {
          const px = png.data;
          const idx = ((y + dy) * png.width + (x + dx)) << 2;
          px[idx]   = (px[idx]   + ar) >> 1;
          px[idx+1] = (px[idx+1] + ag) >> 1;
          px[idx+2] = (px[idx+2] + ab) >> 1;
        }
      }
    }
  }
}

// "Ventana" tipo editor de código
function drawWindowChrome(png, accent) {
  const [ar,ag,ab] = hexToRgb(accent);
  // barra superior
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) << 2;
      png.data[i]   = 20;
      png.data[i+1] = 20;
      png.data[i+2] = 18;
      png.data[i+3] = 255;
    }
  }
  // 3 puntos (semáforo)
  const dotY = 12, dotR = 5;
  for (let dy = -dotR; dy <= dotR; dy++) {
    for (let dx = -dotR; dx <= dotR; dx++) {
      if (dx*dx + dy*dy <= dotR*dotR) {
        const colors = [[255,95,86],[255,189,46],[39,201,63]];
        for (let c = 0; c < 3; c++) {
          const x = 16 + c * 18 + dx;
          const y = dotY + dy;
          if (x >= 0 && x < png.width && y >= 0 && y < 24) {
            const i = (y * png.width + x) << 2;
            png.data[i] = colors[c][0];
            png.data[i+1] = colors[c][1];
            png.data[i+2] = colors[c][2];
          }
        }
      }
    }
  }
  // borde
  for (let x = 0; x < png.width; x++) {
    setPx(png, x, 24, ar, ag, ab);
    setPx(png, x, png.height - 1, 50, 50, 45);
  }
  for (let y = 0; y < png.height; y++) {
    setPx(png, 0, y, 50, 50, 45);
    setPx(png, png.width - 1, y, 50, 50, 45);
  }
}

// Bitmap font 5x7 muy simple para dígitos y letras mayúsculas
const FONT = {
  '1':['.##..','#..#.','###..','#..#.','#..#.','#..#.','####.'],
  '2':['####.','#...#','....#','..##.','.#...','#....','#####'],
  '3':['####.','#...#','....#','..##.','....#','#...#','####.'],
  '4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
  'C':['.####','#....','#....','#....','#....','#....','.####'],
  'F':['#####','#....','#....','####.','#....','#....','#....'],
  'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
  'L':['#....','#....','#....','#....','#....','#....','#####'],
  'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
  'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
  'P':['####.','#...#','#...#','####.','#....','#....','#....'],
  'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
  'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
  'S':['.####','#....','#....','.###.','....#','....#','####.'],
  'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
  'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
  '+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
  '.':['.....','.....','.....','.....','.....','.....','..#..'],
  ' ':['.....','.....','.....','.....','.....','.....','.....'],
  '-':['.....','.....','.....','#####','.....','.....','.....']
};

function drawText(png, text, x, y, scale, color) {
  const [r,g,b] = color;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] || FONT[' '];
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] === '#') {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cx + gx * scale + sx;
              const py = y + gy * scale + sy;
              if (px >= 0 && px < png.width && py >= 0 && py < png.height) {
                setPx(png, px, py, r, g, b);
              }
            }
          }
        }
      }
    }
    cx += 6 * scale;
  }
}

const W = 1280, H = 720;

for (const step of STEPS) {
  const png = makePng(W, H, null);
  // fondo: gradiente oscuro
  drawGradient(png, [30, 30, 27], [14, 14, 12]);
  // chrome
  drawWindowChrome(png, step.accent);
  // líneas de código
  drawCodeLines(png, step.accent);

  // texto central: "STEP N"
  const stepText = `STEP ${step.num}`;
  const subText  = step.title.toUpperCase();
  const subText2 = step.subtitle.toUpperCase();
  const scaleTitle = 6;
  const scaleSub   = 3;

  const w1 = stepText.length * 6 * scaleTitle - scaleTitle;
  const w2 = subText.length  * 6 * scaleSub   - scaleSub;
  const w3 = subText2.length * 6 * scaleSub   - scaleSub;
  const cx = W / 2;

  // banda semitransparente detrás del texto
  for (let y = 0; y < H; y++) {
    const bandY = (y > H*0.25 && y < H*0.75) ? 70 : 0;
    if (!bandY) continue;
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) << 2;
      png.data[idx]   = Math.round(png.data[idx]   * 0.55);
      png.data[idx+1] = Math.round(png.data[idx+1] * 0.55);
      png.data[idx+2] = Math.round(png.data[idx+2] * 0.55);
    }
  }

  const ar = hexToRgb(step.accent);
  const fg = [248, 248, 242];
  drawText(png, stepText, cx - w1/2, H/2 - 80, scaleTitle, ar);
  drawText(png, subText,  cx - w2/2, H/2 + 10,  scaleSub, fg);
  drawText(png, subText2, cx - w3/2, H/2 + 50,  scaleSub, [166, 226, 46]);

  const out = PNG.sync.write(png);
  const dest = path.join(imgDir, `paso${step.num}.png`);
  fs.writeFileSync(dest, out);
  console.log(`✔ Generado: img/paso${step.num}.png · ${(out.length/1024).toFixed(1)}KB · ${W}x${H}`);
}
console.log('\n✅ Placeholders listos en /img (reemplaza con tus screenshots reales cuando quieras)');
