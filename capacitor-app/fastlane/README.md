# fastlane — App Store Connect mağaza metni otomasyonu

App Store Connect'teki **metin alanlarını** (ad, alt başlık, açıklama, anahtar
kelimeler, tanıtım metni, sürüm notu, destek/gizlilik URL'si) ve **yaş derecesi
anketini** `deliver` ile yönetir. Tek doğruluk kaynağı `fastlane/metadata/`.

> **Kapsam dışı.** Binary (`.ipa`) yüklemesi burada değil — o iş
> `.github/workflows/ios.yml` > `release-ipa` (xcodebuild + `altool`).
> Ekran görüntüsü, App Privacy "besin etiketi", EU Trader Status, Content
> Rights, ilk uygulama kaydı ve **"Submit for Review"** elle yapılır
> (bkz. `../../store/store-listing.md`).

## Ne yönetiliyor

| Dosya | App Store Connect alanı |
|---|---|
| `metadata/tr/name.txt` | Name (≤30) |
| `metadata/tr/subtitle.txt` | Subtitle (≤30) |
| `metadata/tr/promotional_text.txt` | Promotional Text (≤170) |
| `metadata/tr/keywords.txt` | Keywords (≤100, virgülle, boşluksuz) |
| `metadata/tr/description.txt` | Description (≤4000) |
| `metadata/tr/release_notes.txt` | What's New (sürüm notu) |
| `metadata/tr/support_url.txt` | Support URL |
| `metadata/tr/privacy_url.txt` | Privacy Policy URL |
| `metadata/app_rating_config.json` | Age Rating anketi (hepsi 0/false → 4+) |
| `screenshots/tr/*.png` | Ekran görüntüleri — yalnız `include_screenshots=true` iken |

`deliver` yalnız **var olan** dosyaları yükler; App Store Connect'te elle
ayarladığın diğer alanlara (kategori, telif, App Review Information, fiyat,
ülke) **dokunmaz**.

## Ön koşullar (bir kez)

1. App Store Connect'te uygulama kaydı var (`com.enerji.baglantisi`) — zaten
   var (`ios.yml` `release-ipa` bunu kullanıyor).
2. **App Information → Primary Language = Türkçe.** Değilse `metadata/tr/`
   klasörünü o dilin koduna göre yeniden adlandır (örn. `en-US`).
3. Sırlar (`ios.yml` ile **aynı**, yeni yok):
   `APPSTORE_API_ISSUER_ID` + `APPSTORE_API_PRIVATE_KEY` (`.p8`'in base64'ü).
   Key ID gizli değil → workflow'da sabit (`Z4B2M8QU2M`).
4. API anahtarının rolü **App Manager** (veya Admin) olmalı — `deliver` metin
   yazabilmek için bu yetkiyi ister (yalnız "Developer" yetmez).

## Çalıştırma — GitHub Actions

**Actions → "iOS mağaza metinleri" → Run workflow**

| Girdi | Anlamı |
|---|---|
| `mode = pull` | App Store Connect'teki **canlı** metinleri indirir, `metadata_live/` artifact'ı olarak yükler. **Hiçbir şey yazmaz.** Önce bununla mevcut durumu gör. |
| `mode = push` | `metadata/` içindekini App Store Connect'e **yazar.** İncelemeye göndermez, yayınlamaz — sürüm "Prepare for Submission" kalır. |
| `version` | Düzenlenecek App Store sürümü (varsayılan `1.0`). Yoksa `deliver` oluşturur. |
| `include_screenshots` | `push` sırasında `screenshots/` içindekileri de yükler (varsayılan kapalı). |

Tipik akış: önce `pull` → diff'e bak → sonra `push`.

## Yerelden (opsiyonel, macOS/Ruby gerekir)

```bash
cd capacitor-app
export ASC_API_KEY_JSON=/tam/yol/asc_api_key.json   # {key_id, issuer_id, key, in_house:false}
fastlane deliver download_metadata --api_key_path "$ASC_API_KEY_JSON" \
  --app_identifier com.enerji.baglantisi --metadata_path fastlane/metadata_live
ASC_APP_VERSION=1.0 fastlane ios metadata_push
```

## Elle kalan (otomasyon dışı) — kısa liste

- **Ekran görüntüleri:** 6.9" iPhone'da (TestFlight build) çek, `screenshots/tr/`
  içine `01-*.png … ` koy, `include_screenshots=true` ile push et.
- **App Privacy** (besin etiketi), **Age Rating** son onayı, **EU Trader
  Status**, **Content Rights**, **IDFA** beyanı, fiyat/ülke, **Submit for
  Review** → App Store Connect'te elle (bkz. `store/store-listing.md`).
