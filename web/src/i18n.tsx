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
    installed: "Kuruldu ✓",
    helpTitle: "Loomy'yi nasıl kurarım?",
    stepIos1: "Tarayıcınızın Paylaş (Share) butonuna dokunun",
    stepIos2: "\u201CAna Ekrana Ekle\u201D (Add to Home Screen) seçeneğine dokunun",
    stepIos3: "\u201CEkle\u201D (Add) ile onaylayın",
    stepAndroid1: "Tarayıcı menüsüne dokunun (\u2261)",
    stepAndroid2: "\u201CUygulama Yükle\u201D veya \u201CAna ekrana ekle\u201D seçeneğini seçin",
    stepAndroid3: "\u201CKur\u201D (Install) ile onaylayın",
    stepDesktop1: "Tarayıcı adres çubuğundaki Kurulum ikonuna tıklayın (\u2295)",
    stepDesktop2: "\u201CSistem bağlantısı\u201D ya da tarayıcı menüsünden \u201CLoomy'yi kur\u201D seçin",
    stepDesktop3: "\u201CKur\u201D ile onaylayın",
    orText: "Ya da adres çubuğundan",
    bookmarkFallback: "yer imi / kısayol olarak ekleyebilirsiniz",
    close: "Kapat",
    understood: "Anladım",
  },
  hero: {
    badge: "İşletme yönetimi yeniden tanımlanıyor",
    title1: "İşletmenizi tek",
    title2: "panelden yönetin",
    description:
      "Loomy; müşterilerinizi, servislerinizi, ödemelerinizi, randevularınızı ve ekibinizi tek bir yerden yönetmenizi sağlar. Kağıt, hesap tablosu ve kafa karışıklığı olmadan.",
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
      { label: "Ödemeler", value: "%82" },
      { label: "Randevular", value: "6" },
    ],
  },
  features: {
    badge: "Özellikler",
    title: "İşinizi büyütecek her şey tek yerde",
    description:
      "Günlük işlerinizi yönetmek için ihtiyacınız olan tüm araçlar, sade ve kullanımı kolay bir panelde toplandı.",
    items: [
      {
        title: "Müşteri Yönetimi",
        description:
          "Müşteri kartları, iletişim bilgileri ve geçmişi tek ekranda. Arama ve filtreleme ile müşterinize saniyeler içinde ulaşın.",
      },
      {
        title: "Servis ve İş Takibi",
        description:
          "Yapılan servisleri ve işleri kaydedin, dijital imza alın ve müşterinizle anında PDF olarak paylaşın.",
      },
      {
        title: "Ödeme Takibi",
        description:
          "Ödenmiş, ödenmemiş ve geciken ödemeleri görün. Aylık durum ve özet ile tahsilatınız hep gözünüzün önünde olsun.",
      },
      {
        title: "Randevu ve Planlama",
        description:
          "Takvim ve haftalık plan üzerinden randevularınızı ve ekip çalışmalarınızı düzenleyin, kimsenin işi aksamasın.",
      },
      {
        title: "Ekip Yönetimi",
        description:
          "Ekibinizi tek hesapla davet edin, rollerini belirleyin ve herkesin yaptığı işi takip edin.",
      },
      {
        title: "Anlık Panel",
        description:
          "İşletmenizin genel durumunu özet istatistiklerle görün; müşteri, servis, ödeme ve ekip hakkında tek bakışta bilgi sahibi olun.",
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
        features: ["Müşteri yönetimi", "Servis ve iş takibi", "Ödeme takibi"],
      },
      {
        name: "Profesyonel",
        description: "Büyüyen işletmeler için tam paket.",
        price: "—",
        featured: true,
        features: [
          "Başlangıç paketindeki her şey",
          "Randevu ve planlama",
          "Ekip yönetimi",
          "Dijital imza ve PDF",
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
        a: "Loomy; müşteri, servis, ödeme, randevu ve ekip yönetimini tek panelde toplayan bir işletme yönetim uygulamasıdır.",
      },
      {
        q: "Nasıl kayıt olabilirim?",
        a: "Hesabınız, davet koduyla oluşturulur. Davet kodunuzla kayıt olup e-posta adresinizi doğrulamanız yeterlidir.",
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
    installed: "Installed ✓",
    helpTitle: "How do I install Loomy?",
    stepIos1: "Tap the Share button in your browser",
    stepIos2: "Tap \u201CAdd to Home Screen\u201D",
    stepIos3: "Confirm with \u201CAdd\u201D",
    stepAndroid1: "Open the browser menu (\u2261)",
    stepAndroid2: "Choose \u201CInstall app\u201D or \u201CAdd to home screen\u201D",
    stepAndroid3: "Confirm with \u201CInstall\u201D",
    stepDesktop1: "Click the install icon in the address bar (\u2295)",
    stepDesktop2: "Choose \u201CInstall Loomy\u201D or \u201CSite app\u201D from the menu",
    stepDesktop3: "Confirm with \u201CInstall\u201D",
    orText: "Or add it from the address bar as a",
    bookmarkFallback: "bookmark / shortcut",
    close: "Close",
    understood: "Got it",
  },
  hero: {
    badge: "Business management, redefined",
    title1: "Manage your business",
    title2: "from a single panel",
    description:
      "Loomy lets you manage your customers, services, payments, appointments and team all in one place. No paper, no spreadsheets, no confusion.",
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
      { label: "Payments", value: "82%" },
      { label: "Appointments", value: "6" },
    ],
  },
  features: {
    badge: "Features",
    title: "Everything you need to grow, in one place",
    description:
      "All the tools you need to run your daily operations, gathered in a simple and easy-to-use panel.",
    items: [
      {
        title: "Customer Management",
        description:
          "Customer cards, contact details and history on one screen. Reach any customer in seconds with search and filters.",
      },
      {
        title: "Service & Job Tracking",
        description:
          "Record services and jobs, collect digital signatures and share instantly with your customer as a PDF.",
      },
      {
        title: "Payment Tracking",
        description:
          "See paid, unpaid and overdue payments. Keep your collections in sight with monthly status and summaries.",
      },
      {
        title: "Appointments & Planning",
        description:
          "Organize appointments and team work on a calendar and weekly plan. Nothing slips through the cracks.",
      },
      {
        title: "Team Management",
        description:
          "Invite your team with a single account, assign roles and track everyone's work.",
      },
      {
        title: "Live Dashboard",
        description:
          "See your business at a glance with summary statistics about customers, services, payments and team.",
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
        features: ["Customer management", "Service & job tracking", "Payment tracking"],
      },
      {
        name: "Professional",
        description: "The full package for growing businesses.",
        price: "—",
        featured: true,
        features: [
          "Everything in Starter",
          "Appointments & planning",
          "Team management",
          "Digital signature & PDF",
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
        a: "Loomy is a business management app that brings customer, service, payment, appointment and team management into a single panel.",
      },
      {
        q: "How do I sign up?",
        a: "Accounts are created with an invite code. Just sign up with your invite code and verify your email address.",
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
