# Proje Planı — Domain Info

## 1. Proje Tanımı ve Kapsam

### 1.1 Proje Amacı

Domain Info, kullanıcıların bir domain hakkında kapsamlı ağ tanılama bilgisi almasını sağlayan full-stack bir web uygulamasıdır. DNS kayıtlarından traceroute'a, WHOIS verisinden ASN bilgisine kadar beş farklı sorgu türünü tek bir arayüzde toplar. Kullanıcı kimlik doğrulaması ile kişiye özel sorgu geçmişi ve istatistikler sunar.

### 1.2 Kapsam

**Dahil olanlar:**

- Kullanıcı kaydı ve JWT tabanlı kimlik doğrulama
- DNS kaydı sorgulama (A, AAAA, MX, NS, TXT, CNAME, PTR)
- Traceroute (hop bazlı ağ yolu takibi)
- WHOIS alan adı bilgisi sorgulama
- ASN / IP bilgisi sorgulama (Team Cymru)
- 1 saatlik SQLite önbellekleme
- Sayfalı sorgu geçmişi
- Kullanıcı bazlı istatistikler

**Kapsam dışı:**

- Ödeme / faturalandırma sistemi
- Çoklu dil desteği (i18n)
- E-posta doğrulama / şifre sıfırlama
- Yönetici paneli
- Rate limiting

### 1.3 Teknoloji Seçimi

| Katman | Teknoloji | Seçim Gerekçesi |
|---|---|---|
| Frontend | React 19 + Vite 8 + TypeScript | Hızlı geliştirme, strict tip kontrolü |
| Backend | Hono 4 + Node.js | Hafif, hızlı, Zod entegrasyonu kolay |
| Veritabanı | SQLite + Prisma ORM | Kurulum gerektirmez, taşınabilir, migration desteği |
| Auth | argon2 + Hono JWT | Güvenli şifre hashleme, basit token yönetimi |
| Hata yönetimi | oxide.ts | Rust-like Option/Result ile null-güvenli kod |
| Test | Vitest | Hızlı, Vite ile uyumlu, izole test ortamı |
| Ağ araçları | node:dns, nodejs-traceroute, whois | Yerleşik / topluluk tarafından desteklenen kütüphaneler |

---

## 2. İş Kırılım Yapısı (WBS)

### WP1: Proje Kurulumu ve Temel API (29 Haziran)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP1.1 | Proje iskelesi, Hono + TypeScript kurulumu | 1,5 saat | `ea9f2a9`, `c5e36af` |
| WP1.2 | Temel DNS lookup API endpoint'i | 1 saat | `be02f67` |
| WP1.3 | CORS middleware, Zod validasyon | 1 saat | `c9c275a`, `62055c0`, `43bfa0e` |
| WP1.4 | ESLint yapılandırması, kod dokümantasyonu | 1 saat | `067eca7`, `bd414dc`, `f3491f5` |

**Toplam:** ~4,5 saat

---

### WP2: Veritabanı Tasarımı ve DNS Cache (30 Haziran)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP2.1 | Prisma kurulumu, schema tasarımı | 1 saat | `f2d4053`, `62caa02` |
| WP2.2 | DNS lookup cache + DB persist | 3,5 saat | `84c69f8`, `5555c73` |

**Toplam:** ~4,5 saat

---

### WP3: Frontend Temel Yapı (1-3 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP3.1 | Client proje iskelesi, Vite proxy, koyu tema | 1 saat | `2b3a75e` |
| WP3.2 | Ortak tip tanımları ve API katmanı | 1,5 saat | `c77bd3e`, `a4df8cd` |
| WP3.3 | Lookup form + ResultsPanel bileşenleri | 3,5 saat | `78edaca`, `eb8bc8d`, `b0686d3` |
| WP3.4 | Collapsible accordion + CSS + düzeltmeler | 2 saat | `b5ecbd4`, `d262283` |
| WP3.5 | README ve dökümantasyon | 0,5 saat | `a3d925d` |

**Toplam:** ~8,5 saat

