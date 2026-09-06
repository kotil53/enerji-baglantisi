# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Repo dili Türkçe: tüm kod yorumları, commit mesajları ve dokümanlar Türkçe.
> Aynı dilde devam et.

## Büyük resim

İki katman var:

1. **Oyun** — [enerji-bulmaca.html](enerji-bulmaca.html) (kök dizin). Tek dosyada HTML +
   CSS + JS. Harici kütüphane yok, Canvas ile render, girdi Pointer Events. ~2400 satır,
   tek bir IIFE (`"use strict"`), kaynak numaralı bölümlere ayrılmış (0–13; bkz. dosya içi
   yorum bloğu satır ~561). Tarayıcıda doğrudan açılınca da sorunsuz çalışır.

2. **Capacitor sarmalayıcı** — [capacitor-app/](capacitor-app/). Yukarıdaki HTML'i Android
   ve iOS uygulamasına çevirir. **Oyun kodu buraya kopyalanmaz.** [capacitor-app/sync.mjs](capacitor-app/sync.mjs)
   her derleme öncesi kökteki HTML'i `capacitor-app/www/index.html` olarak taşır — tek
   kaynak dosya, sürüm kayması yok.

`www/`, `android/`, `ios/`, `node_modules/` **sürüm kontrolüne girmez** (bkz.
[.gitignore](.gitignore)); hepsi komutlarla yeniden üretilir. CI de her derlemede bu
klasörleri sıfırdan `cap add` ile oluşturur.

### Düzenleme kuralı

Oyunu **her zaman** kökteki [enerji-bulmaca.html](enerji-bulmaca.html) üzerinde düzenle.
`capacitor-app/www/` elle düzenlenmez — `sync.mjs` üzerine yazar. Build araç zinciri yoktur;
HTML/CSS/JS elle yazılır, ES5 uyumlu stil (`var`, fonksiyon ifadeleri, tek IIFE) korunur.

### Native entegrasyon deseni

Oyun içindeki her Capacitor çağrısı `capPlugin(name)` guard'ının ardındadır: eklenti yoksa
kod sessizce web karşılığına döner (ya da no-op olur). Tarayıcıda `window.Capacitor`
tanımsızdır → tüm `initNative()` bloğu (bölüm 12b) atlanır. Yeni native özellik eklerken bu
deseni koru — tarayıcıda kırılmamalı.

Kullanılan eklentiler ([capacitor-app/package.json](capacitor-app/package.json)):
`@capacitor/haptics`, `status-bar`, `splash-screen`, `app` (Android geri tuşu → menü),
`local-notifications`, `@capacitor-community/admob`.

### Oyun içi alt sistemler (hepsi IIFE kapsamında, global değil)

- **`Store`** — `localStorage`, `enerji.v1.` önekli, gizli sekmede sessizce devre dışı.
- **`Sound`** — WebAudio ile sentezlenir, ses dosyası yok.
- **`Haptic`** — Capacitor Haptics varsa o, yoksa `navigator.vibrate`.
- **`Notify`** — yerel "geri dön" hatırlatıcıları. **Sunucu yok.** Her açılışta/öne gelişte
  sıfırdan planlanır. Varsayılan açık, ilk açılışta izin bir kez istenir.
- **`Ads`** — AdMob geçiş + ödüllü-geçiş (rewarded interstitial). `ADS_CFG` ayarları,
  `AD_UNITS.test` / `AD_UNITS.live` birim ID'leri.
- **`RNG`** — sonsuz modda `Math.random`; günlük modda `mulberry32(hash(todayKey()))` ile
  deterministik (herkeste aynı bulmaca). `buildLevel` geçici olarak değiştirir.

### İki mod

- **`endless`** — sabit seviye yok; her seviye rastgele üretilir ve giderek zorlaşır.
  Zorluk `DIFFS` (rahat/normal/zor) hem "etkin seviye no"yu kaydırır hem ızgara/hat/kilit
  parametrelerini ayarlar.
- **`daily`** — `DAILY_COUNT = 7` deterministik günlük bulmaca.

Seviye üretici (bölüm 2, `generateLevel` / `randomPath`) **çözülebilirliği garanti eder**:
önce çözülmüş yol çizilir, sonra çıkmaz dallar + yanıltıcı parçalar eklenir, en son
kilitsiz parçalar rastgele döndürülür.

## Komutlar

Hepsi `capacitor-app/` içinden çalışır.

| Komut | Ne yapar |
|-------|----------|
| `npm ci` | bağımlılıklar (ilk kez `npm install`) |
| `npm run sync:game` | sadece kök HTML → `www/index.html` |
| `npm run add:android` / `add:ios` | native projeyi **sıfırdan** üret (sync + `cap add` + `native:config`) |
| `npm run cap:sync` | native proje varken: oyunu kopyala + `cap sync` + `native:config` |
| `npm run open:android` / `open:ios` | Android Studio / Xcode'da aç |
| `npm run run:android` / `run:ios` | bağlı cihazda çalıştır |
| `npm run assets` | ikon + splash üret (`assets/icon.svg`, `assets/splash.svg` kaynak) |

