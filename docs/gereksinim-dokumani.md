# Gereksinim Dokümanı — Domain Info

## 1. Genel Bakış

Domain Info, kullanıcıların bir alan adı veya IP adresi hakkında ağ tanılama bilgisi almasını sağlayan web tabanlı bir araçtır. Kullanıcılar kayıt olup giriş yaparak DNS kaydı, traceroute, WHOIS, ASN ve PTR sorguları yapabilir, sorgu geçmişlerini görüntüleyebilir ve kullanım istatistiklerini inceleyebilir.

---

## 2. Fonksiyonel Gereksinimler

### FR1: Kullanıcı Yönetimi

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR1.1 | Kayıt | Kullanıcı e-posta ve şifre ile kayıt olabilir. Şifre en az 8 karakter olmalıdır. |
| FR1.2 | Giriş | Kayıtlı kullanıcı e-posta ve şifresiyle sisteme giriş yapabilir. |
| FR1.3 | Oturum | Giriş yapan kullanıcıya 7 gün geçerli JWT token verilir, httpOnly cookie olarak saklanır. |
| FR1.4 | Oturum bilgisi | Kullanıcı `/api/auth/me` ile mevcut oturum bilgisini sorgulayabilir. |
| FR1.5 | Çıkış | Kullanıcı çıkış yapabilir, token cookie'si silinir. |
| FR1.6 | Yetkilendirme | Kayıt ve giriş dışındaki tüm `/api/*` istekleri geçerli JWT gerektirir. Geçersiz/eksik token durumunda 401 döner. |

### FR2: DNS Sorgulama

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR2.1 | A kaydı | Kullanıcı bir domain için IPv4 adreslerini sorgulayabilir. |
| FR2.2 | AAAA kaydı | Kullanıcı bir domain için IPv6 adreslerini sorgulayabilir. |
| FR2.3 | MX kaydı | Kullanıcı bir domain için mail sunucularını ve öncelik (priority) değerlerini sorgulayabilir. |
| FR2.4 | NS kaydı | Kullanıcı bir domain için name server'ları sorgulayabilir. |
| FR2.5 | TXT kaydı | Kullanıcı bir domain için TXT kayıtlarını sorgulayabilir. |
| FR2.6 | CNAME kaydı | Kullanıcı bir domain için CNAME alias'larını sorgulayabilir. |
| FR2.7 | Toplu yanıt | `/api/lookup` tek istekte A, AAAA, MX, NS, TXT ve CNAME kayıtlarının tümünü döner. |

### FR3: Traceroute

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR3.1 | Ağ yolu takibi | Kullanıcı bir domain veya IP adresi için hop bazlı ağ yolu takibi başlatabilir. |
| FR3.2 | Hop bilgisi | Her hop için sıra numarası, IP adresi ve ilk RTT değeri gösterilir. |
| FR3.3 | Zaman aşımı | Traceroute en fazla 60 saniye sürer, süre aşılırsa hata döner. |
| FR3.4 | Hedef IP | Başarılı trace sonucunda hedef IP adresi de yanıta eklenir. |

### FR4: WHOIS Sorgulama

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR4.1 | Ham WHOIS | Kullanıcı bir domain için ham WHOIS verisini sorgulayabilir. |
| FR4.2 | Registrar | WHOIS yanıtından kayıt firması (registrar) bilgisi ayrıştırılır. |
| FR4.3 | Tarihler | Alan adının oluşturma (creationDate) ve bitiş (expirationDate) tarihleri ayrıştırılır. |
| FR4.4 | Name server | WHOIS yanıtından name server'lar ayrıştırılır. |
| FR4.5 | Parse esnekliği | Parse edilemeyen alanlar boş döner, ham veri her zaman eksiksiz iletilir. |

### FR5: ASN Sorgulama

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR5.1 | IPv4 ASN | Kullanıcı bir IPv4 adresi için AS numarası, AS adı ve prefix bilgisi sorgulayabilir. |
| FR5.2 | IPv6 ASN | Kullanıcı bir IPv6 adresi için de aynı bilgileri sorgulayabilir. |
| FR5.3 | Kaynak | Sorgular Team Cymru DNS (origin.asn.cymru.com) üzerinden yapılır. |

### FR6: PTR (Ters DNS) Sorgulama

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR6.1 | PTR kaydı | Kullanıcı bir IP adresi için ters DNS (PTR) hostname'lerini sorgulayabilir. |

