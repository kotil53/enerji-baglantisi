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
  `AD_UNITS.test` / `AD_UNITS.live` birim ID'leri. **Tuzak:** eklentinin
  `showRewardInterstitialAd()` sözü reklam KAPANINCA değil ödül verilince çözülür (reklam hâlâ
  ekranda). `Ads.rewarded(cb)` bu yüzden `cb`'yi `Dismissed` olayında çalıştırır; reklam
  ekrandayken `window.confirm` gibi WebView'i bloke eden bir şey açılırsa ✕ çalışmaz. Reklam
  sonrası onaylar `askConfirm` ile (bkz. `useHint`).
- **`RNG`** — sonsuz modda `Math.random`; günlük modda `mulberry32(hash(todayKey()))`,
  seviyeler modunda `mulberry32(hash("seviye."+zorluk) ^ seviyeNo)` ile deterministik
  (herkeste aynı bulmaca). `buildLevel` geçici olarak değiştirir.

### Üç mod

- **`campaign`** ("Seviyeler") — `CAMPAIGN_LEVELS = 200` sabit seviye: n. seviye zorluk +
  seviye no'ya göre tohumlanır, herkeste ve her denemede aynıdır. Yeni oyuncunun varsayılan
  modu; `mode` kaydı olmayıp sonsuzda ilerlemiş eski oyuncu `endless`'te kalır. 200. seviye
  bitince kutlama katmanı "Sonsuz Moda Geç" der (`finishCampaign`): `campaign.<zorluk>.done`
  işaretlenir, sonsuz mod aynı zorlukta **Seviye 201**'den açılır (`endless.<zorluk>.lastLevel`
  en az 200'e çekilir, daha ilerisi korunur). Bitmiş "Seviyeler" yeniden açılınca baştan oynanır.
- **`endless`** — seviyeler rastgele üretilir ve giderek zorlaşır; sabit sınır yok.
  Zorluk `DIFFS` (rahat/normal/zor) hem "etkin seviye no"yu kaydırır hem ızgara/hat/kilit
  parametrelerini ayarlar. `campaign` ile aynı üretici (`levelParams`) ve `game.li` akışını
  paylaşır; yalnız kayıt ön eki (`ekey`: `campaign.` / `endless.`) ve RNG farklıdır.
  "Seviye sayan mod" kontrolleri `cfg.mode !== "daily"` ile yapılır.
  **Kilitli:** `endlessUnlocked()` — "Seviyeler" herhangi bir zorlukta bitene (`campaign.<zorluk>.done`)
  kadar Sonsuz kutucuğu kilitlidir, kayıtlı `mode = "endless"` başlangıçta `campaign`'e döner, günlük
  set bitince `afterDailyMode()` Seviyeler'e yönlendirir. Sonsuzun kayıtlı ilerlemesi silinmez, açılınca sürer.
- **`daily`** — `DAILY_COUNT = 7` deterministik günlük bulmaca.

### Can ve ipucu

