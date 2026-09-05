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
  showcase: {
    badge: "Uygulama İçinden",
    title: "İşte Loomy'nin gerçek arayüzü",
    description: "Uygulamanın birebir görünümleri: panel, teklifler, servisler ve müşteriler.",
    langBtn: "EN",
    statuses: { paid: "Ödendi", pending: "Bekliyor" },
    tabs: ["Ana Sayfa", "Servis", "Teklif", "Müşteriler", "Plan", "Ödemeler", "Ayarlar"],
    profil: {
      label: "Profil",
      title: "Profil",
      subtitle: "Bilgilerinizi ve kurumsal detayları görüntüleyin",
      name: "Ad Soyad",
      email: "E-posta",
      phone: "Telefon",
      role: "Rol",
      admin: "Admin",
      signature: "İmza",
      addSignature: "İmza Eklemek İçin Tıklayın",
      info: "Bilgiler",
      companyInfo: "Kurumsal Bilgiler",
      invitationCode: "Davet Kodu",
      invitationHint: "Bu kodu paylaşıp çalışan kaydı yapabilirsiniz.",
      address: "Adres",
      companyPhone: "Telefon",
      companyGsm: "GSM",
      companyEmail: "E-posta",
      companyFax: "Fax",
      companyWebsite: "Web Sitesi",
      taxNumber: "Vergi Numarası",
      stamp: "Kaşe",
      stampValue: "Kaşe görseli seçin...",
      adminPrivileges: "Admin Yetkileri",
      adminPrivilegesDesc: "Müşteri, teklif, ödeme ve plan yönetimi tam yetkili.",
      logout: "Çıkış Yap",
      userName: "Ahmet Yılmaz",
      userEmail: "ahmet@loomy.com",
      userPhone: "0532 000 00 00",
      companyName: "Yılmaz Isı Sistemleri",
      companyAddress: "Karşıyaka Mah. Atatürk Cad. No: 42, İzmir",
      companyPhoneVal: "0232 000 00 00",
      companyGsmVal: "0532 000 00 00",
      companyEmailVal: "info@yilmazhvac.com",
      companyFaxVal: "0232 000 00 01",
      companyWebsiteVal: "yilmazhvac.com",
taxNumberVal: "123 456 7890",
      invitationCodeVal: "INVITE-7K2M",
      today: "Bugün",
    },
    settings: {
      label: "Ayarlar",
      title: "Ayarlar",
      subtitle: "Profil ve uygulama ayarlarınızı yapılandırın",
      platform: "Servis Takip Platformu",
      profileInfo: "Profil Bilgileri",
      language: "Dil",
      turkish: "Türkçe",
      english: "English",
      privacy: "Gizlilik",
      help: "Yardım",
      version: "Sürüm",
      versionVal: "1.0.0",
logout: "Çıkış Yap",
    },
    panel: {
      label: "Ana Sayfa",
      greeting: "Hoş Geldiniz",
      subtitle: "Size nasıl yardımcı olabiliriz?",
      servicesTitle: "Servisler",
      servicesDesc: "Aktif servislerinizi görüntüleyin ve yönetin",
      newService: "Yeni Servis",
      manage: "Yönet",
      quotesTitle: "Teklifler",
      quotesDesc: "Müşterilere göndereceğiniz teklifleri oluşturun ve yönetin",
      newQuote: "Yeni Teklif",
      customersTitle: "Müşteriler",
      customersDesc: "Tüm müşterilerinizi görüntüleyin ve yönetin",
      customers: ["Ayşe Yılmaz", "Mehmet Kaya"],
      customersInfo: ["Ayşe Yılmaz · 0532 000 00 00", "Mehmet Kaya · 0505 000 00 00"],
      planTitle: "Plan",
      planFilters: ["Bugün", "Yarın", "Bu Hafta"],
      planDate: "12.09.2026 — Bugün",
      planCount: "2",
      planTimes: ["10:00", "13:30"],
      planCustomers: ["Ayşe Yılmaz", "Mehmet Kaya"],
      planTeams: ["Ekip 1", "Ekip 2"],
      planTypes: ["Klima Bakım", "Kombi Montaj"],
      paymentsTitle: "ÖDEME DURUMU",
      payLabels: ["Alınan Ödeme", "Bekleyen Ödeme", "Tahmini Toplam"],
      payAmounts: ["₺12.500", "₺3.450", "₺16.000"],
      payPcts: ["35", "65", "100"],
      payColors: ["primary", "warning", "success"],
      totalsLabels: ["Alınan Toplam (2)", "Bekleyen Toplam (1)", "Tahmini Kasa"],
      totalsAmounts: ["₺12.500", "₺3.450", "₺16.000"],
      recentTitle: "SON SERVİSLER",
      recentCustomers: ["Ayşe Yılmaz", "Mehmet Kaya"],
      recentInfo: ["Klima Bakım · 12.09.2026", "Kombi Montaj · 11.09.2026"],
      recentStates: ["paid", "pending"],
      settingsTitle: "Ayarlar",
      settingsDesc: "Profil ve uygulama ayarlarınızı yapılandırın",
      editProfile: "Profili Düzenle",
      settingsBtn: "Ayarlar",
    },
    quotes: {
      label: "Teklifler",
      title: "Teklifler",
      subtitle: "Müşterilere göndereceğiniz teklifleri oluşturun ve yönetin",
      newQuote: "Yeni Teklif",
      allLabel: "Tüm Teklifler",
      count: "3 gösteriliyor",
      filters: ["Tümü", "Gün", "Ay", "Yıl"],
      cols: ["Tarih", "Müşteri", "Toplam"],
      rows: ["12.09.2026", "11.09.2026", "10.09.2026"],
      customers: ["Ayşe Yılmaz", "Mehmet Kaya", "Zeynep Demir"],
      totals: ["18.000,00 ₺", "12.000,00 USD", "4.500,00 ₺"],
      tryTotals: ["≈ ₺18.000", "≈ ₺420.000", "≈ ₺4.500"],
      filterDate: "Tarih...",
      filterCustomer: "Müşteri ara...",
    },
    services: {
      label: "Servisler",
      title: "Servis Yönetimi",
      subtitle: "Servis kayıtlarını oluşturun ve yönetin",
      newRecord: "Yeni Servis Kaydı",
      allLabel: "Tüm Servis Kayıtları",
      count: "3 kayıt gösteriliyor",
      filters: ["Tümü", "Gün", "Ay", "Yıl"],
      cols: ["Tarih", "Belge Adı", "Müşteri", "Servis", "Şablon"],
      rows: [
        ["12.09.2026", "Ayşe Yılmaz · 12.09.2026", "Ayşe Yılmaz", "Klima Bakım", "Bakım"],
        ["11.09.2026", "Mehmet Kaya · 11.09.2026", "Mehmet Kaya", "Kombi Montaj", "Montaj"],
        ["10.09.2026", "Zeynep Demir · 10.09.2026", "Zeynep Demir", "Arıza Onarım", "Şablon yok"],
      ],
      filterDate: "Tarih...",
      filterDoc: "Belge adı...",
      filterCustomer: "Müşteri ara...",
      allTemplates: "Şablonlar",
    },
    customers: {
      label: "Müşteriler",
      title: "Müşteri Yönetimi",
      subtitle: "Müşterilerinizi görüntüleyin ve yönetin",
      allLabel: "Tüm Müşteriler",
      count: "3 kayıt",
      search: "Müşteri ara...",
      rows: [
        ["Yılmaz Isı Sistemleri", "Ayşe Yılmaz", "0532 000 00 00"],
        ["Kaya Teknik Servis", "Mehmet Kaya", "0505 000 00 00"],
        ["Demir Bilişim", "Zeynep Demir", "0542 000 00 00"],
      ],
      previous: "Önceki",
      next: "Sonraki",
      page: "1 / 2",
    },
    plan: {
      label: "Plan",
      title: "Plan Yönetimi",
      subtitle: "Ekiplerinizi ve servis planlarınızı yönetin",
      teamsTitle: "Ekipler",
      newTeam: "Yeni Ekip",
      leader: "Lider:",
      personnelLabel: "Personel",
      assignments: "atama",
      day: "Gün",
      week: "Hafta",
      month: "Ay",
      allTeams: "Tüm Ekipler",
      dayShorts: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
      months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
      teams: [
        ["Ekip 1", "Ahmet Yıldız"],
        ["Ekip 2", "Murat Aydın"],
      ],
      teamMembers: ["4 Kişi", "3 Kişi"],
      teamAssigns: ["5 atama", "3 atama"],
      planList: "Plan Listesi",
      listCount: "2",
      listFilters: ["Gün", "Hafta", "Ay", "Tüm Ekipler"],
      newPlan: "Yeni Plan",
      more: "daha",
      appts: [
        ["10:00", "90 dk", "Ayşe Yılmaz", "Ekip 1", "Klima Bakım", "today"],
        ["13:30", "60 dk", "Mehmet Kaya", "Ekip 2", "Kombi Montaj", "future"],
      ],
      today: "Bugün",
      past: "Geçmiş",
      projectLabel: "Projeler",
    },
    payments: {
      label: "Ödemeler",
      title: "Ödeme Yönetimi",
      subtitle: "Ödemelerinizi görüntüleyin ve yönetin",
      status: "ÖDEME DURUMU",
      payLabels: ["Alınan Ödeme", "Bekleyen Ödeme", "Tahmini Toplam Ödeme"],
      payAmounts: ["₺12.500", "₺3.450", "₺16.000"],
      payPcts: ["35", "65", "100"],
      payColors: ["primary", "warning", "success"],
      totalsLabels: ["Alınan Toplam (2)", "Bekleyen Toplam (1)", "Tahmini Kasa"],
      totalsAmounts: ["₺12.500", "₺3.450", "₺16.000"],
      list: "ÖDEME LİSTESİ",
      search: "Ara...",
      timeFilters: ["Tümü", "Bu Gün", "Bu Hafta", "Bu Ay"],
      allStatus: "Tüm Durumlar",
      paid: "Ödendi",
      pending: "Bekliyor",
      rows: [
        ["Ayşe Yılmaz", "Klima Bakım · 12.09.2026", "₺6.000", "paid"],
        ["Mehmet Kaya", "Kombi Montaj · 11.09.2026", "₺8.000", "pending"],
        ["Zeynep Demir", "Arıza Onarım · 10.09.2026", "₺2.000", "paid"],
      ],
      previous: "Önceki",
      next: "Sonraki",
      page: "1 / 2",
    },
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
  showcase: {
    badge: "Inside the app",
    title: "The real Loomy interface",
    description: "Faithful views of the app: overview, quotes, services and customers.",
    langBtn: "TR",
    statuses: { paid: "Paid", pending: "Pending" },
    tabs: ["Home", "Services", "Quotes", "Customers", "Schedule", "Payments", "Settings"],
    profil: {
      label: "Profile",
      title: "Profile",
      subtitle: "View your information and company details",
      name: "Full Name",
      email: "Email",
      phone: "Phone",
      role: "Role",
      admin: "Admin",
      signature: "Signature",
      addSignature: "Click to Add Signature",
      info: "Information",
      companyInfo: "Company Information",
      invitationCode: "Invite Code",
      invitationHint: "Share this code to register employees.",
      address: "Address",
      companyPhone: "Phone",
      companyGsm: "GSM",
      companyEmail: "Email",
      companyFax: "Fax",
      companyWebsite: "Website",
      taxNumber: "Tax Number",
      stamp: "Stamp",
      stampValue: "Select stamp image...",
      adminPrivileges: "Admin Privileges",
      adminPrivilegesDesc: "Full access to customers, quotes, payments and planning.",
      logout: "Log Out",
      userName: "Ahmet Yılmaz",
      userEmail: "ahmet@loomy.com",
      userPhone: "+90 532 000 00 00",
      companyName: "Yılmaz HVAC Systems",
      companyAddress: "Karşıyaka District, Atatürk Ave. No: 42, İzmir",
      companyPhoneVal: "+90 232 000 00 00",
      companyGsmVal: "+90 532 000 00 00",
      companyEmailVal: "info@yilmazhvac.com",
      companyFaxVal: "+90 232 000 00 01",
      companyWebsiteVal: "yilmazhvac.com",
taxNumberVal: "123 456 7890",
      invitationCodeVal: "INVITE-7K2M",
      today: "Today",
    },
    settings: {
      label: "Settings",
      title: "Settings",
      subtitle: "Configure your profile and app preferences",
      platform: "Service Tracking Platform",
      profileInfo: "Profile Information",
      language: "Language",
      turkish: "Türkçe",
      english: "English",
      privacy: "Privacy",
      help: "Help",
      version: "Version",
      versionVal: "1.0.0",
logout: "Log Out",
    },
    panel: {
      label: "Home",
      greeting: "Welcome",
      subtitle: "How can we help you?",
      servicesTitle: "Services",
      servicesDesc: "View and manage your active services",
      newService: "New Service",
      manage: "Manage",
      quotesTitle: "Quotes",
      quotesDesc: "Create and manage quotes to send to customers",
      newQuote: "New Quote",
      customersTitle: "Customers",
      customersDesc: "View and manage all your customers",
      customers: ["Ayşe Yılmaz", "Mehmet Kaya"],
      customersInfo: ["Ayşe Yılmaz · 0532 000 00 00", "Mehmet Kaya · 0505 000 00 00"],
      planTitle: "Plan",
      planFilters: ["Today", "Tomorrow", "This week"],
      planDate: "12.09.2026 — Today",
      planCount: "2",
      planTimes: ["10:00", "13:30"],
      planCustomers: ["Ayşe Yılmaz", "Mehmet Kaya"],
      planTeams: ["Team 1", "Team 2"],
      planTypes: ["AC Maintenance", "Boiler Installation"],
      paymentsTitle: "PAYMENT STATUS",
      payLabels: ["Received", "Pending", "Estimated Total"],
      payAmounts: ["₺12,500", "₺3,450", "₺16,000"],
      payPcts: ["35", "65", "100"],
      payColors: ["primary", "warning", "success"],
      totalsLabels: ["Received Total (2)", "Pending Total (1)", "Estimated Cash"],
      totalsAmounts: ["₺12,500", "₺3,450", "₺16,000"],
      recentTitle: "RECENT SERVICES",
      recentCustomers: ["Ayşe Yılmaz", "Mehmet Kaya"],
      recentInfo: ["AC Maintenance · 12.09.2026", "Boiler Installation · 11.09.2026"],
      recentStates: ["paid", "pending"],
      settingsTitle: "Settings",
      settingsDesc: "Configure your profile and app settings",
      editProfile: "Edit Profile",
      settingsBtn: "Settings",
    },
    quotes: {
      label: "Quotes",
      title: "Quotes",
      subtitle: "Create and manage quotes to send to customers",
      newQuote: "New Quote",
      allLabel: "All Quotes",
      count: "3 showing",
      filters: ["All", "Day", "Month", "Year"],
      cols: ["Date", "Customer", "Total"],
      rows: ["12.09.2026", "11.09.2026", "10.09.2026"],
      customers: ["Ayşe Yılmaz", "Mehmet Kaya", "Zeynep Demir"],
      totals: ["18,000.00 ₺", "12,000.00 USD", "4,500.00 ₺"],
      tryTotals: ["≈ ₺18,000", "≈ ₺420,000", "≈ ₺4,500"],
      filterDate: "Date...",
      filterCustomer: "Search customer...",
    },
    services: {
      label: "Services",
      title: "Service Management",
      subtitle: "Create and manage service records",
      newRecord: "New Service Record",
      allLabel: "All Service Records",
      count: "3 records showing",
      filters: ["All", "Day", "Month", "Year"],
      cols: ["Date", "Doc Name", "Customer", "Service", "Template"],
      rows: [
        ["12.09.2026", "Ayşe Yılmaz · 12.09.2026", "Ayşe Yılmaz", "AC Maintenance", "Maintenance"],
        ["11.09.2026", "Mehmet Kaya · 11.09.2026", "Mehmet Kaya", "Boiler Installation", "Installation"],
        ["10.09.2026", "Zeynep Demir · 10.09.2026", "Zeynep Demir", "Repair", "No template"],
      ],
      filterDate: "Date...",
      filterDoc: "Doc name...",
      filterCustomer: "Search customer...",
      allTemplates: "Templates",
    },
    customers: {
      label: "Customers",
      title: "Customer Management",
      subtitle: "View and manage your customers",
      allLabel: "All Customers",
      count: "3 records",
      search: "Search customers...",
      rows: [
        ["Yılmaz HVAC Systems", "Ayşe Yılmaz", "0532 000 00 00"],
        ["Kaya Technical Service", "Mehmet Kaya", "0505 000 00 00"],
        ["Demir IT Solutions", "Zeynep Demir", "0542 000 00 00"],
      ],
      previous: "Previous",
      next: "Next",
      page: "1 / 2",
    },
    plan: {
      label: "Plan",
      title: "Schedule Management",
      subtitle: "Manage your teams and service schedules",
      teamsTitle: "Teams",
      newTeam: "New Team",
      leader: "Leader:",
      personnelLabel: "Personnel",
      assignments: "assignments",
      day: "Day",
      week: "Week",
      month: "Month",
      allTeams: "All Teams",
      dayShorts: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      teams: [
        ["Team 1", "Ahmet Yıldız"],
        ["Team 2", "Murat Aydın"],
      ],
      teamMembers: ["4 people", "3 people"],
      teamAssigns: ["5 assignments", "3 assignments"],
      planList: "Plan List",
      listCount: "2",
      listFilters: ["Day", "Week", "Month", "All Teams"],
      newPlan: "New Plan",
      more: "more",
      appts: [
        ["10:00", "90 min", "Ayşe Yılmaz", "Team 1", "AC Maintenance", "today"],
        ["13:30", "60 min", "Mehmet Kaya", "Team 2", "Boiler Installation", "future"],
      ],
      today: "Today",
      past: "Past",
      projectLabel: "Projects",
    },
    payments: {
      label: "Payments",
      title: "Payment Management",
      subtitle: "View and manage your payments",
      status: "PAYMENT STATUS",
      payLabels: ["Received Payment", "Pending Payment", "Estimated Total Payment"],
      payAmounts: ["₺12,500", "₺3,450", "₺16,000"],
      payPcts: ["35", "65", "100"],
      payColors: ["primary", "warning", "success"],
      totalsLabels: ["Total Received (2)", "Total Pending (1)", "Estimated Cash"],
      totalsAmounts: ["₺12,500", "₺3,450", "₺16,000"],
      list: "PAYMENT LIST",
      search: "Search...",
      timeFilters: ["All", "Today", "This Week", "This Month"],
      allStatus: "All Status",
      paid: "Paid",
      pending: "Pending",
      rows: [
        ["Ayşe Yılmaz", "AC Maintenance · 12.09.2026", "₺6,000", "paid"],
        ["Mehmet Kaya", "Boiler Installation · 11.09.2026", "₺8,000", "pending"],
        ["Zeynep Demir", "Repair · 10.09.2026", "₺2,000", "paid"],
      ],
      previous: "Previous",
      next: "Next",
      page: "1 / 2",
    },
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
