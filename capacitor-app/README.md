# Enerji Bağlantısı — Capacitor paketi

Tek dosyalık oyunu (`../enerji-bulmaca.html`) **Android** ve **iOS** uygulamasına
çevirir. Oyun kodu bu klasörde **kopyalanmaz**; `sync.mjs` her derleme öncesi
kökteki HTML'i `www/index.html` olarak buraya taşır — böylece tek bir kaynak dosya
kalır, sürüm kayması olmaz.

## Gereksinimler

| Hedef   | Gerekli |
|---------|---------|
| Ortak   | Node.js 18+, npm |
| Android | Android Studio + JDK 17 + Android SDK (API 34) |
| iOS     | yalnızca macOS: Xcode 15+, CocoaPods (`sudo gem install cocoapods`) |

## Kurulum (bir kez)

```bash
cd capacitor-app
npm install

# Native platform projelerini oluştur (oyun otomatik www/'e kopyalanır)
npm run add:android
npm run add:ios        # yalnız macOS

# Uygulama ikonu + açılış ekranını üret (assets/icon.svg, assets/splash.svg)
npm run assets
```

## Geliştirme döngüsü

Oyunu **her zaman kök dizindeki `enerji-bulmaca.html`** üzerinde düzenle, sonra:

```bash
npm run cap:sync              # www'e kopyala + native projelere işle
npm run open:android          # Android Studio'da aç -> Run
npm run open:ios              # Xcode'da aç -> Run   (yalnız macOS)
```

Cihaz bağlıysa tek komutla:

```bash
npm run run:android
npm run run:ios
```

## Mağazaya yükleme

### Android (Play Store)
1. Android Studio → **Build > Generate Signed App Bundle** → `.aab`
2. İlk kez: bir **keystore** oluştur ve sakla (kaybolursa güncelleme yapılamaz).
3. `android/app/build.gradle` içinde `versionCode` / `versionName` yükselt.
4. `.aab` dosyasını [Play Console](https://play.google.com/console)'a yükle.
5. `applicationId` = `com.enerji.baglantisi` (değiştirmek istersen
   `capacitor.config.json > appId` + `npx cap sync` + native projeyi yeniden ekle).

### iOS (App Store)
1. Xcode → **Signing & Capabilities** → kendi Apple Developer takımını seç.
2. **Product > Archive** → **Distribute App** → App Store Connect.
3. `ios/App/App/Info.plist` içinde sürüm (`CFBundleShortVersionString`) yükselt.
4. Bundle ID = `com.enerji.baglantisi`.

## CI / Otomatik derleme (GitHub Actions)

Depo kökündeki `.github/workflows/` iki iş akışı içerir. Her ikisi de native
`android/` ve `ios/` klasörlerini **sıfırdan** üretir (`npm run add:android|ios`
→ `sync.mjs` + `cap add` + `scripts/apply-native-config.mjs`), yani bu klasörlerin
sürüm kontrolüne alınmasına gerek yoktur.

| İş akışı | Ne zaman | Çıktı (Actions → Artifacts) | Sır gerekir mi |
|----------|----------|-----------------------------|----------------|
| **Android derleme** (`android.yml`) | her `push`/PR (`main`) | imzasız `app-debug.apk` | hayır |
| ↳ release işi | `v*` tag'i **veya** elle "release" | imzalı `app-release.aab` + GitHub Release | evet (aşağıda) |
| **iOS derleme** (`ios.yml`) | `push`/PR (`main`), tag | imzasız `App.xcarchive.zip` (derleme doğrulaması) | hayır |
| ↳ release-ipa işi | `v*` tag'i **veya** elle "release" | imzalı App Store `.ipa` | evet (aşağıda) |

Sürümleme: `versionCode` = GitHub `run_number`, `versionName` = tag'den (`v1.2.3`
→ `1.2.3`) ya da tag yoksa `0.0.0-ci.<run>`. `apply-native-config.mjs` bunları
`build.gradle` / xcodebuild ayarlarına işler.

### Gerekli GitHub Secrets

Depo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Zorunlu | Ne |
|--------|---------|----|
| `ANDROID_KEYSTORE_BASE64` | release AAB için | `base64 -w0 release.jks` çıktısı |
| `ANDROID_KEYSTORE_PASSWORD` | release AAB için | keystore parolası |
| `ANDROID_KEY_ALIAS` | release AAB için | anahtar alias'ı |
| `ANDROID_KEY_PASSWORD` | release AAB için | anahtar parolası |
| `ADMOB_APP_ID_ANDROID` | opsiyonel | canlı AdMob App ID (`ca-app-pub-…~…`); yoksa Google test ID'si |
| `ADMOB_APP_ID_IOS` | opsiyonel | canlı AdMob App ID (iOS); yoksa Google test ID'si |
| `APPSTORE_API_KEY_ID` | imzalı IPA için | App Store Connect API anahtarının Key ID'si |
| `APPSTORE_API_ISSUER_ID` | imzalı IPA için | App Store Connect API Issuer ID (uuid) |
| `APPSTORE_API_PRIVATE_KEY` | imzalı IPA için | `base64 -w0 AuthKey_XXXXXXXXXX.p8` çıktısı |
| `APPSTORE_TEAM_ID` | imzalı IPA için | Apple Developer Team ID (10 karakter) |

