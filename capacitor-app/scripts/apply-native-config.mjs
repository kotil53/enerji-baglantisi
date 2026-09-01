// `npx cap add` ile TAZE üretilen native projeye, README'de elle yapılması
// istenen düzenlemeleri otomatik uygular. Böylece CI her derlemede sıfırdan
// `cap add` yapsa bile sonuç tekrarlanabilir olur.
//
// Yaptıkları (hepsi idempotent — ikinci kez çalıştırmak zararsız):
//   1. AdMob native "APPLICATION_ID" — Android AndroidManifest.xml + iOS Info.plist
//      (yoksa Android'de uygulama açılışta çöker)
//   2. iOS: NSUserTrackingUsageDescription (ATT metni) + ITSAppUsesNonExemptEncryption=false
//      (App Store "Missing Compliance" / ihracat şifreleme sorusu bir daha çıkmaz)
//   3. Android: build.gradle içinde versionCode / versionName
//   4. iOS: Podfile'a GoogleUserMessagingPlatform 2.6.0 sabiti (+ gerekiyorsa
//      pod install) — admob 6.2.0 eski UMP 2.x API'si kullanır, CocoaPods
//      varsayılanı UMP 3.x pod Swift derlemesini kırar
//
// Ortam değişkenleri (hepsi opsiyonel — verilmezse Google'ın TEST değerleri):
//   ADMOB_APP_ID_ANDROID   varsayılan: ca-app-pub-3940256099942544~3347511713
//   ADMOB_APP_ID_IOS       varsayılan: ca-app-pub-3940256099942544~1458002511
//   ANDROID_VERSION_CODE   varsayılan: 1
//   APP_VERSION            varsayılan: package.json > version
//
// Kullanım:  node scripts/apply-native-config.mjs

import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
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

// Oyun yalnız sistemin HTTPS'ini kullanıyor (özel şifreleme yok) -> ihracat uyumu
// açısından muaf. Bu anahtar olmadan her TestFlight/App Store yüklemesinde
// "Missing Compliance" çıkıp elle yanıt bekliyor.
patch(plist, (p) => {
  if (p.includes("ITSAppUsesNonExemptEncryption")) return p;
  const idx = p.lastIndexOf("</dict>");
  if (idx < 0) { console.warn("  ! Info.plist: </dict> bulunamadı"); return p; }
  log("Info.plist            +ITSAppUsesNonExemptEncryption=false (App Store ihracat uyumu sorusu atlanır)");
  return p.slice(0, idx) + `\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n` + p.slice(idx);
});

// admob 6.2.0 -> UMP 2.x API. CocoaPods varsayılanı UMP 3.x (sembol rename) ->
// CapacitorCommunityAdmob pod Swift derlemesi kırılır. GMA 11.3.0 yalnız
// "GoogleUserMessagingPlatform >= 1.1" istediği için son 2.x'e (2.6.0) sabitle.
const podfile = join(root, "ios/App/Podfile");
let podfileChanged = false;
patch(podfile, (pf) => {
  if (pf.includes("GoogleUserMessagingPlatform")) return pf;
  const pin = `  pod 'GoogleUserMessagingPlatform', '2.6.0'\n`;
  let out;
  if (pf.includes("# Add your Pods here")) {
    out = pf.replace("# Add your Pods here\n", "# Add your Pods here\n" + pin);
  } else {
    const m = pf.match(/(target 'App' do\n\s*capacitor_pods\n)/);
    if (!m) { console.warn("  ! Podfile: enjeksiyon noktası bulunamadı"); return pf; }
    out = pf.replace(m[0], m[0] + pin);
  }
  if (out !== pf) { podfileChanged = true; log("Podfile              +GoogleUserMessagingPlatform 2.6.0 (UMP 2.x sabiti)"); }
  return out;
});

// Podfile değiştiyse Pods'u yeniden kur (yalnız CocoaPods varsa — Windows/Android CI'da atlanır).
// `cap add ios` ilk pod install'da Podfile.lock'a UMP 3.x kilitliyor; düz `pod install`
// kilide karşı downgrade edemez → lock + Pods/ silinip tam yeniden çözüm yaptırılır.
if (podfileChanged) {
  let hasPod = true;
  try { execSync("pod --version", { stdio: "ignore" }); }
  catch { hasPod = false; console.warn("  ! pod install atlandı — CocoaPods bulunamadı"); }
  if (hasPod) {
    const appDir = join(root, "ios/App");
    rmSync(join(appDir, "Podfile.lock"), { force: true });
    rmSync(join(appDir, "Pods"), { recursive: true, force: true });
    console.log("  pod install (Podfile.lock + Pods/ silindi, yeniden çözülüyor)…");
    execSync("pod install", { cwd: appDir, stdio: "inherit" });  // hata olursa script çöksün
  }
}

console.log(touched ? `✓ Native yapılandırma uygulandı (${touched} değişiklik)` : "✓ Native yapılandırma zaten güncel");