### FR7: Önbellekleme

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR7.1 | Cache süresi | Tüm sorgu türleri için önbellek süresi 1 saattir. |
| FR7.2 | Cache hit | Aynı kullanıcı aynı domain/IP'yi 1 saat içinde tekrar sorgularsa, harici servis çağrılmaz, önceki sonuç kopyalanır. |
| FR7.3 | Cache göstergesi | Cache hit durumunda yanıtta `isCached: true` gönderilir, cache miss'te `false`. |
| FR7.4 | History bütünlüğü | Cache hit durumunda da history'e yeni bir satır eklenir (önceki veri kopyalanarak). |

### FR8: Sorgu Geçmişi

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR8.1 | Timeline | Kullanıcı tüm sorgu türlerini tek bir zaman çizelgesinde, en yeniden en eskiye sıralı olarak görür. |
| FR8.2 | Sayfalama | Geçmiş sayfalı olarak gösterilir (varsayılan 25 kayıt/sayfa). |
| FR8.3 | Kapsam | Her kullanıcı yalnızca kendi sorgu geçmişini görür. |
| FR8.4 | Detay görüntüleme | Kullanıcı bir geçmiş kaydını genişleterek tam sorgu detayını görebilir. |
| FR8.5 | Cache badge | Geçmiş listesinde cache'ten gelen kayıtlar görsel olarak işaretlenir. |

### FR9: İstatistikler

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR9.1 | Toplam sorgu | Kullanıcı türe göre toplam sorgu sayılarını görür. |
| FR9.2 | Cache oranı | Kullanıcının cache hit yüzdesi hesaplanır ve gösterilir. |
| FR9.3 | En çok sorgulanan | En çok sorgulanan domain'ler, registrar'lar ve ASN'ler listelenir. |
| FR9.4 | Traceroute istatistikleri | Ortalama hop sayısı ve en sık karşılaşılan ilk-hop IP'leri gösterilir. |
| FR9.5 | Kapsam | Tüm istatistikler kullanıcı bazlıdır, diğer kullanıcıların verilerini içermez. |

### FR10: Sağlık Kontrolü

| ID | Gereksinim | Açıklama |
|---|---|---|
| FR10.1 | Health endpoint | `GET /health` -> `{ "isOk": true }` yanıtı döner. Kimlik doğrulama gerektirmez. |

---

## 3. Fonksiyonel Olmayan Gereksinimler

### FNR1: Performans

| ID | Gereksinim | Açıklama |
|---|---|---|
| FNR1.1 | Cache stratejisi | Tekrarlayan sorgular için 1 saatlik SQLite önbellek. |
| FNR1.2 | Traceroute timeout | Traceroute işlemi en fazla 60 saniye sürer. |
| FNR1.3 | DNS timeout | DNS sorguları için Node.js varsayılan timeout süresi kullanılır. |

### FNR2: Güvenlik

| ID | Gereksinim | Açıklama |
|---|---|---|
| FNR2.1 | Şifre saklama | Şifreler argon2id algoritması ile hash'lenir, düz metin asla saklanmaz. |
| FNR2.2 | Token güvenliği | JWT HS256 ile imzalanır, JWT_SECRET en az 32 karakter olmalıdır. |
| FNR2.3 | Cookie güvenliği | Token httpOnly cookie olarak saklanır, production'da secure flag eklenir. |
| FNR2.4 | Input validasyonu | Tüm kullanıcı girdileri Zod şemaları ile sunucu tarafında doğrulanır. |
| FNR2.5 | CORS | Geliştirme ortamında tüm origin'lere izin verilir, production'da kısıtlanır. |
| FNR2.6 | Hata sızdırmama | Sunucu hatalarında stack trace veya iç sistem bilgisi dönülmez. |

### FNR3: Kullanılabilirlik

| ID | Gereksinim | Açıklama |
|---|---|---|
| FNR3.1 | Arayüz teması | Koyu tema (dark mode) varsayılan olarak uygulanır. |
| FNR3.2 | Yükleme göstergesi | Bekleyen istekler sırasında spinner gösterilir. |
| FNR3.3 | Hata gösterimi | Hatalar kullanıcıya anlaşılır mesajlarla ve isteğe bağlı "tekrar dene" butonuyla gösterilir. |
| FNR3.4 | Kayıt kopyalama | DNS kayıt değerleri tek tıkla panoya kopyalanabilir. |
| FNR3.5 | Accordion | DNS kayıt türleri açılır/kapanır accordion bölümler halinde gösterilir. |

### FNR4: Kod Kalitesi ve Sürdürülebilirlik

