// Oyunun tek dosyalık kaynağını (kök dizindeki enerji-bulmaca.html)
// Capacitor'ın beklediği yere kopyalar: capacitor-app/www/index.html
//
// Kullanım:  node sync.mjs   (npm run sync:game)
// Her "cap sync / cap run" öncesi otomatik çalışır (bkz. package.json scripts).

import { mkdirSync, copyFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "..", "enerji-bulmaca.html");
const OUT_DIR = join(here, "www");
const OUT = join(OUT_DIR, "index.html");

if (!existsSync(SRC)) {
  console.error("HATA: kaynak bulunamadı ->", SRC);
  console.error("enerji-bulmaca.html dosyası proje kök dizininde olmalı.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(SRC, OUT);

const kb = (statSync(OUT).size / 1024).toFixed(1);
console.log(`✓ Oyun kopyalandı: enerji-bulmaca.html -> www/index.html (${kb} KB)`);