---

### WP4: Kimlik Doğrulama ve Test Altyapısı (6-7 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP4.1 | Kod iyileştirme, linting, CSS düzeltmeleri | 2 saat | `085adaa`, `939ae98`, `85e7c5b`, `7579098` |
| WP4.2 | TXT kaydı düzeltmesi, MX priority fix | 1 saat | `c93df86`, `8094350`, `217c2db` |
| WP4.3 | User, ASNLookup ve diğer modeller | 0,5 saat | `6a01a3b` |
| WP4.4 | Auth sistemi (register/login/logout, JWT, argon2) | 2 saat | `5ffd986`, `faba7e8` |
| WP4.5 | Vitest test altyapısı, auth testleri | 1 saat | `0ebf09a` |

**Toplam:** ~6,5 saat

---

### WP5: DNS İyileştirmeleri ve Hata Yönetimi (8 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP5.1 | AAAA kaydı implementasyonu | 1 saat | `8ebb6a4`, `81551b6` |
| WP5.2 | Client-server tip senkronizasyonu | 0,5 saat | `5b3653c` |
| WP5.3 | oxide.ts entegrasyonu (Option/Result/match) | 1 saat | `6407abd`, `c272a1c` |

**Toplam:** ~2,5 saat

---

### WP6: Traceroute ve WHOIS (8 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP6.1 | nodejs-traceroute entegrasyonu, cache | 2,5 saat | `df5c467` |
| WP6.2 | WHOIS sorgulama + metin parse + cache | 4 saat | `82fd6af` |

**Toplam:** ~6,5 saat

---

### WP7: ASN, History, Stats Backend + PTR (9-10 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP7.1 | ASN sorgulama (Team Cymru DNS) + cache | 2 saat | `e70f09c` |
| WP7.2 | Merkezi validasyon yardımcıları | 0,5 saat | `c332ba4` |
| WP7.3 | History ve Stats route'ları (iskelet) | 0,5 saat | `47e06c4` |
| WP7.4 | Hata yönetimi iyileştirmeleri | 0,5 saat | `1a3d97a`, `da5f272`, `287cba8` |
| WP7.5 | PTR kaydı implementasyonu | 0,5 saat | `815ff12` |
| WP7.6 | WHOIS cache düzeltmesi, veri yarışı fix'i | 0,5 saat | `086181f`, `8e86f98` |
| WP7.7 | Stats ve History servis implementasyonu | 3 saat | `c50d5cd` |
| WP7.8 | README genişletme | 0,5 saat | `501b481`, `11bf983` |

**Toplam:** ~8 saat

---

### WP8: Frontend Auth + History/Stats UI (10-12 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP8.1 | AuthPanel + AuthProvider (giriş/kayıt arayüzü) | 3 saat | `acb1743` |
| WP8.2 | HistoryPanel (sayfalı liste, genişletilebilir) | 4 saat | `6b76423`, `67c8cb5` |
| WP8.3 | useLookup hook, PtrResult, boş kayıt metni | 2 saat | `2d02f91`, `02d47f7` |

**Toplam:** ~9 saat

---

### WP9: Son Düzenlemeler (14 Temmuz)

| İş Paketi | Açıklama | Tahmini Süre | Git Commit'leri |
|---|---|---|---|
| WP9.1 | Hata mesajlarını ve sabitleri merkezileştirme | 1,5 saat | `4e583b1` |

**Toplam:** ~1,5 saat

---

## 3. Zaman Çizelgesi