**Test / lint yok.** Otomatik test paketi yoktur. Doğrulama yolları:
- Hızlı: [enerji-bulmaca.html](enerji-bulmaca.html)'i tarayıcıda aç (native kod no-op).
- Tam: emülatör/cihazda debug APK. Android emülatör derlemesi (Windows, JAVA_HOME bozuksa):
  ```bash
  export JAVA_HOME=/c/Program\ Files/Android/Android\ Studio/jbr
  cd capacitor-app/android && ./gradlew --no-daemon assembleDebug
  ```

### `apply-native-config.mjs`

[capacitor-app/scripts/apply-native-config.mjs](capacitor-app/scripts/apply-native-config.mjs)
taze üretilen native projeye idempotent yamalar uygular (README'de "elle yapın" denen
adımların otomasyonu). CI her derlemede `cap add` yaptığı için gereklidir:
AdMob `APPLICATION_ID` (Android manifest + iOS `Info.plist`), ATT metni,
`versionCode`/`versionName`, ve Podfile'a `GoogleUserMessagingPlatform` **2.6.0** sabiti
(admob 6.x eski UMP 2.x API'si kullanır; CocoaPods varsayılan UMP 3.x pod'u Swift
derlemesini kırar).

## CI ve yayın

[.github/workflows/android.yml](.github/workflows/android.yml) ve
[ios.yml](.github/workflows/ios.yml): her ikisi de native projeyi sıfırdan üretir.

- Her `push`/PR (`main`): imzasız debug APK / imzasız `.xcarchive` (derleme doğrulaması,
  sır gerekmez).
- `v*` tag'i **veya** elle `workflow_dispatch` "release": imzalı `.aab` (+ GitHub Release) /
  imzalı App Store `.ipa`.

[ios-metadata.yml](.github/workflows/ios-metadata.yml) (yalnız elle): App Store Connect
**metin alanları + yaş derecesi** anketini `fastlane deliver` ile yönetir — kaynak
[capacitor-app/fastlane/metadata/](capacitor-app/fastlane/metadata/). `pull` canlı metni
indirir (yazmaz), `push` yazar (incelemeye göndermez). `ios.yml` ile aynı iki App Store
API sırrı; binary yüklemez.

Sürümleme: `versionName` = tag'den (`v1.2.3` → `1.2.3`) ya da `0.0.0-ci.<run>`;
`versionCode` / `CURRENT_PROJECT_VERSION` = GitHub `run_number`.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

İmzalama sırları tanımlı değilse ilgili release işi kendini **atlar** (uyarı basar);
imzasız çıktı yine üretilir. Gerekli GitHub secret'ların tam listesi + iOS imzalı dağıtım
kurulumu: [capacitor-app/README.md](capacitor-app/README.md) ("Gerekli GitHub Secrets").
Keystore ve API anahtarları repoda **yoktur** ([.gitignore](.gitignore)).

**Yayına çıkmadan önce:** [enerji-bulmaca.html](enerji-bulmaca.html) içinde
`ADS_CFG.TEST_MODE = false` yapılmalı (şu an `true`; canlı reklama kendi tıklaman hesabı
kapatır). Native App ID'ler CI secret'larından gelir (`ADMOB_APP_ID_ANDROID` / `_IOS`).

## Yapılandırma nerede

| Ne | Dosya |
|----|-------|
| Uygulama adı / kimliği (`com.enerji.baglantisi`) / arka plan / splash / status bar | [capacitor-app/capacitor.config.json](capacitor-app/capacitor.config.json) |
| Reklam ayarları (`ADS_CFG`), reklam birimleri (`AD_UNITS`) | [enerji-bulmaca.html](enerji-bulmaca.html) |
| Bildirim ID'leri / zamanları / metinleri (`Notify`) | [enerji-bulmaca.html](enerji-bulmaca.html) |
| Native son-rötuş (AdMob App ID, sürüm, UMP pod sabiti) | [capacitor-app/scripts/apply-native-config.mjs](capacitor-app/scripts/apply-native-config.mjs) |
| Gizlilik politikası (GitHub Pages, `main` / `/docs`) | [docs/privacy-policy.html](docs/privacy-policy.html) |
| Mağaza metinleri / içerik derecelendirme / veri güvenliği yanıtları | [store/store-listing.md](store/store-listing.md) |
| App Store metin alanları + yaş derecesi (fastlane `deliver` kaynağı) | [capacitor-app/fastlane/metadata/](capacitor-app/fastlane/metadata/) (bkz. [fastlane/README.md](capacitor-app/fastlane/README.md)) |