| ID | Gereksinim | Açıklama |
|---|---|---|
| FNR4.1 | Tip güvenliği | Tüm kod TypeScript strict modunda yazılır. |
| FNR4.2 | Statik analiz | ESLint ile kod denetimi yapılır. |
| FNR4.3 | Hata yönetimi | `oxide.ts` ile Rust gibi Option/Result pattern'i kullanılır, null değerler `Option` ile sarılır. |
| FNR4.4 | Validasyon | Tüm API girdileri ve çıktıları Zod ile tanımlanır, el yazımı tip kontrolü yoktur. |
| FNR4.5 | Migration | Veritabanı şeması Prisma migration'ları ile sürümlendirilir. |

### FNR5: Test Edilebilirlik

| ID | Gereksinim | Açıklama |
|---|---|---|
| FNR5.1 | İzole test | Testler ayrı bir SQLite veritabanında (`prisma/test.db`) çalışır. |
| FNR5.2 | Entegrasyon testi | `app.request()` ile HTTP istekleri simüle edilerek uçtan uca test yapılır. |
| FNR5.3 | Temiz durum | Her test öncesinde tablolar temizlenir, testler birbirinden bağımsızdır. |

---

## 4. Kullanıcı Hikayeleri

### UH1: Kimlik Doğrulama

| ID | Hikaye | Öncelik |
|---|---|---|
| UH1.1 | Bir kullanıcı olarak, hesap oluşturmak istiyorum ki sorgu geçmişim bana özel saklansın. | Yüksek |
| UH1.2 | Bir kullanıcı olarak, giriş yapmak istiyorum ki daha önceki geçmişime erişebileyim. | Yüksek |
| UH1.3 | Bir kullanıcı olarak, çıkış yapmak istiyorum ki başkası geçmişimi göremesin. | Orta |

### UH2: DNS Sorguları

| ID | Hikaye | Öncelik |
|---|---|---|
| UH2.1 | Bir kullanıcı olarak, bir domain'in IP adreslerini görmek istiyorum ki sitenin nerede barındığını anlayabileyim. | Yüksek |
| UH2.2 | Bir kullanıcı olarak, bir domain'in MX kayıtlarını görmek istiyorum ki hangi e-posta sunucusunu kullandığını öğrenebileyim. | Orta |
| UH2.3 | Bir kullanıcı olarak, bir domain'in NS kayıtlarını görmek istiyorum ki DNS yönetiminin nerede olduğunu anlayabileyim. | Orta |
| UH2.4 | Bir kullanıcı olarak, tüm DNS kayıtlarını tek istekte görmek istiyorum ki her tür için ayrı sorgu yapmak zorunda kalmayayım. | Yüksek |

### UH3: Ağ Tanılama

| ID | Hikaye | Öncelik |
|---|---|---|
| UH3.1 | Bir kullanıcı olarak, bir domain'e giden ağ yolunu (traceroute) görmek istiyorum ki bağlantı sorunlarını teşhis edebileyim. | Yüksek |
| UH3.2 | Bir kullanıcı olarak, bir domain'in WHOIS bilgilerini görmek istiyorum ki kayıt tarihini ve firma bilgilerini öğrenebileyim. | Orta |
| UH3.3 | Bir kullanıcı olarak, bir IP adresinin hangi AS'e ait olduğunu görmek istiyorum ki ağ sahipliğini anlayabileyim. | Orta |
| UH3.4 | Bir kullanıcı olarak, bir IP adresinin ters DNS (PTR) kaydını görmek istiyorum ki hostname'i öğrenebileyim. | Düşük |

### UH4: Geçmiş ve İstatistikler

| ID | Hikaye | Öncelik |
|---|---|---|
| UH4.1 | Bir kullanıcı olarak, geçmiş sorgularımı görmek istiyorum ki daha önce ne sorguladığımı hatırlayabileyim. | Orta |
| UH4.2 | Bir kullanıcı olarak, istatistiklerimi görmek istiyorum ki hangi domain'leri daha sık sorguladığımı analiz edebileyim. | Düşük |
| UH4.3 | Bir kullanıcı olarak, bir sorgunun önbellekten mi yoksa canlı mı geldiğini bilmek istiyorum ki verinin güncelliğini değerlendirebileyim. | Orta |

### UH5: Kullanıcı Deneyimi

