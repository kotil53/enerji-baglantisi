# Mağaza listeleme metinleri — Enerji Bağlantısı

> Taslak. Play Console / App Store Connect'e yapıştırmadan önce gözden geçir.
> Karakter sınırları parantez içinde.

---

## Google Play

### Uygulama adı (≤30)
```
Enerji Bağlantısı
```

### Kısa açıklama (≤80)
```
Kabloları döndür, enerjiyi ampule ulaştır — sonsuz ve günlük bulmacalar.
```

### Tam açıklama (≤4000)
```
⚡ ENERJİ BAĞLANTISI

Elektrik kaynaktan çıkıyor ama ampule ulaşamıyor. Kabloları tek tek döndür,
kopuk devreyi birleştir ve bütün ampulleri yak.

Basit bir kuralı var, bırakması zor: her dokunuşta bir parça döner. Fazladan
hamle yapma — yıldızların hamle sayına bağlı.

▸ NASIL OYNANIR
• Kaynağa (⚡) ve ampullere (💡) giden yolu kur
• Parçalara dokunarak döndür
• Kilitli parçalar (🔒) sabittir — çözümü onların etrafından geçir
• Bütün ampuller yanınca seviye biter

▸ ÖZELLİKLER
• Sonsuz mod — tükenmeyen, gitgide büyüyen bulmacalar
• Günlük bulmaca — herkese aynı bölümler, her gün yenilenir
• Üç zorluk: Rahat, Normal, Zor
• Her seviyede 3 yıldız — en az hamleyle çöz
• Takıldığında ipucu: kısa bir reklam karşılığında bir kabloyu düzeltir
• Çevrimdışı çalışır — internet gerekmez
• Titreşimli geri bildirim, sade ve karanlık tasarım
• Hesap yok, giriş yok, kayıt yok

▸ HATIRLATICILAR
İstersen günlük bulmacan hazır olduğunda ya da bir süredir oynamadığında nazik
bir hatırlatma gönderir. Menüden kapatabilirsin.

Oyun ücretsizdir; seviyeler arasında ve ödül karşılığında reklam gösterir.

Kısa bir mola için de, uzun bir oturma için de: bir kablo daha döndür.
```

### Kategori / etiketler
- Uygulama türü: **Oyun**
- Kategori: **Bulmaca (Puzzle)**
- Etiketler: `beyin oyunları`, `mantık`, `rahatlatıcı`

---

## App Store (iOS)

### Alt başlık / Subtitle (≤30)
```
Kablo döndürme bulmacası
```

### Tanıtım metni / Promotional text (≤170)
```
Enerjiyi kaynaktan ampule taşı: kabloları döndür, devreyi tamamla. Her gün yeni
bir günlük bulmaca, bitmeyen sonsuz mod ve üç zorluk seviyesi. Çevrimdışı oynanır.
```

### Anahtar kelimeler / Keywords (≤100, virgülle, boşluksuz)
```
bulmaca,kablo,bağlantı,mantık,zeka,boru,devre,rahatlatıcı,çevrimdışı,beyin,puzzle,akıl
```

### Açıklama / Description
Play "Tam açıklama" metniyle aynı (yukarıdaki bloğu kullan).

### Kategori
Birincil: **Oyunlar → Bulmaca**  ·  İkincil: **Oyunlar → Kelime/Beceri** (isteğe bağlı)

---

## App Store Connect — gönderim adımları

Build zaten TestFlight'ta (CI otomatik yüklüyor). Sıra "App Store" sekmesindeki
1.0 sürümünü doldurup incelemeye göndermekte.

### Ekran görüntüleri (iOS — zorunlu, Android'inkiler GEÇMEZ)
Apple boyutları farklı. En az **6.7" / 6.9"** seti gerekir (biri yeterli, Apple
küçük cihazlara ölçekler):
- 6.9" iPhone (16 Pro Max): **1320 × 2868**
- 6.5" iPhone: 1242 × 2688 (alternatif)
Kaynak: TestFlight build'i çalışan iPhone'da ekran görüntüsü al (oynanış, menü,
kilitli parçalar, günlük mod, kazanma anı) → 3–5 adet. Simülatörden de alınır
(iPhone 16 Pro Max, tam çözünürlük).

### Metin alanları
| Alan | Değer |
|---|---|
| Name | Enerji Bağlantısı |
| Subtitle | Kablo döndürme bulmacası |
| Promotional Text | (yukarıdaki tanıtım metni) |
| Description | Play "Tam açıklama" bloğu |
| Keywords | (yukarıdaki anahtar kelimeler) |
| Support URL | `https://github.com/kotil53/enerji-baglantisi` |
| Marketing URL | (boş bırakılabilir) |
| Privacy Policy URL | `https://kotil53.github.io/enerji-baglantisi/privacy-policy.html` |
| What's New (1.0) | İlk sürüm. |
| Price | Free |

### App Privacy (Apple "besin etiketi") — AdMob'a göre
App Store Connect → App Privacy → "Get Started". Sunucumuz yok; tek veri kaynağı AdMob.