| İş Paketi | Başlangıç | Bitiş | Süre (saat) | Bağımlılık |
|---|---|---|---|---|
| WP1: Kurulum ve Temel API | 29 Haz 16:07 | 29 Haz 19:17 | 4,5 | — |
| WP2: Veritabanı + DNS Cache | 30 Haz 09:19 | 30 Haz 13:49 | 4,5 | WP1 |
| WP3: Frontend Temel Yapı | 1 Tem 15:42 | 3 Tem 21:02 | 8,5 | WP2 |
| WP4: Auth + Test Altyapısı | 6 Tem 20:09 | 7 Tem 16:41 | 6,5 | WP3 |
| WP5: DNS İyileştirmeleri | 8 Tem 10:58 | 8 Tem 12:00 | 2,5 | WP4 |
| WP6: Traceroute + WHOIS | 8 Tem 13:52 | 8 Tem 19:53 | 6,5 | WP4 |
| WP7: ASN + History/Stats + PTR | 9 Tem 09:31 | 10 Tem 17:19 | 8,0 | WP5, WP6 |
| WP8: Frontend Auth + History/Stats | 10 Tem 20:01 | 12 Tem 19:11 | 9,0 | WP7 |
| WP9: Son Düzenlemeler | 14 Tem 13:09 | 14 Tem 13:09 | 1,5 | WP8 |

**Toplam süre:** ~51,5 saat (10 takvim gününe yayılmış)

### Gantt Şeması (Özet)

```text
            29  30   1   2   3   4   5   6   7   8   9  10  11  12  13  14
            Haz Haz Tem Tem Tem Tem Tem Tem Tem Tem Tem Tem Tem Tem Tem Tem
WP1 Kurulum XXXX
WP2 VeriT.      XXXX
WP3 Front.           XX      XXXX
WP4 Auth                             XX  XXXX
WP5 DNS İyi.                                XX
WP6 Trace+WHOIS                             XXXXXX
WP7 Hist+Stats                                     XXXXXX
WP8 FrontAuth                                          XXXXXXXXXXXX
WP9 Son Düz.                                                       XX
```

---

## 4. Kaynak Planlaması

### 4.1 İnsan Kaynağı

| Rol | Kişi | Sorumluluk |
|---|---|---|
| Tam Yığın Geliştirici | Ozan Malci | Tüm geliştirme, test, dokümantasyon |

### 4.2 Donanım / Yazılım Kaynakları

| Kaynak | Açıklama |
|---|---|
| Geliştirme ortamı | Windows 11, VS Code, PowerShell 7 |
| Sürüm kontrolü | Git + GitHub |
| Çalışma zamanı | Node.js 22+ |
| Paket yöneticisi | npm |
| Harici servisler | Team Cymru DNS (ASN), genel DNS sunucuları, WHOIS sunucuları |

### 4.3 Maliyet

Proje tamamen açık kaynak araçlar ve ücretsiz harici servisler kullanılarak geliştirilmiştir. Herhangi bir lisans ücreti, bulut hizmeti veya altyapı maliyeti bulunmamaktadır.

---

## 5. Risk Analizi

| # | Risk | Olasılık | Etki | Azaltma Stratejisi |
|---|---|---|---|---|
| R1 | `nodejs-traceroute` event-based API'si, Promise ile sarmalanırken bellek sızıntısı veya zombie process oluşabilir | Orta | Yüksek | 60 saniye timeout uygulandı; cleanup için abort mekanizması test edildi |
| R2 | WHOIS sunucuları her domain için farklı formatta yanıt döner, parse kırılganlığı | Yüksek | Orta | `registrar`, `creationDate`, `expirationDate`, `nameServers` alanları `Option` olarak tanımlandı; parse başarısız olsa bile `rawData` her zaman döner |
| R3 | Harici DNS/WHOIS sorguları rate-limit'e takılabilir veya timeout olabilir | Orta | Düşük | 1 saatlik cache, tekrarlayan sorguları engeller; timeout/başarısız sorgular uygun hata mesajıyla kullanıcıya bildirilir |
| R4 | SQLite concurrent write kısıtlaması, çok kullanıcılı senaryoda darboğaz olabilir | Düşük | Orta | Mevcut durumda tek kullanıcılı/düşük trafikli senaryo; production'da PostgreSQL'e geçiş yolu açık |
| R5 | JWT secret'ın zayıf olması veya sızması güvenlik açığı oluşturur | Düşük | Yüksek | En az 32 karakter zorunluluğu, placeholder kontrolü, production'da `NODE_ENV=production` ile secure cookie |

