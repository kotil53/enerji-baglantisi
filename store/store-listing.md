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
