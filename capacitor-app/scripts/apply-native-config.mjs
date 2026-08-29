// `npx cap add` ile TAZE üretilen native projeye, README'de elle yapılması
// istenen düzenlemeleri otomatik uygular. Böylece CI her derlemede sıfırdan
// `cap add` yapsa bile sonuç tekrarlanabilir olur.
//
// Yaptıkları (hepsi idempotent — ikinci kez çalıştırmak zararsız):
//   1. AdMob native "APPLICATION_ID" — Android AndroidManifest.xml + iOS Info.plist
//      (yoksa Android'de uygulama açılışta çöker)
//   2. iOS: NSUserTrackingUsageDescription (ATT metni)
//   3. Android: build.gradle içinde versionCode / versionName
//
// Ortam değişkenleri (hepsi opsiyonel — verilmezse Google'ın TEST değerleri):
//   ADMOB_APP_ID_ANDROID   varsayılan: ca-app-pub-3940256099942544~3347511713
//   ADMOB_APP_ID_IOS       varsayılan: ca-app-pub-3940256099942544~1458002511
//   ANDROID_VERSION_CODE   varsayılan: 1
//   APP_VERSION            varsayılan: package.json > version
//
// Kullanım:  node scripts/apply-native-config.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const ADMOB_ANDROID = process.env.ADMOB_APP_ID_ANDROID || "ca-app-pub-3940256099942544~3347511713";
const ADMOB_IOS     = process.env.ADMOB_APP_ID_IOS     || "ca-app-pub-3940256099942544~1458002511";
const VERSION_CODE  = process.env.ANDROID_VERSION_CODE || "1";
const VERSION_NAME  = process.env.APP_VERSION || pkg.version || "1.0.0";
const ATT_TEXT      = "Reklamları ilgi alanlarınıza göre kişiselleştirmek için kullanılır.";

let touched = 0;
const log = (m) => { console.log("  " + m); touched++; };
const patch = (file, fn) => {
  if (!existsSync(file)) return;
  const before = readFileSync(file, "utf8");
  const after = fn(before);
  if (after !== before) writeFileSync(file, after);
};

// ── Android ──────────────────────────────────────────────────────
const manifest = join(root, "android/app/src/main/AndroidManifest.xml");
patch(manifest, (xml) => {
  if (xml.includes("com.google.android.gms.ads.APPLICATION_ID")) return xml;
  const meta =
    `\n        <meta-data\n` +
    `            android:name="com.google.android.gms.ads.APPLICATION_ID"\n` +
    `            android:value="${ADMOB_ANDROID}" />\n`;
  const m = xml.match(/<application[^>]*>/);
  if (!m) { console.warn("  ! AndroidManifest.xml: <application> bulunamadı"); return xml; }
  log(`AndroidManifest.xml  +AdMob APPLICATION_ID (${ADMOB_ANDROID})`);
  return xml.replace(m[0], m[0] + meta);
});

const buildGradle = join(root, "android/app/build.gradle");
patch(buildGradle, (g) => {
  let out = g
    .replace(/versionCode\s+\d+/, `versionCode ${VERSION_CODE}`)
    .replace(/versionName\s+"[^"]*"/, `versionName "${VERSION_NAME}"`);
  if (out !== g) log(`build.gradle          versionCode=${VERSION_CODE} versionName="${VERSION_NAME}"`);
  return out;
});

// ── iOS ──────────────────────────────────────────────────────────
const plist = join(root, "ios/App/App/Info.plist");
patch(plist, (p) => {
  if (p.includes("GADApplicationIdentifier")) return p;
  const keys =
    `\t<key>GADApplicationIdentifier</key>\n\t<string>${ADMOB_IOS}</string>\n` +
    `\t<key>NSUserTrackingUsageDescription</key>\n\t<string>${ATT_TEXT}</string>\n`;
  const idx = p.lastIndexOf("</dict>");
  if (idx < 0) { console.warn("  ! Info.plist: </dict> bulunamadı"); return p; }
  log(`Info.plist            +GADApplicationIdentifier (${ADMOB_IOS}) +ATT`);
  return p.slice(0, idx) + keys + p.slice(idx);
});

console.log(touched ? `✓ Native yapılandırma uygulandı (${touched} değişiklik)` : "✓ Native yapılandırma zaten güncel");