| ID | Hikaye | Öncelik |
|---|---|---|
| UH5.1 | Bir kullanıcı olarak, sorgu sonucu beklerken bir yükleme göstergesi görmek istiyorum ki sistemin çalıştığını anlayabileyim. | Orta |
| UH5.2 | Bir kullanıcı olarak, bir hata oluştuğunda neyin yanlış gittiğini anlamak istiyorum ki düzeltebileyim. | Yüksek |
| UH5.3 | Bir kullanıcı olarak, DNS kayıt değerlerini panoya kopyalamak istiyorum ki başka bir yerde kullanabileyim. | Düşük |

---

## 5. Sistem Kısıtları

| ID | Kısıt | Açıklama |
|---|---|---|
| K1 | Çalışma zamanı | Node.js 22 veya üzeri gereklidir. |
| K2 | Veritabanı | SQLite dosya tabanlıdır, aynı anda tek yazma işlemine izin verir. |
| K3 | Harici bağımlılık | ASN sorguları için Team Cymru DNS sunucularına (`origin.asn.cymru.com`) erişim gerekir. |
| K4 | Harici bağımlılık | WHOIS sorguları için standart WHOIS portuna (43) giden bağlantı gerekir. |
| K5 | Port | Backend varsayılan olarak 6633 portunda çalışır. |
| K6 | Port | Frontend varsayılan olarak 5173 portunda çalışır. |
| K7 | Platform | Windows, macOS, Linux üzerinde geliştirme/test yapılabilir. |
| K8 | Tarayıcı | Modern tarayıcılar (Chrome, Firefox, Edge, Safari son 2 sürüm) desteklenir. |

---

## 6. Kabul Kriterleri

### KC1: Kullanıcı Yönetimi

- [ ] Geçerli e-posta ve en az 8 karakter şifre ile kayıt başarılı olur
- [ ] Aynı e-posta ile ikinci kez kayıt denenirse 400 hatası döner
- [ ] Doğru kimlik bilgileriyle giriş başarılı olur, token cookie'si set edilir
- [ ] Yanlış şifre ile giriş denenirse 401 hatası döner
- [ ] Token olmadan `/api/lookup` çağrılırsa 401 döner
- [ ] Çıkış sonrası token cookie'si temizlenir

### KC2: DNS Sorgulama

- [ ] `google.com` için A kaydı en az bir IPv4 adresi döner
- [ ] IPv6 destekleyen bir domain için AAAA kaydı IPv6 adresi döner
- [ ] MX kayıtları `exchange` ve `priority` alanlarını içerir
- [ ] Hiç kaydı olmayan bir alan türü boş dizi olarak döner (hata değil)
- [ ] Geçersiz domain formatı 400 hatası döner

### KC3: Traceroute

- [ ] Geçerli bir domain için hop listesi döner
- [ ] Her hop `hopNumber`, `ip` alanlarını içerir
- [ ] 60 saniyeyi aşan trace işlemi timeout hatası döner
- [ ] Başarılı trace yanıtı `destinationIp` ve `hopCount` içerir

### KC4: WHOIS Sorgulama

- [ ] Kayıtlı bir domain için `rawData` her zaman döner
- [ ] Parse edilebilen alanlar (registrar, tarihler, name server'lar) dolu döner
- [ ] Kayıtsız bir domain için uygun hata mesajı döner

### KC5: ASN Sorgulama

- [ ] Geçerli bir IPv4 adresi (örn: `1.1.1.1`) için AS bilgisi döner
- [ ] Geçerli bir IPv6 adresi için AS bilgisi döner
- [ ] Geçersiz IP formatı 400 hatası döner

### KC6: Önbellekleme

- [ ] İlk sorguda `isCached: false` döner
- [ ] Aynı domain/IP 1 saat içinde tekrar sorgulanırsa `isCached: true` döner
- [ ] Cache hit durumunda da history'e yeni kayıt eklenir
- [ ] 1 saat sonra aynı sorgu tekrar canlı olarak yapılır

### KC7: Geçmiş ve İstatistikler

- [ ] History yalnızca oturum açan kullanıcının kendi kayıtlarını gösterir
- [ ] Sayfalama düzgün çalışır (`page`, `pageSize`, `totalPages`)
- [ ] İstatistiklerde cache hit oranı %0-100 aralığında doğru hesaplanır
- [ ] Henüz sorgu yapmamış kullanıcı için istatistikler boş/0 döner (hata değil)

### KC8: Hata Yönetimi

- [ ] Tüm Zod validasyon hataları 400 + anlaşılır mesaj döner
- [ ] Kimlik doğrulama hataları 401 döner
- [ ] Beklenmeyen sunucu hataları 500 döner ve stack trace içermez
- [ ] Client tarafında hatalar `ErrorMessage` bileşeni ile gösterilir ve "tekrar dene" butonu sunulur