- **Can** — tavan `MAX_LIVES = 3` (100 seviye ödülüyle `BONUS_MAX_LIVES = 5`'e kadar), süre bitince −1.
  Can kaldıysa oyun **durur** (`game.phase = "timeUp"`, `#timeUpOverlay` "SÜRE DOLDU"); seviye otomatik
  başlamaz, oyuncu "Yeniden başla"ya basınca `resetLevel` ile baştan başlar (katman açılır açılmaz gelen
  panik dokunuşu 500 ms yok sayılır). Can 0 ise aşağıdaki "Canlar bitti" katmanı. **Kalıcı** (`Store`: `lives.n`, `lives.t`) ve zamanla dolar (`LIFE_REGEN_MS` = 20 dk, yalnız
  `MAX_LIVES`'ın altındayken; duvar saatinden tembel hesap, sunucu yok). Değişim **yalnız `setLives`** ile
  (`game.lives`'a doğrudan yazma); açılışta `loadLives`, saniyede bir `tickLives` (`frame`).
  "Canlar bitti" katmanı (`#lifeOverlay`): reklam → +1 can, tahta korunur, süre yenilenir; "Tekrar dene"
  ücretsiz ama **can vermez** (can 0'da kalır, sonraki her süre aşımında katman yine çıkar — oyuncu
  kilitlenmez). Katman açıkken can zamanla dolarsa oyun kaldığı yerden sürer (`resumeAfterLifeGain`).
- **İpucu** — en çok 2 yanlış yol kablosunu düzeltir. Günde `HINT_FREE_DAILY = 3` hak tamamen
  **ücretsiz** (`freeHintsLeft` / `useFreeHint`; `Store`: `hints.date` / `hints.left`, `todayKey()`
  ile gece yarısı sıfırlanır — tüm modlarda **ortak**, seviye/deneme değişince sıfırlanmaz). Bu hak
  biterse ipucu reklam karşılığı **sınırsız** devam eder (`Ads.rewarded`, izlenebilecek reklam sayısına
  üst sınır yok). İpucu kullanılan seviye en çok `HINT_MAX_STARS = 2` yıldız alır (`game.hinted`,
  `onWin`; 3 yıldız = yardımsız) — bedava ya da reklamlı fark etmez.
  **Aday = `hintWrong`**, yani kopuk kablo: `rot ≠ 0` tek başına "yanlış" değildir (düz kablo 180°'de, çıkmaz
  sapmalı T iki yönde çalışır; eski `rot ≠ 0` testi 4800 tahtanın %78'inde çalışan parçayı seçebiliyordu).
  İpucuyla düzelen kablolar `game.hintFixed`'te tutulur, `resetLevel` (can kaybı / Yeniden başla) bunları
  yeniden düzeltir; sonuç tahtayı çözülü bırakırsa sondan geri alınır. `buildLevel` / `winRetry` listeyi boşaltır.
- **Ödüllü reklam sözleşmesi** — `Ads.rewarded(cb, ask)`: eklenti yoksa (tarayıcı) ya da reklamsızsa ödül
  bedava; eklenti var ama reklam hazır değilse ödül **verilmez** ("reklam şu an hazır değil"; can için
  ücretsiz "Tekrar dene" zaten var). Reklam sürerken oyun süresi akmaz (`Ads.isShowing()`). `ask`
  (`{title, text, yes}`) verilirse reklamdan önce `askConfirm` ile onay alınır.

### Ekranlar ve gezinme (bölüm 11b)

Oyun tuvali hep arkada durur; ekranlar üstüne biner. `screenNow`: `game` | `home` | `levels` |
`settings` | `pause`. Herhangi bir ekran açıkken `menuOpen = true` → süre, ipucu nabzı ve girdi
durur (`frame()`, `onPointerDown` bu bayrağa bakar). Geçişler yalnız `showScreen(name)` üzerinden.

- **Ana menü** (`#home`) — açılış animasyonundan sonra görünür. Büyük Oyna/Devam Et geçerli modu
  sürdürür; kutucuklar Seviyeler (haritayı açar) / Sonsuz / Günlük; zorluk seçimi; ⚙ Ayarlar.
- **Seviye haritası** (`#levels`, `renderLevels`) — yalnız `campaign`; 25'lik bölümler
  (`PACK_NAMES`), 5 sütun = bir tema bandı (alt şerit rengi). Açılmış seviyeler **yeniden
  oynanabilir**; kilitli = `n > max(bestLevel, sıradaki)`.
- **Ayarlar** (`#settings`) — ses, müzik, ses düzeyi, hatırlatıcılar, ilerlemeyi sıfırla
  (`askConfirm` — `window.confirm` kullanılmaz). `syncMenu()` açık ekranı tazeler; `Notify`
  izin sonucunu buradan yansıtır (adını değiştirme).
- **Duraklat** (`#pause`) — oyun içi ☰. Devam / Yeniden başla / Ana menü + hızlı ses düğmeleri.
- **Seviye tamam kartı** (`#win`, `showWinCard`) — ampuller yanınca `WIN_CARD_DELAY` sonra açılır;
  otomatik geçiş **yok**, `[Sonraki]` / `[Tekrar]` / `[Seviyeler|Ana menü]`. Kilometre taşı
  (100'ün katı, "Seviyeler" sonu) ve 25'lik ara övgü katmanları `advanceAfterWin()` içinden
  tetiklenir; kilometre taşında `[Menü]` gizlidir (kutlama/can ödülü atlanmasın).
  `game.phase`: `play` → `winWait` → `win` → `card`.

Kurallar: **`lastLevel` yalnız ileri gider** (`buildLevel`, `onWin`) — haritadan eski seviye
oynamak "Devam Et"i geri çekmez. Ana menüden aynı tahtaya dönüş (`levelKey` / `game.key`)
tahtayı yeniden kurmaz; hamleler ve süre korunur (`playMode`). Ekran ve ikon stilleri `--e-*`
tema değişkenlerinden gelir, ikonlar `<body>` başındaki SVG sprite'ındandır (`#i-*`).
Açılış animasyonu `click` ile kapanır — `pointerdown` olursa o dokunuşun click'i arkadaki
ana menü düğmesine düşüp oyunu istemeden başlatır.

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
derlemesini kırar). Android SDK düzeyleri de burada sabitlenir (`variables.gradle`):
`compileSdk`/`targetSdk` **36** (Play asgari şartı, AGP 8.7.2 + Gradle 8.9 gerektirir),
`minSdk` **24** (Play Console "otomatik koruma" 22'yi reddeder).

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