Keystore/API anahtarı sırları tanımlı değilse ilgili release işi kendini atlar
(uyarı basar) — debug APK / imzasız archive yine üretilir.

### Yayına çıkış

```bash
git tag v1.0.0 && git push origin v1.0.0
```

→ `android.yml` imzalı `.aab` üretir ve `v1.0.0` GitHub Release'ine ekler.
`.aab`'yi indirip [Play Console](https://play.google.com/console)'a yükle.
Canlı reklam için ayrıca `../enerji-bulmaca.html` içinde `AD_UNITS.live` +
`ADS_CFG.TEST_MODE = false` (bkz. "Reklam (AdMob)").

### iOS imzalı dağıtım

`release-ipa` işi, **App Store Connect API anahtarı** ile otomatik imzalama
kullanır (`.p12`/Keychain gerekmez — Xcode CI runner'ında sertifika + provisioning
profilini kendisi oluşturur/indirir, `-allowProvisioningUpdates` +
`-authenticationKeyPath/-ID/-IssuerID`). Kurulum:

1. developer.apple.com → **Certificates, Identifiers & Profiles → Identifiers** →
   `com.enerji.baglantisi` için **App ID** kaydet (Explicit).
2. App Store Connect → **Apps → New App** → aynı Bundle ID ile uygulamayı oluştur.
3. App Store Connect → **Users and Access → Integrations → App Store Connect API**
   → **App Manager** erişimli bir anahtar üret → `.p8` dosyasını indir (bir kez!),
   Key ID + Issuer ID'yi not al.
4. developer.apple.com → **Account → Membership details** → Team ID'yi not al.
5. Yukarıdaki 4 secret'ı ekle (`APPSTORE_API_KEY_ID`, `APPSTORE_API_ISSUER_ID`,
   `APPSTORE_API_PRIVATE_KEY` = `.p8`'in base64'ü, `APPSTORE_TEAM_ID`).

`git tag v1.0.0 && git push origin v1.0.0` → `release-ipa` işi `enerji-baglantisi-ipa`
artifact'ını üretir → indirip [App Store Connect](https://appstoreconnect.apple.com)'e
(Transporter uygulaması ya da `xcrun altool`) yükle.

## Yapılandırma nerede?

| Ne | Dosya |
|----|-------|
| Uygulama adı / kimliği / arka plan | `capacitor.config.json` |
| CI derleme akışları | `.github/workflows/android.yml`, `ios.yml` |
| Native son-rötuş (AdMob App ID, sürüm, UMP pod sabiti) | `scripts/apply-native-config.mjs` |
| Açılış ekranı süresi, durum çubuğu | `capacitor.config.json > plugins` |
| İkon / splash kaynak görselleri | `assets/icon.svg`, `assets/splash.svg` → `npm run assets` |
| Oyun kodu | `../enerji-bulmaca.html` (tek kaynak) |

## Native entegrasyon (oyun içinde)

`enerji-bulmaca.html` şu Capacitor eklentilerini **varsa** kullanır, yoksa
sessizce web karşılıklarına döner (tarayıcıda da sorunsuz çalışır):

- **@capacitor/haptics** — kablo dönüşü / kilitli parça / kazanma titreşimi
- **@capacitor/status-bar** — koyu durum çubuğu + `#0a0e1a` arka plan
- **@capacitor/splash-screen** — açılışta otomatik gizlenir
- **@capacitor/app** — Android geri tuşu → oyun menüsünü açar/kapatır
- **@capacitor/local-notifications** — "oyuna geri dön" yerel hatırlatıcıları

Bu eklentiler `package.json`'da tanımlı; `npm install` sonrası `npx cap sync`
ile native tarafa bağlanır.

## Reklam (AdMob) — para kazanma

Uygulama olarak paketlenince oyun **geçiş** (seviyeler arası) ve **ödüllü**
(💡 ipucu + "bu seviyeyi geç") reklam gösterir. Tarayıcıda veya eklenti
yüklü değilken reklam kodu **sessizce devre dışı** kalır; oyun aynen çalışır.
Ödüllü reklam hazır değilse ödül yine verilir (oyuncu engellenmez).

