import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "tr" | "en";

const tr = {
  nav: {
    features: "Özellikler",
    howItWorks: "Nasıl Çalışır",
    pricing: "Paketler",
    faq: "SSS",
    contact: "İletişim",
    openApp: "Uygulamayı Aç",
  },
  install: {
    button: "Uygulamayı İndir",
  },
  hero: {
    badge: "İşletme yönetimi yeniden tanımlanıyor",
    title1: "İşletmenizi tek",
    title2: "panelden yönetin",
    description:
      "Loomy; müşterilerinizi, servislerinizi, tekliflerinizi, ödemelerinizi, randevularınızı ve ekibinizi tek bir yerden yönetmenizi sağlar. Kağıt, hesap tablosu ve kafa karışıklığı olmadan.",
    ctaPrimary: "Ücretsiz Başla",
    ctaSecondary: "Nasıl Çalışır?",
    stat1Value: "7/24",
    stat1Label: "Erişim",
    stat2Value: "%100",
    stat2Label: "Dijital Kayıt",
    stat3Value: "1",
    stat3Label: "Panel",
    mock: [
      { label: "Müşteriler", value: "24" },
      { label: "Servisler", value: "12" },
      { label: "Teklifler", value: "18" },
      { label: "Ödemeler", value: "%82" },
    ],
  },
  features: {
    badge: "Özellikler",
    title: "İşinizi büyütecek her şey tek yerde",
    description:
      "Günlük işlerinizi yönetmek için ihtiyacınız olan tüm araçlar, sade ve kullanımı kolay bir panelde toplandı.",
    items: [
      {
        title: "Müşteri Yönetimi & Geçmişi",
        description:
          "Müşteri kartları, iletişim bilgileri ve geçmişi tek ekranda. Her müşterinin tüm servis, teklif ve ödeme geçmişine arama ve filtreyle saniyeler içinde ulaşın.",
      },
      {
        title: "Teklif Hazırlama",
        description:
          "Ürün satırları, KDV ve güncel döviz kuruyla (TCMB efektif satış) teklif oluşturun; firma bilgileriniz ve KVKK notuyla PDF olarak paylaşın.",
      },
      {
        title: "Servis ve İş Takibi",
        description:
          "Yapılan servisleri ve işleri kaydedin, dijital imza alın ve müşterinizle anında PDF rapor olarak paylaşın.",
      },
      {
        title: "Ödeme Takibi",
        description:
          "Ödenmiş, ödenmemiş ve geciken ödemeleri görün; tek dokunuşla ödendi olarak işaretleyin. Aylık durum ve özet ile tahsilatınız hep gözünüzün önünde.",
      },
      {
        title: "Randevu ve Planlama",
        description:
          "Takvim ve haftalık plan üzerinden randevularınızı ve ekip çalışmalarınızı düzenleyin, kimsenin işi aksamasın.",
      },
      {
        title: "Ekip ve Roller",
        description:
          "Davet kodunuzla ekibinizi ekleyin, rollerini belirleyin ve yetkilendirme ile herkesin yaptığı işi takip edin.",
      },
      {
        title: "Anlık Panel",
        description:
          "İşletmenizin genel durumunu özet istatistiklerle görün; bugünkü planlar, ödeme durumu ve son servisler tek bakışta.",
      },
    ],
  },
  howItWorks: {
    badge: "Nasıl Çalışır",
    title: "Üç adımda başlayın",
    description: "Kurulumu dakikalar sürer. Teknik bilgi gerektirmez.",
    steps: [
      {
        title: "Kayıt Olun",
        description:
          "Davet kodunuzla hesabınızı oluşturun, e-posta adresinizi doğrulayın. İşletmenizin profili otomatik oluşturulur.",
      },
      {
        title: "Ekibinizi Davet Edin",
        description:
          "Çalışma arkadaşlarınızı kendi davet kodlarıyla ekleyin ve rollerini belirleyin.",
      },
      {
        title: "Yönetmeye Başlayın",
        description:
          "Müşterilerinizi, servislerinizi, ödemelerinizi ve planınızı tek panelden takip edin.",
      },
    ],
  },
  pricing: {
    badge: "Paketler",
    title: "Size uygun paketi seçin",
    description:
      "Paketlerimiz ve fiyatlarımız yakında yayında olacak. Siz hazırlanırken biz de çalışıyoruz.",
    comingSoon: "Yakında",
    note: "Paketler yayınlandığında buradan planınızı inceleyip seçebileceksiniz.",
    plans: [
      {
        name: "Başlangıç",
        description: "Küçük işletmeler için temel yönetim.",
        price: "—",
        featured: false,
        features: [
          "Müşteri yönetimi ve geçmişi",
          "Servis ve iş takibi",
          "Teklif ve PDF",
          "Ödeme takibi",
        ],
      },
      {
        name: "Profesyonel",
        description: "Büyüyen işletmeler için tam paket.",
        price: "—",
        featured: true,
        features: [
          "Başlangıç paketindeki her şey",
          "Randevu ve planlama",
          "Ekip ve roller",
          "Dijital imza ve PDF raporlar",
        ],
      },
      {
        name: "Kurumsal",
        description: "Geniş ekipler için esnek çözümler.",
        price: "—",
        featured: false,
        features: [
          "Profesyonel paketindeki her şey",
          "Öncelikli destek",
          "Özel kurulum desteği",
        ],
      },
    ],
  },
  faq: {
    badge: "SSS",
    title: "Sıkça sorulan sorular",
    description: "Aklınıza takılan soruların yanıtlarını burada bulabilirsiniz.",
    items: [
      {
        q: "Loomy nedir?",
        a: "Loomy; müşteri, servis, teklif, ödeme, randevu ve ekip yönetimini tek panelde toplayan bir işletme yönetim uygulamasıdır.",
      },
      {
        q: "Nasıl kayıt olabilirim?",
        a: "Hesabınız, davet koduyla oluşturulur. Davet kodunuzla kayıt olup e-posta adresinizi doğrulamanız yeterlidir.",
      },
      {
        q: "Teklif verebilir miyim?",
        a: "Evet. Ürün satırları, KDV ve güncel döviz kuru (TCMB efektif satış) ile teklif hazırlayıp PDF olarak indirebilir; firma bilgileriniz ve KVKK notuyla müşterinizle paylaşabilirsiniz.",
      },
      {
        q: "Hangi cihazlarda çalışır?",
        a: "Loomy web tarayıcısından, telefonunuza kurulabilen uygulama olarak ve PWA olarak kullanılabilir.",
      },
      {
        q: "Verilerim güvende mi?",
        a: "Hesaplarınız şifreli tutulur ve yalnızca yetkili ekip üyeleri işletmenizin verilerine erişebilir.",
      },
    ],
  },
  cta: {
    title: "İşletmenizi bugün dijitale taşıyın",
    description:
      "Ücretsiz başlayın, dakikalar içinde yönetmeye geçin. Sorularınız için bize ulaşın.",
    primary: "Uygulamayı Aç",
    secondary: "İletişime Geç",
  },
  footer: {
    tagline: "İşletme yönetimi, sadeleştirildi.",
    product: "Ürün",
    contactTitle: "İletişim",
    rights: "Tüm hakları saklıdır.",
  },
} as const;

