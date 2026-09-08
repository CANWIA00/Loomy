# KVKK / GDPR Uyum Dokümantasyonu

Bu doküman, Loomy platformunun kişisel verilerin korunması mevzuatına
(6698 sayılı KVKK ve uluslararası GDPR) uyum çalışmasının teknik karşılığını
ve veri sorumlusu olarak sorumluluklarınızı özetler.

> Not: Bu doküman hukuki danışmanlık değildir. Kesin uyum kararları için
> bir avukat / veri koruma uzmanı (DPO) ile çalışmanız önerilir.

## 1. Veri Sorumlusu Bilgileri

- **Veri Sorumlusu:** Loomy (işletme sahibi)
- **İletişim:** lommy.app.info@gmail.com
- **Uygulama:** https://loomy-omega.vercel.app
- **Sunucu Bölgesi:** Türkiye

## 2. İşlenen Kişisel Veriler

| Kategori | Veri | Kayıt Noktası |
| --- | --- | --- |
| Kimlik | Ad soyad | Kayıt (`User.name`) |
| İletişim | E-posta, telefon | Kayıt (`User.email/phone`) |
| Kurumsal | Şirket adı, vergi no, adres | Profil tamamlama (`Company`) |
| Müşteri verileri | Firma adı, telefon, e-posta, adres, abone no | Müşteri kayıtları (`Customer`) |
| Servis kayıtları | Tarih, servis türü, ücret, teknisyen, imza | Servis formları (`ServiceRecord`) |
| Teklifler | Kalemler, tutarlar, iletişim | Teklifler (`QuoteRecord`) |
| Ödeme bilgileri | Ödenen tutarlar, ödeme durumu | `ServiceRecord.paid` türevi |
| Randevu/Takım | Takvim, ekip | `Appointment`/`Team` |

Özel nitelikli veri (KVKK md. 6) yalnızca imza verisi kapsamında değerlendirilir
ve yalnızca servis formlarında kullanılır.

## 3. İşleme Amaçları ve Hukuki Sebepler

- Servlet / servis yönetimi sağlamak — **sözleşmenin kurulması ve ifası**
- Hesap güvenliği, doğrulama, erişim yetkisi — **hukuki yükümlülük, meşru menfaat**
- Faturalama ve ödeme durumu — **hukuki yükümlülük, sözleşme**
- KVKK/Gizlilik onayı kaydı — **açık rıza** (kayıt sırasında zorunlu onay)

## 4. Aydınlatma Yükümlülüğü (KVKK md. 10)

- [x] **Kayıt ekranında:** "KVKK Aydınlatma Metni ve Gizlilik Politikası"
      onay kutusu ve bağlantısı eklendi; kayıt onay olmadan engelleniyor.
      Onay tarihi ve politika versiyonu DB'de saklanır
      (`User.privacyAcceptedAt`, `User.privacyPolicyVersion`).
- [x] **Uygulama içinde:** Ayarlar → Gizlilik sayfası
      (`PrivacyModal`) aydınlatma başlıklarını içerir.
- [x] **Web sitesinde:** Footer'da "Gizlilik Politikası ve KVKK Aydınlatma Metni"
      sayfası (`#privacy`) — TR/EN.
- [x] **PDF'lerde:** Servis formu ve teklif PDF'lerinde KVKK gizlilik notu.

## 5. Veri Sahibi Hakları (KVKK md. 11)

- [x] Uygulamada **Ayarlar → Veri Sahibi Hakları (KVKK)** ekranı
      (`DataRightsModal`) hakları listeler ve "Verilerimi İndir" ile
      JSON veri ihracatı sunar (erasunucu `GET /api/profile/data`).
- [x] Erişim/ihracat hakkı: `loomy-verilerim-YYYY-MM-DD.json` dosyası indirilir.
- [x] Silme: `DELETE /api/auth/account` mevcuttur
      (hesap silinir; son kullanıcı ise şirket de silinir).
- [x] Başvuru yolu: gizlilik e-postası (mailto) gösterilir;
      kimlik doğrulaması olmadan talepler işleme alınmaz.

## 6. Saklama ve İmha

- Veriler, hesap aktif olduğu sürece ve mevzuatta öngörülen süreler boyunca saklanır.
- Hesap silindiğinde ilgili tüm veriler 30 gün içinde kalıcı olarak silinir.
- Öneri: Ayrı bir **saklama & imha politikası** yazılıp yıllık imha raporu tutulmalı.

## 7. VERBİS Kayıt Yükümlülüğü

VERBİS'e kayıt zorunluluğu genel olarak şu durumlarda doğar:

- Yıllık işlenen kişisel veri sayısının **1 milyon kişiyi aşması**, veya
- **Özel nitelikli veri** işlenmesi (imza verisi bu kapsamda değerlendirilebilir).

Yükümlülük doğuyorsa, kişisel veri işleme envanteri VERBİS'e kaydedilmelidir.
Sorumlu kurum: Kişisel Verileri Koruma Kurumu (KVKK.gov.tr).

## 8. Teknik & İdari Tedbirler

- [x] Şifreler bcrypt ile hash'lenir (`bcryptjs`).
- [x] Erişim yetkilendirmesi JWT + rol bazlı (ADMIN/USER) middleare.
- [x] SSL/TLS (sunucu ve frontend yayını).
- [x] Yetkisiz erişim denemeleri için oturum doğrulaması.
- [ ] Öneri: Erişim günlüğü (audit log) tutulması.
- [ ] Öneri: 2FA ve şifre yenileme politikası.
- [ ] Öneri: Veri ihlali tespiti ve 72 saat içinde bildirim prosedürü.

## 9. Değişiklik Kaydı

| Tarih | Değişiklik |
| --- | --- |
| 08.09.2026 | Kayıt onayı, veri ihracatı, veri sahibi hakları ekranı, web gizlilik sayfası, dokümantasyon eklendi. |