Eklenti: `@capacitor-community/admob` (`package.json`'da tanımlı — `npm install` yeter).

### 1) Native App ID (zorunlu)

`android/` ve `ios/` klasörleri `.gitignore`'da ve `cap add` ile yeniden
üretiliyor — bu düzenlemeleri **`cap add` sonrası her seferinde** uygula
(ya da bu iki dosyayı sürüm kontrolüne al).

**Android** — `android/app/src/main/AndroidManifest.xml`, `<application>` içine:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>
```

**iOS** — `ios/App/App/Info.plist` içine:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-3940256099942544~1458002511</string>
<key>NSUserTrackingUsageDescription</key>
<string>Reklamları ilgi alanlarınıza göre kişiselleştirmek için kullanılır.</string>
```

> Yukarıdakiler Google'ın **test App ID**'leri. iOS'ta ayrıca Google'ın güncel
> **SKAdNetworkItems** listesini Info.plist'e eklemen önerilir
> (Google Mobile Ads iOS dokümanı). Yayına çıkmadan kendi AdMob App ID'lerinle değiştir.

### 2) Gerçek reklam birimleri

`AD_UNITS.live` **dolu** (`../enerji-bulmaca.html`): kendi AdMob birim ID'lerin.
Reklam biçimleri: `interstitial` → **Geçiş**, `rewarded` slotu → **Ödüllü geçiş
reklamı** (rewarded interstitial — kod `prepareRewardInterstitialAd` kullanır).

Yayına hazır olunca yapılacak **tek şey**:

1. `../enerji-bulmaca.html` içinde `ADS_CFG.TEST_MODE = false` yap.
   (Öncesinde `TEST_MODE: true` kalsın — kendi canlı reklamına tıklamak hesabı
   kapatır; test modunda Google'ın test birimleri + `isTesting` kullanılır.)
2. Native App ID'leri: CI'da `ADMOB_APP_ID_ANDROID` / `ADMOB_APP_ID_IOS`
   secret'larını kendi App ID'lerinle (`ca-app-pub-…~…`) tanımla.

### 3) Ayarlar — `../enerji-bulmaca.html` > `ADS_CFG`

| Anahtar | Ne işe yarar |
|---------|--------------|
| `INTERSTITIAL_EVERY` | Kaç seviye tamamlamada bir geçiş reklamı (sonsuz mod) |
| `INTERSTITIAL_MIN_LEVEL` | Bu seviyeye kadar geçiş reklamı gösterme |
| `INTERSTITIAL_COOLDOWN_MS` | İki geçiş reklamı arası en az süre (ms) |

`Ads.removed` (localStorage: `enerji.v1.ads.removed`) `true` yapılırsa tüm
reklamlar kapanır — ileride "Reklamsız" satın alımı için hazır kanca.

Derleme: `npm run cap:sync` (oyunu `www/`'e kopyalar + native tarafa işler).

## Bildirimler (yerel hatırlatıcılar)

Eklenti: `@capacitor/local-notifications` (`package.json`'da tanımlı — `npm install`
sonrası `npx cap sync` yeter; izin/receiver girişleri eklentinin kendi
manifest'inden otomatik birleşir, `AndroidManifest.xml`'e elle ekleme gerekmez).

**Sunucu yok.** Sadece cihazda planlanan "oyuna geri dön" hatırlatıcıları:

| ID | Ne zaman | Mesaj |
|----|----------|-------|
| 4101 | +1 gün 19:00 | rastgele "geri dön" mesajı |
| 4102 | +3 gün 19:00 | "İki gün oldu — seriyi bozma!" |
| 4103 | +7 gün 19:00 | "Uzun zaman oldu. Kaldığın yerden devam et" |
| 4110 | +1 gün 10:00 | "Bugünün günlük bulmacası hazır" |

- **Varsayılan açık.** İlk açılışta sistem izin penceresi otomatik gösterilir
  (Android 13+ `POST_NOTIFICATIONS` / iOS). İzin bir kez sorulur (`notify.asked`);
  reddedilirse ayar sessizce kapanır ve menü bunu yansıtır. Kullanıcı menüdeki
  **Hatırlatıcılar → Kapalı** ile istediği an durdurur.
- Her uygulama açılışında ve öne gelişinde (`App` `resume`) hatırlatıcılar
  **sıfırdan planlanır** → bildirim yalnızca oyuncu o kadar gün oynamadıysa düşer.
- Tarayıcıda veya eklenti yokken menü grubu **soluk** görünür, kod no-op olur.
- Ayarlar oyun içinde `Notify` modülünde (`../enerji-bulmaca.html`): `_ids`,
  `schedule()` içindeki `at(gün, saat)` çağrıları ve mesaj metinleri.
- İzin penceresini "ilk seviye bitince" göstermek (opt-in oranı için daha iyi)
  istersen: `Notify.init()` içindeki otomatik `_request()` çağrısını `onWin()`
  içine taşı — mantık aynı kalır.

## Notlar

- `www/`, `android/`, `ios/`, `node_modules/` sürüm kontrolüne girmez
  (bkz. `.gitignore`); hepsi komutlarla yeniden üretilir.
- Cordova tercih edersen: `enerji-bulmaca.html`'i `www/index.html` yap,
  `cordova platform add android ios`, `cordova build`. Oyun tarafında değişiklik
  gerekmez (aynı guard'lı native kod Cordova'da da zararsızdır).