const en: Dictionary = {
  nav: {
    features: "Features",
    howItWorks: "How it works",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    openApp: "Open App",
  },
  install: {
    button: "Install App",
  },
  hero: {
    badge: "Business management, redefined",
    title1: "Manage your business",
    title2: "from a single panel",
    description:
      "Loomy lets you manage your customers, services, quotes, payments, appointments and team all in one place. No paper, no spreadsheets, no confusion.",
    ctaPrimary: "Start Free",
    ctaSecondary: "How it works?",
    stat1Value: "24/7",
    stat1Label: "Access",
    stat2Value: "100%",
    stat2Label: "Digital records",
    stat3Value: "1",
    stat3Label: "Panel",
    mock: [
      { label: "Customers", value: "24" },
      { label: "Services", value: "12" },
      { label: "Quotes", value: "18" },
      { label: "Payments", value: "82%" },
    ],
  },
  features: {
    badge: "Features",
    title: "Everything you need to grow, in one place",
    description:
      "All the tools you need to run your daily operations, gathered in a simple and easy-to-use panel.",
    items: [
      {
        title: "Customer Management & History",
        description:
          "Customer cards, contact details and history on one screen. Reach any customer's full service, quote and payment history in seconds with search and filters.",
      },
      {
        title: "Quotes & PDF",
        description:
          "Create quotes with product lines, VAT and the live exchange rate (TCMB effective selling rate); share them as PDF with your company info and KVKK note.",
      },
      {
        title: "Service & Job Tracking",
        description:
          "Record services and jobs, collect digital signatures and share instantly with your customer as a PDF report.",
      },
      {
        title: "Payment Tracking",
        description:
          "See paid, unpaid and overdue payments and mark them paid with one tap. Keep your collections in sight with monthly status and summaries.",
      },
      {
        title: "Appointments & Planning",
        description:
          "Organize appointments and team work on a calendar and weekly plan. Nothing slips through the cracks.",
      },
      {
        title: "Team & Roles",
        description:
          "Invite your team with your invite code, assign roles and track everyone's work with clear permissions.",
      },
      {
        title: "Live Dashboard",
        description:
          "See your business at a glance with summary statistics; today's plans, payment status and recent services in one view.",
      },
    ],
  },
  howItWorks: {
    badge: "How it works",
    title: "Get started in three steps",
    description: "Setup takes minutes. No technical knowledge required.",
    steps: [
      {
        title: "Sign up",
        description:
          "Create your account with your invite code and verify your email. Your company profile is created automatically.",
      },
      {
        title: "Invite your team",
        description:
          "Add your colleagues with their own invite codes and assign their roles.",
      },
      {
        title: "Start managing",
        description:
          "Track your customers, services, payments and schedule from one panel.",
      },
    ],
  },
  pricing: {
    badge: "Pricing",
    title: "Choose the plan that fits you",
    description:
      "Our plans and prices will be live soon. We are working while you get ready.",
    comingSoon: "Coming soon",
    note: "Once plans are published, you will be able to review and pick yours right here.",
    plans: [
      {
        name: "Starter",
        description: "Core management for small businesses.",
        price: "—",
        featured: false,
        features: [
          "Customer management & history",
          "Service & job tracking",
          "Quotes & PDF",
          "Payment tracking",
        ],
      },
      {
        name: "Professional",
        description: "The full package for growing businesses.",
        price: "—",
        featured: true,
        features: [
          "Everything in Starter",
          "Appointments & planning",
          "Team & roles",
          "Digital signature & PDF reports",
        ],
      },
      {
        name: "Enterprise",
        description: "Flexible solutions for large teams.",
        price: "—",
        featured: false,
        features: [
          "Everything in Professional",
          "Priority support",
          "Custom onboarding support",
        ],
      },
    ],
  },
  faq: {
    badge: "FAQ",
    title: "Frequently asked questions",
    description: "Find answers to the questions you might have.",
    items: [
      {
        q: "What is Loomy?",
        a: "Loomy is a business management app that brings customer, service, quote, payment, appointment and team management into a single panel.",
      },
      {
        q: "How do I sign up?",
        a: "Accounts are created with an invite code. Just sign up with your invite code and verify your email address.",
      },
      {
        q: "Can I create quotes?",
        a: "Yes. Create quotes with product lines, VAT and the live exchange rate (TCMB effective selling rate), download them as PDF and share them with your customer along with your company info and KVKK note.",
      },
      {
        q: "Which devices does it work on?",
        a: "Loomy works in any web browser, as an installable app on your phone and as a PWA.",
      },
      {
        q: "Is my data safe?",
        a: "Accounts are encrypted and only authorized team members can access your business data.",
      },
    ],
  },
  cta: {
    title: "Take your business digital today",
    description:
      "Start free, start managing in minutes. Contact us for any questions.",
    primary: "Open App",
    secondary: "Contact Us",
  },
  footer: {
    tagline: "Business management, simplified.",
    product: "Product",
    contactTitle: "Contact",
    rights: "All rights reserved.",
  },
};

export type Dictionary = Widen<typeof tr>;

type Widen<T> = T extends readonly (infer U)[]
  ? readonly Widen<U>[]
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> };

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("tr");
  const t = lang === "tr" ? tr : en;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