---

## 6. Kalite Yönetimi

### 6.1 Kod Kalitesi

| Uygulama | Araç | Açıklama |
|---|---|---|
| Statik analiz | ESLint (strict config) | `npx eslint .` ile tüm dosyalar denetlenir |
| Tip güvenliği | TypeScript 6 (strict mode) | `tsc -b` ile tip kontrolü |
| Kod formatı | Prettier | Otomatik formatlama |

### 6.2 Test Stratejisi

| Seviye | Çerçeve | Kapsam |
|---|---|---|
| Birim testleri | — | Mevcut değil; servis fonksiyonları manuel test edildi |
| Entegrasyon testleri | Vitest | `app.request()` ile uçtan uca HTTP testleri |
| Test izolasyonu | Vitest + ayrı SQLite DB | `prisma/test.db` üzerinde her test öncesi tablolar temizlenir |

**Test kapsamındaki alanlar:**

- Kullanıcı kaydı, giriş, oturum kontrolü, çıkış (`auth.test.ts`)
- WHOIS sorgulama (mocked) (`whois.test.ts`)
- Geçmiş sayfalama, kullanıcı izolasyonu, cache hit oranı hesaplaması (`history-stats.test.ts`)

### 6.3 Sürekli Entegrasyon

Bu projede CI/CD pipeline'ı kurulmamıştır. Testler ve lint manuel olarak çalıştırılır:

```bash
cd server && npm run lint && npm run test
cd client && npm run lint && tsc -b
```

---

## 7. Teslimatlar

| # | Teslimat | Format | Durum |
|---|---|---|---|
| D1 | Kaynak kod | Git repo (`domain_info`) | Tamamlandı |
| D2 | Veritabanı şeması | Prisma migration dosyaları (3 migration) | Tamamlandı |
| D3 | API dokümantasyonu | README.md (uç nokta tablosu + örnekler) | Tamamlandı |
| D4 | Kurulum kılavuzu | README.md (Quick Start bölümü) | Tamamlandı |
| D5 | Test paketi | 3 Vitest test dosyası | Tamamlandı |
| D6 | Yazılım/Sistem Tasarımı | `docs/yazilim-sistem-tasarimi.md` | Tamamlandı |
| D7 | Proje Planı | `docs/proje-plani.md` (bu belge) | Tamamlandı |

---

## 8. Proje Değerlendirmesi

### Gerçekleşen vs Planlanan

Proje tek geliştiriciyle, boş zamanlarda, toplam **10 takvim günü** içinde tamamlanmıştır. Net çalışma süresi yaklaşık **51,5 saat** olarak gerçekleşmiştir.

| Faz | Planlanan (gün) | Gerçekleşen (gün) | Sapma |
|---|---|---|---|
| Backend temel | 2 | 2 (29-30 Haz) | — |
| Frontend temel | 2 | 2 (1-3 Tem) | +1 gün (hafta sonu) |
| Auth + Test | 1 | 1 (7 Tem) | — |
| Traceroute + WHOIS | 1 | 1 (8 Tem) | — |
| ASN + History + Stats | 2 | 2 (9-10 Tem) | — |
| Frontend tamamlama | 2 | 3 (10-12 Tem) | +1 gün |
| Son düzeltmeler | 1 | 1 (14 Tem) | — |

### Çıkarılan Dersler

1. SQLite + Prisma kombinasyonu hızlı prototipleme için idealdir; ancak concurrent write senaryolarında dikkatli olunmalıdır
2. `oxide.ts` ile Rust-like hata yönetimi, erken aşamada entegre edildiğinde kod kalitesini belirgin şekilde artırmıştır
3. 1 saatlik cache stratejisi, harici servis bağımlılıklarını azaltmada etkilidir
4. Tüm lookup türleri için ortak bir cache pattern'i kullanmak, yeni sorgu türü eklemeyi kolaylaştırmıştır
5. `app.request()` ile Vitest entegrasyon testleri, gerçek HTTP akışını taklit etmede başarılı olmuştur