| Veri | Toplanıyor | Amaç | Kimliğe bağlı | İzleme için |
|---|---|---|---|---|
| Identifiers → Device ID | Evet | Third-Party Advertising, Analytics | Evet | **Evet** |
| Usage Data → Product Interaction | Evet | Third-Party Advertising, Analytics | Evet | **Evet** |
| Location → Coarse Location | Evet | Third-Party Advertising | Evet | **Evet** |
| Diagnostics → Crash / Performance Data | Evet | Analytics | Hayır | Hayır |

→ "This app uses data to track you" = **Evet** (AdMob reklam kimliği). ATT istemi
zaten kodda var (`requestTrackingAuthorization`).

### Age Rating (yaş derecelendirme anketi)
Şiddet / cinsellik / küfür / madde / kumar / korku: **hepsi None/No**.
"Unrestricted Web Access" = No. → Sonuç genelde **4+** (reklam varlığı yaş
derecesini yükseltmez). "Made for Kids" işaretleme — 13+ hedefliyoruz.

### Diğer sorular
- **Export Compliance**: `ITSAppUsesNonExemptEncryption=false` gömülü → soru çıkmaz.
- **Content Rights** ("üçüncü taraf içeriği?"): reklam bu soruya girmez → **No**.
- **Advertising Identifier (IDFA)**: kullanılıyor → "Serve advertisements within the
  app" kutusunu işaretle + ATT ile onurlandırıldığını beyan et.
- **App Review Information**: giriş yok → demo hesap gerekmez. Not: "Ödüllü/geçiş
  reklamları AdMob canlı; oyun tümüyle çevrimdışı."

### EU Trader Status (DSA — App Store Connect'teki uyarı)
App Store Connect → **Business** → Trader Status. Bireysel geliştiricisin; reklam
geliri var. Ticari faaliyet sayılıp sayılmadığı hukuki bir karar:
- **Trader** beyan edersen: ad + adres + telefon + e-posta App Store'da herkese
  görünür yayımlanır.
- **Non-trader**: bilgiler gizli kalır ama Apple AB dağıtımını kısıtlayabilir.
Karar senin; çoğu hobi/tek kişi ad-supported uygulama için "trader" beyanı + bir
iletişim adresi tercih ediliyor (aksi halde AB'de yayından kalkma riski).

---

## Yükleme öncesi kontrol listesi

- [ ] **Gizlilik politikası URL'si** (zorunlu — AdMob var):
      `https://kotil53.github.io/enerji-baglantisi/privacy-policy.html`
      → GitHub repo **Settings → Pages → Deploy from a branch → main / /docs** ile aç.
- [x] Uygulama ikonu — `store/assets/icon-512.png` (Play), `store/assets/icon-1024.png` (App Store). Alfa yok.
- [x] Feature graphic 1024×500 — `store/assets/feature-graphic.png` (kaynak: `feature-graphic.svg`).
- [x] Telefon ekran görüntüleri — `store/screenshots/01-oynanis.png`, `02-menu.png`, `03-kilitli-parcalar.png`, `04-gunluk-mod.png` (1280×2560, 2:1). Play min 2, 4+ önerilir → istersen gerçek cihazdan "kazanma anı" karesi ekle.
- [ ] `enerji-bulmaca.html` içinde `ADS_CFG.TEST_MODE = false` (yayın build'inden önce).
- [ ] `git tag v1.0.0 && git push origin v1.0.0` → imzalı AAB → Console'a yükle.

### Üretilen materyaller — `store/assets/` ve `store/screenshots/`
`store/assets/*.png` `icon.svg` + `feature-graphic.svg`'den `sharp` ile üretildi;
kaynakları değiştirip yeniden üretebilirsin. Ekran görüntüleri emülatörden (Pixel,
1280×2856) alınıp 1280×2560'a (Play'in "uzun kenar ≤ 2× kısa kenar" kuralı) kırpıldı.

### İçerik derecelendirmesi (IARC anketi) — beklenen yanıtlar
Şiddet: yok · Cinsellik: yok · Küfür: yok · Madde: yok · Kumar: yok
Kullanıcılar arası etkileşim / konum paylaşımı / kullanıcı içeriği: yok
Dijital satın alma: şu an yok (reklam var). → Sonuç: **Herkes / 3+**

### Hedef kitle
**13 yaş ve üzeri.** (Reklam + reklam kimliği kullanıldığı için 13 yaş altını
hedeflemek "Aileler" politikasını ve sertifikalı reklam SDK yapılandırmasını
tetikler; bundan kaçınmak için 13+.)

### Play Console "Veri güvenliği" formu — AdMob'a göre
Referans: https://support.google.com/admob/answer/11150250

| Veri türü | Toplanır | Paylaşılır | Amaç |
|---|---|---|---|
| Konum → Yaklaşık konum | Evet | Evet | Reklamlar |
| Cihaz veya diğer kimlikler | Evet | Evet | Reklamlar, Analiz, Sahtekârlık önleme |
| Uygulama etkinliği → Uygulama etkileşimleri | Evet | Evet | Reklamlar, Analiz |
| Uygulama bilgileri ve performansı → Çökme günlükleri, Tanılama | Evet | Hayır | Analiz |

- Aktarımda şifreleme: **Evet**
- Veri silme talebi yolu: kullanıcı verisi sunucumuzda tutulmuyor; yerel veri
  uygulamanın kaldırılmasıyla siler. İletişim: osmankotil@outlook.com
- Bu tablo yalnızca AdMob içindir; başka SDK yok. Mediation eklersen güncelle.
