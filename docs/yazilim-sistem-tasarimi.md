# Yazılım / Sistem Tasarımı — Domain Info

## 1. Genel Mimari

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (port 5173)                        │
│  React 19 + Vite 8 + TypeScript 6 + oxide.ts                    │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ AuthPanel│  │LookupView│  │History   │  ┌──────────────────┐ │
│  │(giriş/   │  │          │  │Panel     │  │ API Katmanı      │ │
│  │ kayıt)   │  │ Lookup   │  │          │  │ (api.ts)         │ │
│  │          │  │ Form     │  │ Stats    │  │                  │ │
│  │          │  │ Results  │  │ Panel    │  │ fetch -> Result   │ │
│  │          │  │ Panel    │  │          │  │ Option mapping   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP (Vite proxy /api -> :6633)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (port 6633)                         │
│  Hono 4 + Node.js 22 + TypeScript 6 + Zod 4                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE                            │    │
│  │  cors() -> requireAuth (JWT cookie) -> error handler  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      ROUTES                              │    │
│  │  /api/auth/*    /api/lookup    /api/traceroute           │    │
│  │  /api/whois     /api/asn       /api/ptr                  │    │
│  │  /api/history   /api/stats     /health                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    SERVICES                              │    │
│  │                                                          │    │
│  │  authService      dnsService       lookupService         │    │
│  │  tracerouteSvc    tracerouteCache  whoisService          │    │
│  │  whoisCacheSvc    asnService       asnCacheSvc           │    │
│  │  historyService   statsService                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   SQLite     │ │  External    │ │  External    │            │
│  │   (Prisma)   │ │  DNS Servers │ │  WHOIS       │            │
│  │              │ │  (node:dns,  │ │  Servers     │            │
│  │  1h Cache    │ │  Team Cymru) │ │  (whois pkg) │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Kullanım Senaryoları (Use Case)

### UC-1: Kullanıcı Kaydı ve Girişi

- Kullanıcı email ve şifreyle kayıt olur
- argon2 ile hash'lenen şifre `User` tablosuna yazılır
- JWT token üretilir, httpOnly cookie olarak tarayıcıya set edilir (7 gün geçerli)
- Sonraki isteklerde `requireAuth` middleware cookie'den JWT'yi çözer

### UC-2: DNS Kaydı Sorgulama

- Kullanıcı bir domain girer (örn: `google.com`)
- Server 1 saatlik cache'i kontrol eder
- Cache miss -> `node:dns` modülüyle A, AAAA, MX, NS, TXT, CNAME kayıtları çekilir
- Sonuç DB'ye yazılır, history'e eklenir
- Cache hit -> önceki sonuç kopyalanır, `isCached: true` ile yeni history satırı eklenir

### UC-3: Traceroute

- Kullanıcı bir domain/IP girer
- `nodejs-traceroute` ile 60 saniye timeout'lu trace başlatılır
- Her hop (hopNumber, ip, rtt1) DB'ye kaydedilir
- Cache mekanizması aynı şekilde çalışır

### UC-4: WHOIS Sorgulama

- Domain girilir -> `whois` npm paketi ile ham WHOIS verisi çekilir
- Metin parse edilir: registrar, creationDate, expirationDate, nameServers
- DB'ye yazılır, cache uygulanır

### UC-5: ASN Sorgulama

- IP adresi girilir
- Team Cymru DNS (origin.asn.cymru.com) üzerinden TXT sorgusu yapılır
- `asNumber | asName | prefix` formatında parse edilir
- Cache + history'e kaydedilir

### UC-6: Geçmiş ve İstatistik Görüntüleme

- Kullanıcı tüm lookup'larını sayfalı timeline olarak görür
- Her kayıt genişletilip detayları görüntülenebilir
- İstatistik sekmesinde: toplam sorgu, cache hit oranı, en çok sorgulanan domain'ler, registrar'lar, ASN'ler, ortalama hop sayısı

---

## 3. Modül Yapısı

### 3.1 Backend Modülleri

| Modül | Dosya(lar) | Sorumluluk |
|---|---|---|
| **Giriş noktası** | `src/index.ts`, `src/app.ts` | Sunucu başlatma, middleware zinciri, route kaydı |
| **Veritabanı** | `src/db.ts`, `prisma/schema.prisma` | Prisma client singleton, 12 model, 3 migration |
| **Kimlik doğrulama** | `routes/auth.ts`, `services/authService.ts`, `middleware/requireAuth.ts` | Register/login/logout/me, argon2 hash, JWT sign/verify, cookie yönetimi |
| **DNS servisi** | `routes/lookup.ts`, `routes/ptr.ts`, `services/dnsService.ts`, `services/lookupService.ts` | A/AAAA/MX/NS/TXT/CNAME/PTR çözümleme, 1 saat cache |
| **Traceroute servisi** | `routes/traceroute.ts`, `services/tracerouteService.ts`, `services/tracerouteCacheService.ts` | Hop bazlı trace, 60s timeout, cache |
| **WHOIS servisi** | `routes/whois.ts`, `services/whoisService.ts`, `services/whoisCacheService.ts` | WHOIS sorgusu, metin parse, cache |
| **ASN servisi** | `routes/asn.ts`, `services/asnService.ts`, `services/asnCacheService.ts` | Team Cymru DNS TXT sorgusu, IPv4/IPv6, cache |
| **Geçmiş/İstatistik** | `routes/history.ts`, `routes/stats.ts`, `services/historyService.ts`, `services/statsService.ts` | Sayfalı timeline, toplu istatistikler |
| **Validasyon** | `lib/validate.ts`, `schemas/*.schema.ts` | Zod şemaları, `parseQuery` / `parseJson` yardımcıları |
| **Tipler** | `types/app.ts`, `types/nodejs-traceroute.d.ts` | Hono context değişkenleri, harici kütüphane tip tanımları |

### 3.2 Frontend Bileşen Ağacı

```text
App
└── AuthProvider (context)
    └── App
        ├── [kimliksiz] AuthPanel
        │   └── Sign in / Create account form
        └── [kimlikli] LookupView
            ├── Sekme: Lookup
            │   ├── LookupForm (tip seçici + input + submit)
            │   ├── ResultsPanel (A, AAAA, MX, NS, TXT, CNAME accordion)
            │   ├── TracerouteResult (hop tablosu)
            │   ├── WhoisResult (registrar, tarihler, NS, raw)
            │   ├── AsnResult (AS numarası, isim, prefix)
            │   └── PtrResult (hostname listesi)
            ├── Sekme: History
            │   └── HistoryPanel (sayfalı, genişletilebilir zaman çizelgesi)
            └── Sekme: Stats
                └── StatsPanel (toplamlar, cache oranları, top listeler)
```

---

## 4. Veritabanı Tasarımı (ER Diyagramı)

```text
┌──────────┐
│  User    │
├──────────┤
│ id (PK)  │◄────────────────────────────────────────────┐
│ email    │                                             │
│ passwdHash│                                            │
│ createdAt│                                             │
└──────────┘                                             │
     │ 1                                                 │
     │                                                   │
     ├───► Lookup ────► ARecord                          │
     │                   AAAARecord                      │
     │                   MXRecord                        │
     │                   NSRecord                        │
     │                   TXTRecord                       │
     │                   CNAMERecord                     │
     │                                                   │
     ├───► Traceroute ──► Hop                            │
     │                                                   │
     ├───► Whois                                         │
     │                                                   │
     └───► ASNLookup                                     │
                                                         │
     Her lookup modelinde:                               │
     • userId (FK -> User, NOT NULL, indexed)             │
     • isCached (Boolean)                                │
     • createdAt (DateTime, indexed)                     │
                                                         │
     Detay tablolar (ARecord, Hop vb.) lookup'a          │
     ON DELETE CASCADE ile bağlı                         │
```

### Tablo Detayları

| Tablo | Alanlar | Açıklama |
|---|---|---|
| **User** | id, email (unique), passwordHash, createdAt | Kimlik doğrulama |
| **Lookup** | id, domain, isCached ("cached"), createdAt, userId | DNS ana kaydı |
| **ARecord** | id, address, lookupId (FK->Lookup CASCADE) | IPv4 adresleri |
| **AAAARecord** | id, address, lookupId (FK->Lookup CASCADE) | IPv6 adresleri |
| **MXRecord** | id, exchange, priority, lookupId (FK->Lookup CASCADE) | Mail sunucuları |
| **NSRecord** | id, nameserver, lookupId (FK->Lookup CASCADE) | Name server'lar |
| **TXTRecord** | id, value, lookupId (FK->Lookup CASCADE) | TXT kayıtları |
| **CNAMERecord** | id, value, lookupId (FK->Lookup CASCADE) | CNAME alias |
| **Traceroute** | id, domain, destinationIp?, hopCount, isCached, createdAt, userId | Trace kaydı |
| **Hop** | id, hopNumber, ip, rtt1?, tracerouteId (FK->Traceroute CASCADE) | Her bir hop |
| **Whois** | id, domain, rawData, registrar?, creationDate?, expirationDate?, nameServers?, isCached, createdAt, userId | WHOIS verisi |
| **ASNLookup** | id, ip, asNumber?, asName?, prefix?, isCached, createdAt, userId | ASN bilgisi |

### İndeksler

- Lookup: `[userId, createdAt]`, `[domain, createdAt]`
- Traceroute: `[userId, createdAt]`, `[domain, createdAt]`
- Whois: `[userId, createdAt]`, `[domain, createdAt]`
- ASNLookup: `[userId, createdAt]`, `[ip, createdAt]`

---

## 5. API Tasarımı

### 5.1 Kimlik Doğrulama

| Method | Path | Body | Yanıt | Açıklama |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{email, password}` | `{user: {id, email}}` + cookie | Kayıt ol |
| POST | `/api/auth/login` | `{email, password}` | `{user: {id, email}}` + cookie | Giriş yap |
| POST | `/api/auth/logout` | — | `{ok: true}` + clear cookie | Çıkış yap |
| GET | `/api/auth/me` | — | `{user: {id, email} \| null}` | Oturum bilgisi |

### 5.2 Sorgu Uç Noktaları

Tümü `GET` metodudur ve `token` cookie'si gerektirir.

| Path | Query Param | Yanıt |
|---|---|---|
| `/api/lookup` | `?domain=example.com` | `{records: {a, aaaa?, mx, ns, txt, cname}, isCached, createdAt}` |
| `/api/traceroute` | `?domain=example.com` | `{hops: [{hopNumber, ip, rtt1}], destinationIp?, hopCount, isCached, createdAt}` |
| `/api/whois` | `?domain=example.com` | `{registrar?, creationDate?, expirationDate?, nameServers?, rawData, isCached, createdAt}` |
| `/api/asn` | `?ip=1.1.1.1` | `{asNumber?, asName?, prefix?, isCached, createdAt}` |
| `/api/ptr` | `?ip=1.1.1.1` | `{hostnames: string[], isCached, createdAt}` |

### 5.3 Kullanıcı Verileri

| Path | Query | Yanıt |
|---|---|---|
| `/api/history` | `?page=1&pageSize=25` | `{items: HistoryItem[], total, page, pageSize, totalPages}` |
| `/api/history/:kind/:id` | — | Detaylı lookup verisi (kind: "lookup" \| "traceroute" \| "whois" \| "asn") |
| `/api/stats` | — | `{totals, cacheHitRatio, topDomains, topRegistrars, topAsns, avgHopCount, topFirstHopIps}` |

### 5.4 Sağlık Kontrolü

```text
GET /health -> { "isOk": true }
```

---

## 6. Önbellek Stratejisi

Her sorgu türü için aynı pattern uygulanır:

1. Kullanıcı bir domain/IP sorgular
2. **Cache Service** aynı `userId` + `domain/ip` için son 1 saat içinde `isCached: false` bir kayıt arar
3. **Cache hit:** Bulunan kaydın verileri kopyalanır, `isCached: true` ile **yeni bir satır** oluşturulur (history bütünlüğü için)
4. **Cache miss:** İlgili harici servis çağrılır (DNS, traceroute, WHOIS, ASN), sonuç DB'ye `isCached: false` ile yazılır
5. Tüm durumlarda history güncellenir ve `isCached` + `createdAt` bilgisi client'a döner

---

## 7. Hata Yönetimi

| Katman | Mekanizma |
|---|---|
| **Veri doğrulama** | Zod şemaları -> `parseQuery`/`parseJson` -> geçersizse `HTTPException(400)` |
| **İş mantığı** | `oxide.ts` -> `Option<T>` (nullable değerler), `Result<T, E>` (başarılı/başarısız işlemler), `match()` pattern matching |
| **HTTP cevapları** | Hono `HTTPException` ile durum kodları (400, 401, 404, 500) |
| **Global hatalar** | `app.onError()` -> yakalanmayan istisnaları JSON formatında döner |
| **Process hataları** | `uncaughtException` ve `unhandledRejection` dinleyicileri |

---

## 8. Güvenlik

| Konu | Uygulama |
|---|---|
| **Şifre saklama** | argon2id hash (salt + hash birlikte) |
| **Oturum yönetimi** | JWT (HS256), 7 gün expiry, httpOnly + sameSite cookie |
| **Yetkilendirme** | `requireAuth` middleware tüm `/api/*` route'larını korur (register/login hariç) |
| **CORS** | Tüm origin'lere izin veren `cors()` middleware (geliştirme); production'da kısıtlanmalı |
| **Input validasyonu** | Tüm girdiler Zod ile doğrulanır, injection riski yok |
| **Hata sızdırmama** | Hata mesajlarında hassas bilgi (stack trace vb.) dönülmez |

---

## 9. Arayüz Tasarımı

### 9.1 Genel Düzen

- Koyu tema (CSS değişkenleriyle tanımlı)
- Üst başlık: "Domain Info" + çıkış butonu
- Kimlik doğrulama öncesi: ortalanmış AuthPanel kartı

### 9.2 Sekmeler

**Lookup Sekmesi:**

- Tip seçici dropdown: DNS, Traceroute, WHOIS, ASN, PTR
- Metin input + Submit butonu
- Sonuç paneli: seçilen tipe göre `ResultsPanel`, `TracerouteResult`, `WhoisResult`, `AsnResult`, `PtrResult`
- `ResultsPanel`: A, AAAA, MX (priority + exchange), NS, TXT, CNAME accordion bölümleri
  - Her bölüm açılır/kapanır
  - Kayıtlar kopyalanabilir

**History Sekmesi:**

- Sayfalı liste (25 kayıt/sayfa)
- Her kayıt: tip ikonu, domain/IP, `isCached` badge, tarih
- Genişletilebilir: tıklandığında detaylı veri asenkron yüklenir

**Stats Sekmesi:**

- Toplam sorgu sayıları (türe göre)
- Cache hit oranı (yüzde + progress bar)
- En çok sorgulanan domain'ler, registrar'lar, ASN'ler
- Ortalama hop sayısı, en çok karşılaşılan ilk-hop IP'leri
