import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Showcase from "./Showcase";
import HowItWorks from "./HowItWorks";
import Cta from "./Cta";
import Seo from "./Seo";
import { APP_URL } from "../App";
import { PlusIcon } from "../icons";

const LANDING_URL = "https://loomy-app.com/is-takip-programi";

function Icon({ d, size = 24, color = "#6366f1" }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  doc: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5",
  calendar: "M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  cube: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7 12 12l8.7-5M12 22V12",
  quote: "M6 10a4 4 0 0 1 4-4M6 10a4 4 0 0 0 4 4m-4-4h4m0 0a4 4 0 0 1 4-4m-4 4a4 4 0 0 0 4 4m0 0h5M9 14l5-5",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  chart: "M3 3v18h18M7 16l3-4 3 3 4-6",
};

const FEATURES = [
  {
    icon: "doc",
    color: "#6366f1",
    title: "Standart iş kayıtları ve PDF rapor",
    text: "İş formların dijitalleşir; PDF rapor tek dokunuşla müşteriye iletilir. Form şablonlarını kendine göre düzenler, arıza ve işlem seçeneklerini (çip gruplarını) kendin kurarsın.",
  },
  {
    icon: "pen",
    color: "#8b5cf6",
    title: "Elektronik imza ve firma kaşesi",
    text: "Müşteri ve ekip imzası form içinde elektronik olarak atılır; rapora imza ve firma kaşesi birlikte basılır. İmzanı profilden kaydeder, tek dokunuşla kullanırsın.",
  },
  {
    icon: "calendar",
    color: "#2dd4bf",
    title: "İş atama ve ekip planı",
    text: "Takvim ve haftalık planda işleri planlar, ekibine atarsın. Tüm ekip aynı planı görür, kimsenin işi aksamaz.",
  },
  {
    icon: "cube",
    color: "#f59e0b",
    title: "Stok takibi ve otomatik düşüm",
    text: "Ürün ekle, fatura içe aktar; toplam ürün, kritik stok ve stok değeri tek bakışta. Ürünlü işlerde stok otomatik düşülür.",
  },
  {
    icon: "quote",
    color: "#10b981",
    title: "KDV ve canlı kurlu teklifler",
    text: "Ürün satırları ve KDV ile teklif hazırla; tutarlar TCMB efektif satış kuruyla Türk Lirasına çevrilir. KVKK notu ve firma bilgilerinle paylaş.",
  },
  {
    icon: "chart",
    color: "#3b82f6",
    title: "Ödeme ve finans takibi",
    text: "Bekleyen ve alınan ödemeler tek finans tablosunda; stok değeri, giderler ve gelirler grafikte. Genel mali durumun her an güncel.",
  },
];

const FAQS = [
  {
    q: "İş takip programı ne işe yarar?",
    a: "İş kayıtlarınızı, randevularınızı, ekip atamalarınızı, stok seviyenizi, tekliflerinizi ve finans durumunuzu tek panelde toplar. İş formları dijitalleşir, raporlar imzalı PDF olarak hazırlanır.",
  },
  {
    q: "İş formu şablonlarını kendime göre düzenleyebilir miyim?",
    a: "Evet. Form şablonları oluşturup düzenleyebilir, gösterilen alanları ve sık kullanılan arıza/işlem seçeneklerini (çip gruplarını) kendinize göre ayarlayabilirsiniz. Varsayılan şablon belirleyip değişiklikleri mevcut kayıtların PDF'lerine de uygulayabilirsiniz.",
  },
  {
    q: "Elektronik imza nasıl çalışıyor?",
    a: "Müşteri ve ekip imzaları iş formu içinde elektronik olarak atılır. PDF raporuna imzalar ve firma kaşesi birlikte eklenir; kendi imzanızı da profilden kaydedip formlarda tek dokunuşla kullanabilirsiniz.",
  },
  {
    q: "Stok takibini nasıl yaparım?",
    a: "Stok ekranında ürünlerinizi listeleyebilir, yeni ürün ekleyebilir ve fatura içe aktarabilirsiniz. Toplam ürün, kritik stok ve stok değeri tek bakışta görünür; ürünlü işlerde stok otomatik düşülür.",
  },
  {
    q: "Kullanmaya başlamak zor mu?",
    a: "Hayır. Hesabınız davet koduyla oluşturulur ve e-posta doğrulamanız yeterlidir. Loomy web tarayıcısında, telefondaki uygulamada veya PWA olarak kullanılabilir; verileriniz şifreli tutulur.",
  },
];

export default function TechnicalLanding() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <Seo
        title="İş Takip Programı | Loomy"
        description="İş takip programı: iş kayıtları, ekip atama, randevu planlama, stok, teklif, elektronik imza ve finans tek panelde. Servis, atölye ve kurulum işletmeleri için Loomy."
        canonical={LANDING_URL}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${LANDING_URL}#webpage`,
              url: LANDING_URL,
              name: "İş Takip Programı",
              inLanguage: "tr-TR",
              isPartOf: { "@id": "https://loomy-app.com/#website" },
            },
            {
              "@type": "FAQPage",
              "@id": `${LANDING_URL}#faq`,
              inLanguage: "tr-TR",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }}
      />

      <Navbar />
      <main>
        <section className="hero" style={{ paddingBottom: 40 }}>
          <div className="container hero-inner">
            <div className="section-header" style={{ marginBottom: 32 }}>
              <span className="section-badge">İşletmeler İçin</span>
              <h1 className="section-title" style={{ maxWidth: 780 }}>
                İş Takip Programı
              </h1>
              <p className="section-subtitle" style={{ maxWidth: 660 }}>
                Servis, atölye ve kurulum işletmeleri için uçtan uca: standart iş
                kayıtları, randevu ve ekip planı, stok takibi, teklif hazırlama,
                elektronik imza ve finans — hepsi tek panelde.
              </p>
              <div className="hero-actions" style={{ justifyContent: "center" }}>
                <a className="btn btn-primary" href={APP_URL}>
                  Uygulamayı Aç
                </a>
                <a className="btn btn-secondary" href="#tech-features">
                  Özellikleri Gör
                </a>
              </div>
            </div>

            <div className="hero-stats" style={{ justifyContent: "center" }}>
              <div className="hero-stat">
                <strong>Tek panel</strong>
                <span>8 modül birlikte</span>
              </div>
              <div className="hero-stat">
                <strong>PDF + imza</strong>
                <span>kaşeli rapor</span>
              </div>
              <div className="hero-stat">
                <strong>TCMB kuru</strong>
                <span>canlı TL çevirimi</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="tech-features">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Özellikler</span>
              <h2 className="section-title">
                İşletmeniz için uçtan uca yönetim
              </h2>
              <p className="section-subtitle">
                Ekibinizden idari işlere kadar her şey tek programda; kağıt form ve
                dağınık tablolara veda.
              </p>
            </div>

            <div className="features-grid">
              {FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <div className="feature-icon">
                    <Icon d={ICONS[f.icon as keyof typeof ICONS]} color={f.color} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Showcase />
        <HowItWorks />

        <section className="section" id="tech-faq">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">SSS</span>
              <h2 className="section-title">
                İş takip programı hakkında merak edilenler
              </h2>
            </div>

            <div className="faq-list" style={{ maxWidth: 720, margin: "0 auto" }}>
              {FAQS.map((item, index) => {
                const isOpen = open === index;
                return (
                  <div className={`faq-item ${isOpen ? "open" : ""}`} key={item.q}>
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => setOpen(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      {item.q}
                      <PlusIcon />
                    </button>
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}