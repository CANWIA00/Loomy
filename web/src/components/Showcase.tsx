import { useState } from "react";
import { useLanguage } from "../i18n";

type ScreenKey =
  | "panel"
  | "quotes"
  | "services"
  | "customers"
  | "plan"
  | "payments"
  | "profil"
  | "settings"
  | "customer"
  | "document";

const screenKeys: ScreenKey[] = ["panel", "services", "quotes", "customers", "plan", "payments", "settings"];

const labelColors: Record<string, string> = {
  primary: "amt-primary",
  warning: "amt-warn",
  success: "amt-success",
};

type MockS = { label: string; date: string; tech: string; fee: string };
type MockQ = { label: string; date: string; totals: string; tryTotal: string };
type MockC = {
  companyName: string;
  contactPerson: string;
  phone: string;
  subscriberNo: string;
  email: string;
  website: string;
  address: string;
  services: MockS[];
  quotes: MockQ[];
};

const MOCK_CUSTOMERS: MockC[] = [
  {
    companyName: "Yılmaz Isı Sistemleri",
    contactPerson: "Ayşe Yılmaz",
    phone: "0532 000 00 00",
    subscriberNo: "AK-101204",
    email: "info@yilmazhvac.com",
    website: "yilmazhvac.com",
    address: "Karşıyaka Mah. Ata Cad. No: 42",
    services: [
      { label: "Klima Bakım", date: "12.09.2026", tech: "Ahmet Yıldız", fee: "₺6.000" },
      { label: "Kış Hazırlık Kontrolü", date: "05.09.2026", tech: "Ahmet Yıldız", fee: "Ücretsiz" },
      { label: "Filtre Değişimi", date: "02.08.2026", tech: "Murat Aydın", fee: "₺1.250" },
    ],
    quotes: [
      { label: "Kamera Sistemleri Teklifi", date: "05.09.2026", totals: "136.500,00 ₺", tryTotal: "≈ ₺163.800" },
      { label: "Yıllık Bakım Anlaşması", date: "02.08.2026", totals: "89.250,00 ₺", tryTotal: "≈ ₺107.100" },
    ],
  },
  {
    companyName: "Kaya Teknik Servis",
    contactPerson: "Mehmet Kaya",
    phone: "0505 000 00 00",
    subscriberNo: "AK-201150",
    email: "mehmet@kayateknik.com",
    website: "kayateknik.com",
    address: "Mimar Sinan Bulvarı No: 88 Bornova",
    services: [
      { label: "Kombi Montaj", date: "11.09.2026", tech: "Ahmet Yıldız", fee: "₺8.000" },
      { label: "Arıza Tespiti", date: "01.09.2026", tech: "Murat Aydın", fee: "₺1.500" },
      { label: "Baca Bağlantı Kontrolü", date: "14.07.2026", tech: "Ahmet Yıldız", fee: "Ücretsiz" },
    ],
    quotes: [
      { label: "Kombi Kurulum Teklifi", date: "09.09.2026", totals: "12.000,00 USD", tryTotal: "≈ ₺420.000" },
      { label: "Periyodik Bakım Teklifi", date: "22.07.2026", totals: "18.000,00 ₺", tryTotal: "≈ ₺21.600" },
    ],
  },
  {
    companyName: "Demir Bilişim",
    contactPerson: "Zeynep Demir",
    phone: "0542 000 00 00",
    subscriberNo: "AK-311982",
    email: "zeynep@demirbilisim.com",
    website: "demirbilisim.com",
    address: "Kemalpaşa OSB 2. Cadde No: 12",
    services: [
      { label: "Arıza Onarım", date: "10.09.2026", tech: "Ahmet Yıldız", fee: "₺2.000" },
      { label: "Yazılım Güncelleme", date: "30.08.2026", tech: "Murat Aydın", fee: "₺5.750" },
    ],
    quotes: [
      { label: "Bilişim Altyapı Teklifi", date: "08.09.2026", totals: "4.500,00 ₺", tryTotal: "≈ ₺5.400" },
    ],
  },
];

const QUOTE_ITEMS: [string, string, string, string, string][] = [
  ["CDVX-24B IP Dome Kamera", "4K çözünürlük · gece görüş", "8", "12.500,00 ₺", "100.000,00 ₺"],
  ["NVR-16 Kayıt Cihazı", "2 TB HDD dahil", "2", "15.250,00 ₺", "30.500,00 ₺"],
  ["POES-16 16 Port Switch", "PoE+ 120W", "2", "3.000,00 ₺", "6.000,00 ₺"],
  ["SM-24 Dedektör Seti", "İthal · harici sensör", "10", "150,00 $", "1.500,00 $"],
];

const FX_ROWS: [string, string][] = [
  ["1 USD", "33,1245 ₺"],
  ["1 EUR", "40,7731 ₺"],
  ["1 GBP", "44,2010 ₺"],
];

const SVC_GROUPS: { items: [string, boolean][] }[] = [
  {
    items: [
      ["Alarm", true],
      ["Yangın", false],
      ["CCTV", true],
      ["AHM Bağlantısı", true],
      ["Kablolama", false],
      ["Montaj", true],
      ["Devreye Alma Eğitimi", false],
      ["Belge Kontrolü", false],
    ],
  },
  {
    items: [
      ["AHM Sinyal Kontrolü", false],
      ["Eğitim ve Tatbikat", false],
      ["DOVR Kayıt Kontrol", true],
      ["Uzak Erişim", false],
      ["Kayıt ve Yedekleme Eğitimi", false],
      ["Kameralara Netlik ve Yön Ayarı", true],
      ["Test Sinyal Programlama", true],
      ["Akü Ömrü Kontrolü", false],
    ],
  },
];

const Sig = ({ t }: { t: "a" | "b" }) => (
  <svg viewBox="0 0 120 42" aria-hidden>
    <path
      d={
        t === "a"
          ? "M6 30 C18 8, 30 36, 42 18 S 60 6, 70 24 S 88 32, 96 14 S 106 18, 114 26"
          : "M8 24 C20 34, 30 8, 42 22 S 58 30, 68 12 S 84 20, 92 16 S 104 28, 112 20"
      }
      fill="none"
      stroke="#222238"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Stamp = () => (
  <div className="an-stamp">
    <span className="an-stamp-ring" />
    <span className="an-stamp-star">✦</span>
    <strong>1D GÜVENLİK</strong>
    <em>VE İLETİŞİM LTD. ŞTİ.</em>
    <span className="an-stamp-reg">İZMİR · KVKK</span>
  </div>
);

const DocRow = ({ l, v }: { l: string; v: string }) => (
  <span className="an-doc-row">
    <b>{l}</b>
    <span>{v}</span>
  </span>
);

const CheckItem = ({ label, on }: { label: string; on: boolean }) => (
  <span className={`an-cbox${on ? " on" : ""}`}>
    <i>{on ? "✓" : ""}</i>
    <b>{label}</b>
  </span>
);

function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const p = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const s = { width: size, height: size, flexShrink: 0 as const };
  switch (name) {
    case "home":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M6 9.5V20h12V9.5" /></svg>;
    case "construct":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M14.5 6.5a4 4 0 0 1 5.5-3.7L17 5.8l1.2 1.2 3-3A4 4 0 1 1 14.5 12l-8 8a2.2 2.2 0 0 1-3.1-3.1l8-8" /></svg>;
    case "doc":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M7 3.5h6.5L18.5 8.5V20H7V3.5z" /><path d="M13.5 3.5v5h5" /></svg>;
    case "people":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-2.8 2.4-4.5 5.5-4.5s5.5 1.7 5.5 4.5" /><path d="M15.5 5.8a3 3 0 0 1 0 5.4" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>;
    case "card":
      return <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="M3 9.5h18" /></svg>;
    case "settings":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>;
    case "chatbubbles":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M8 10.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3.5L9.5 17v-1.5H8a2 2 0 0 1-2-2v-3z" /><circle cx="14.5" cy="11" r="0.6" fill="currentColor" /></svg>;
    case "person-add":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-2.8 2.4-4.5 5.5-4.5" /><path d="M14.5 10.5v5M17 13h-5" /></svg>;
    case "person-remove":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-2.8 2.4-4.5 5.5-4.5" /><path d="M17 13h-5" /></svg>;
    case "sunny":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></svg>;
    case "moon":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M20 13.5A8.5 8.5 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z" /></svg>;
    case "person-circle":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="9" /><path d="M12 11a2.7 2.7 0 1 0 0-5.4A2.7 2.7 0 0 0 12 11ZM6 19.5c1-2.8 4.5-4 6-4s5 1.2 6 4" /></svg>;
    case "person":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="9" r="3.5" /><path d="M5 20c1.2-3.4 6-4.2 7-4.2s5.8.8 7 4.2" /></svg>;
    case "shield":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 3.5 5 6v5.5c0 4 2.7 6.8 7 9 4.3-2.2 7-5 7-9V6l-7-2.5Z" /><path d="m9 11.5 2 2 4-4.5" /></svg>;
    case "help":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.2a2.5 2.5 0 1 1 3.6 2.3c-.9.5-1.2 1-1.2 2" /><circle cx="12" cy="17" r="0.4" fill="currentColor" /></svg>;
    case "info":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.4" fill="currentColor" /></svg>;
    case "globe":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 2.6 4.2 5.5 4.2 9S14.8 18.4 12 21c-2.8-2.6-4.2-5.5-4.2-9S9.2 5.6 12 3Z" /></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="m12 4 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L4.5 9.5l5.2-.8L12 4Z" /></svg>;
    case "back":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M15 5l-7 7 7 7" /></svg>;
    case "phone":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M5 4h4l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></svg>;
    case "mail":
      return <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>;
    case "location":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "cloud":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M7 18.5h10.5a3.5 3.5 0 0 0 .7-6.9A5.5 5.5 0 0 0 7 9.6a4 4 0 0 0 0 8.9Z" /></svg>;
    case "refresh":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v4h-4" /></svg>;
    case "search":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.8-4.8" /></svg>;
    case "check-circle":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></svg>;
    case "clock":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
    case "chevron-down":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="m6 9 6 6 6-6" /></svg>;
    case "chevron-up":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="m6 15 6-6 6 6" /></svg>;
    case "chevron-fwd":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="m9 6 6 6-6 6" /></svg>;
    case "arrow-fwd":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" /></svg>;
    case "share":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 3v11" /><circle cx="12" cy="3" r="1.8" /><circle cx="6" cy="15.5" r="1.8" /><circle cx="18" cy="15.5" r="1.8" /><path d="m6.8 14.5 4.4-7M17.2 14.5l-4.4-7" /></svg>;
    case "trash":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M4 7h16M9 7V5h6v2M6.5 7l1 13h9l1-13M10 11v5M14 11v5" /></svg>;
    case "eye":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case "pencil":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M4 20l4.5-1 11-11-3.5-3.5-11 11L4 20Z" /><path d="m14 5.5 3.5 3.5" /></svg>;
    case "download":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" /></svg>;
    case "plus":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 5v14M5 12h14" /></svg>;
    case "close":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    default:
      return null;
  }
}

const tabBarIcons = ["home", "construct", "doc", "people", "calendar", "card", "settings"];

export default function Showcase() {
  const { t, lang, setLang } = useLanguage();
  const [screen, setScreen] = useState<ScreenKey>("panel");
  const [isDark, setIsDark] = useState(true);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [custIdx, setCustIdx] = useState(0);
  const [doc, setDoc] = useState<{ kind: "quote" | "service"; title: string; date: string } | null>(null);
  const sc = t.showcase;
  const statusLabels = sc.statuses as Record<string, string>;
  const statusLabel = (state: string) => statusLabels[state] ?? state;

  const toggleTheme = () => setIsDark((d) => !d);
  const toggleLang = () => setLang(lang === "tr" ? "en" : "tr");

  const activeTab =
    screen === "profil" || screen === "customer" || screen === "document"
      ? -1
      : screen === "panel"
        ? 0
        : screen === "quotes"
          ? 2
          : screen === "services"
            ? 1
            : screen === "customers"
              ? 3
              : screen === "plan"
                ? 4
                : screen === "payments"
                  ? 5
                  : 6;

const PayBars = ({
  data,
}: {
  data: {
    payLabels: readonly string[];
    payAmounts: readonly string[];
    payPcts: readonly string[];
    payColors: readonly string[];
  };
}) => {
  const { payLabels, payAmounts, payPcts, payColors } = data;
  return (
    <>
      {payLabels.map((label, i) => (
        <div className="an-bar-wrap" key={label}>
          <div className="an-bar-top">
            <span>{label}</span>
            <strong className={labelColors[payColors[i] ?? "primary"]}>{payAmounts[i]}</strong>
          </div>
          <div className="an-bar">
            <i className={payColors[i] ?? "primary"} style={{ width: `${payPcts[i]}%` }} />
          </div>
        </div>
      ))}
    </>
  );
};

  const ScreenHead = ({ title, subtitle, backTo = "panel" }: { title: string; subtitle?: string; backTo?: ScreenKey }) => (
    <div className="an-top">
      <div className="an-head">
        <button className="an-chip" style={{ padding: 0, flexShrink: 0 }} onClick={() => setScreen(backTo)}>
          <Icon name="back" size={22} color="var(--sc-primary)" />
        </button>
        <div style={{ minWidth: 0, flexGrow: 1, textAlign: "left" }}>
          <h3 className="an-title">{title}</h3>
          {subtitle && <span className="an-top-sub">{subtitle}</span>}
        </div>
      </div>
      <div className="an-chips">
        <button className="an-chip" onClick={toggleLang}>{sc.langBtn}</button>
        <button className="an-chip" style={{ padding: 0 }} onClick={toggleTheme}>
          <Icon name={isDark ? "sunny" : "moon"} size={20} color="var(--sc-primary)" />
        </button>
        <button className="an-chip" style={{ padding: 0 }} onClick={() => { setScreen("panel"); }}>
          <Icon name="home" size={22} color="var(--sc-primary)" />
        </button>
      </div>
    </div>
  );

  const renderBody = () => {
    if (screen === "profil") {
      const pr = sc.profil;
      return (
        <>
          <ScreenHead title={pr.title} />
          <div className="an-ph-user">
            <div className="an-ph-avatar">{pr.userName.charAt(0)}</div>
            <strong className="an-ph-name">{pr.userName}</strong>
            <span className="an-ph-mail">{pr.userEmail}</span>
            <span className="an-fpill an-fpill-active-purple">
              <Icon name="check-circle" size={14} color="var(--sc-primary-on)" />
              {pr.admin}
            </span>
          </div>

          <div className="an-card">
            <div className="an-card-head">
              <span className="an-iconbox an-ib-primary">
                <Icon name="person-circle" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{pr.info}</strong>
              </div>
            </div>
            <div className="an-profile-rows">
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.name}</span>
                <span className="an-profile-val">{pr.userName}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.email}</span>
                <span className="an-profile-val">{pr.userEmail}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.phone}</span>
                <span className="an-profile-val">{pr.userPhone}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.role}</span>
                <span className="an-profile-val">
                  <span className="an-admin-chip">
                    <Icon name="check-circle" size={13} color="var(--sc-primary)" />
                    {pr.admin}
                  </span>
                </span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.signature}</span>
                <span className="an-profile-val an-profile-link">{pr.addSignature}</span>
              </div>
            </div>
          </div>

          <div className="an-card">
            <div className="an-card-head">
              <span className="an-iconbox an-ib-teal">
                <Icon name="shield" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{pr.adminPrivileges}</strong>
              </div>
            </div>
            <p className="an-profile-desc">{pr.adminPrivilegesDesc}</p>
          </div>

          <div className="an-card">
            <div className="an-card-head">
              <span className="an-iconbox an-ib-purple">
                <Icon name="person" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{pr.companyInfo}</strong>
              </div>
            </div>
            <div className="an-profile-rows">
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.name}</span>
                <span className="an-profile-val">{pr.companyName}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.invitationCode}</span>
                <span className="an-profile-val">
                  <span className="an-token">{pr.invitationCodeVal}</span>
                </span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.address}</span>
                <span className="an-profile-val">{pr.companyAddress}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.companyPhone}</span>
                <span className="an-profile-val">{pr.companyPhoneVal}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.companyGsm}</span>
                <span className="an-profile-val">{pr.companyGsmVal}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.companyEmail}</span>
                <span className="an-profile-val">{pr.companyEmailVal}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.companyFax}</span>
                <span className="an-profile-val">{pr.companyFaxVal}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.companyWebsite}</span>
                <span className="an-profile-val">{pr.companyWebsiteVal}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.taxNumber}</span>
                <span className="an-profile-val">{pr.taxNumberVal}</span>
              </div>
              <div className="an-profile-row">
                <span className="an-profile-label">{pr.stamp}</span>
                <span className="an-profile-val an-profile-link">{pr.stampValue}</span>
              </div>
            </div>
          </div>

          <p className="an-profile-hint">{pr.invitationHint}</p>

          <button className="an-logout">
            <Icon name="trash" size={16} color="#ef4444" />
            {pr.logout}
          </button>
        </>
      );
    }

    if (screen === "settings") {
      const st = sc.settings;
      const langVal = lang === "tr" ? st.turkish : st.english;
      return (
        <>
          <ScreenHead title={st.title} />
          <p className="an-sub">{st.subtitle}</p>

          <div className="an-settings-logo">
            <div className="an-ph-avatar an-settings-avatar">LM</div>
            <strong>Loomy</strong>
            <span>{st.platform}</span>
          </div>

          <div className="an-settings-card">
            <button className="an-menu-row" onClick={() => setScreen("profil")}>
              <span className="an-menu-ic">
                <Icon name="person" size={17} />
              </span>
              <span className="an-menu-label">{st.profileInfo}</span>
              <span className="an-menu-right">
                <Icon name="chevron-fwd" size={15} />
              </span>
            </button>
            <button className="an-menu-row" onClick={toggleLang}>
              <span className="an-menu-ic">
                <Icon name="globe" size={17} />
              </span>
              <span className="an-menu-label">{st.language}</span>
              <span className="an-menu-right">
                <span>{langVal}</span>
                <Icon name="chevron-fwd" size={15} />
              </span>
            </button>
            <button className="an-menu-row" onClick={toggleTheme}>
              <span className="an-menu-ic">
                <Icon name="shield" size={17} />
              </span>
              <span className="an-menu-label">{st.privacy}</span>
              <span className="an-menu-right">
                <Icon name="chevron-fwd" size={15} />
              </span>
            </button>
            <button className="an-menu-row">
              <span className="an-menu-ic">
                <Icon name="help" size={17} />
              </span>
              <span className="an-menu-label">{st.help}</span>
              <span className="an-menu-right">
                <Icon name="chevron-fwd" size={15} />
              </span>
            </button>
            <button className="an-menu-row">
              <span className="an-menu-ic">
                <Icon name="info" size={17} />
              </span>
              <span className="an-menu-label">{st.version}</span>
              <span className="an-menu-right">
                <span>{st.versionVal}</span>
                <Icon name="chevron-fwd" size={15} />
              </span>
            </button>
          </div>

          <button className="an-logout-pill">
            {st.logout}
          </button>
        </>
      );
    }

    if (screen === "panel") {
      const p = sc.panel;
      return (
        <>
          <div className="an-top">
            <h3 className="an-title">{p.greeting}</h3>
            <div className="an-chips">
              <button className="an-chip" onClick={toggleLang}>{sc.langBtn}</button>
              <button className="an-chip" style={{ padding: 0 }} onClick={toggleTheme}>
                <Icon name={isDark ? "sunny" : "moon"} size={20} color="var(--sc-primary)" />
              </button>
              <button className="an-chip" style={{ padding: 0 }} onClick={() => setScreen("profil")}>
                <Icon name="person-circle" size={26} color="var(--sc-primary)" />
              </button>
            </div>
          </div>
          <p className="an-sub">{p.subtitle}</p>

          <div className="an-stack">
            <div className="an-card an-row">
              <span className="an-iconbox an-ib-primary">
                <Icon name="chatbubbles" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{p.servicesTitle}</strong>
                <span>{p.servicesDesc}</span>
              </div>
              <div className="an-btn-row">
                <span className="an-btn">
                  <Icon name="person-add" size={14} color="var(--sc-primary-on)" />
                  {p.newService}
                </span>
                <span className="an-btn">{p.manage}</span>
              </div>
            </div>

            <div className="an-card an-row">
              <span className="an-iconbox an-ib-primary">
                <Icon name="doc" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{p.quotesTitle}</strong>
                <span>{p.quotesDesc}</span>
              </div>
              <div className="an-btn-row">
                <span className="an-btn">
                  <Icon name="plus" size={14} color="var(--sc-primary-on)" />
                  {p.newQuote}
                </span>
                <span className="an-btn">{p.manage}</span>
              </div>
            </div>

            <div className="an-col2">
              <div className="an-card">
                <div className="an-card-head">
                  <span className="an-iconbox an-ib-teal">
                    <Icon name="people" size={20} />
                  </span>
                  <div className="an-card-title">
                    <strong>{p.customersTitle}</strong>
                    <span>{p.customersDesc}</span>
                  </div>
                  <span className="an-btn-round">
                    <Icon name="person-add" size={18} color="var(--sc-primary-on)" />
                  </span>
                </div>
                {p.customers.map((name, i) => (
                  <div className="an-listrow" key={name}>
                    <span className="an-avatar">{name.charAt(0)}</span>
                    <div className="an-rowmain">
                      <strong>{name}</strong>
                      <span>{p.customersInfo[i]}</span>
                    </div>
                    <Icon name="chevron-fwd" size={16} color="var(--sc-border)" />
                  </div>
                ))}
              </div>

              <div className="an-card">
                <div className="an-card-head">
                  <span className="an-iconbox an-ib-purple">
                    <Icon name="calendar" size={20} />
                  </span>
                  <div className="an-card-title">
                    <strong>{p.planTitle}</strong>
                  </div>
                  <Icon name="arrow-fwd" size={20} color="var(--sc-purple)" />
                </div>
                <div className="an-plan-filters">
                  {p.planFilters.map((f, i) => (
                    <span
                      key={f}
                      className={i === 0 ? "an-fpill-active-purple" : "an-fpill"}
                      style={{ height: 26, padding: "0 10px" }}
                    >
                      {f}
                    </span>
                  ))}
                  <span className="an-plan-count">{p.planCount}</span>
                </div>
                <p className="an-plan-date">{p.planDate}</p>
                {p.planTimes.map((time, i) => (
                  <div className="an-cal" key={time}>
                    <div className="an-cal-top">
                      <span className="an-cal-time">{time}</span>
                      <span className="an-cal-cust">{p.planCustomers[i]}</span>
                    </div>
                    <div className="an-cal-bottom">
                      <span className="an-cal-team">{p.planTeams[i]}</span>
                      <span className="an-cal-type">{p.planTypes[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-head">
                <span className="an-iconbox an-ib-warn">
                  <Icon name="card" size={20} />
                </span>
                <div className="an-card-title">
                  <strong>{p.paymentsTitle}</strong>
                </div>
              </div>
              <div className="an-pay">
                <div>
                  <PayBars data={p} />
                  {p.totalsLabels.map((label, i) => (
                    <div className={`an-total-row${i === p.totalsLabels.length - 1 ? " pb" : ""}`} key={label}>
                      <span>{label}</span>
                      <strong className={labelColors[p.payColors[i] ?? "primary"]}>{p.totalsAmounts[i]}</strong>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="an-recent-title">{p.recentTitle}</p>
                  <div className="an-recent">
                    {p.recentCustomers.map((name, i) => {
                      const state = p.recentStates[i];
                      return (
                        <div className="an-recent-row" key={name}>
                          <div className="an-rowmain" style={{ marginLeft: 0 }}>
                            <strong>{name}</strong>
                            <span>{p.recentInfo[i]}</span>
                          </div>
                          <span className={`an-pill ${state}`}>
                            <Icon name={state === "paid" ? "check-circle" : "clock"} size={12} />
                            {statusLabel(state)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="an-card an-row">
              <span className="an-iconbox an-ib-danger">
                <Icon name="settings" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{p.settingsTitle}</strong>
                <span>{p.settingsDesc}</span>
              </div>
              <div className="an-btn-row">
                <span className="an-btn">{p.editProfile}</span>
                <span className="an-btn">{p.settingsBtn}</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (screen === "quotes") {
      const q = sc.quotes;
      const qf = sc.forms;
      const dd = sc.doc;
      return (
        <>
          <ScreenHead title={q.title} />
          <p className="an-sub">{q.subtitle}</p>

          <button className="an-head-new" onClick={() => setShowQuoteForm(!showQuoteForm)}>
            <span className="an-chevbox">
              <Icon name={showQuoteForm ? "chevron-up" : "chevron-down"} size={16} />
            </span>
            <strong style={{ color: "var(--sc-text)", fontSize: 15, fontWeight: 600 }}>{qf.qNewQuote}</strong>
          </button>

          {showQuoteForm && (
            <div className="an-form-card">
              <div className="an-form-head">
                <strong>{qf.qNewQuote}</strong>
                <button className="an-form-close" onClick={() => setShowQuoteForm(false)}>
                  <Icon name="close" size={16} color="var(--sc-muted)" />
                </button>
              </div>

              <button className="an-select-row">
                <span>
                  <Icon name="person" size={15} color="var(--sc-muted)" />
                  {qf.qSelectCustomer}
                </span>
                <Icon name="chevron-down" size={15} color="var(--sc-secondary)" />
              </button>
              <span className="an-select-hint">{qf.qSearchCustomer}</span>

              <div className="an-form-grid">
                <label className="an-field">
                  <span>{qf.qCustomerName}</span>
                  <input className="af-input" placeholder="Yılmaz Isı Sistemleri" />
                </label>
                <label className="an-field">
                  <span>{qf.qPhone}</span>
                  <input className="af-input" placeholder="0532 000 00 00" />
                </label>
                <label className="an-field">
                  <span>{qf.qContactPerson}</span>
                  <input className="af-input" placeholder="Ayşe Yılmaz" />
                </label>
                <label className="an-field">
                  <span>{qf.qSubscriberNo}</span>
                  <input className="af-input" placeholder="12345" />
                </label>
                <label className="an-field">
                  <span>{qf.qEmail}</span>
                  <input className="af-input" placeholder="info@yilmazhvac.com" />
                </label>
                <label className="an-field">
                  <span>{qf.qAddress}</span>
                  <input className="af-input" placeholder="Karşıyaka Mah. Ata Cad. No: 42" />
                </label>
                <label className="an-field">
                  <span>{qf.qFax}</span>
                  <input className="af-input" placeholder="0232 000 00 01" />
                </label>
                <label className="an-field">
                  <span>{qf.qWebsite}</span>
                  <input className="af-input" placeholder="yilmazhvac.com" />
                </label>
              </div>

              <div className="an-form-grid">
                <label className="an-field">
                  <span>{qf.qDocumentDate}</span>
                  <input className="af-input" placeholder={qf.qDatePlaceholder} />
                </label>
                <div className="an-field">
                  <span>{qf.qValidUntil}</span>
                  <div className="an-chiprow">
                    <span className="an-fpill an-fpill active">{qf.qValid1Week}</span>
                    <span className="an-fpill">{qf.qValid2Week}</span>
                  </div>
                </div>
              </div>

              <div className="an-form-head an-form-head-sub">
                <strong>{qf.qItems}</strong>
              </div>

              <div className="an-item-card">
                <div className="an-item-top">
                  <input className="af-input" placeholder={qf.qProductNamePlaceholder} />
                  <span className="an-ib-danger an-ib-btn">
                    <Icon name="trash" size={14} />
                  </span>
                </div>
                <textarea className="af-input af-ta" rows={2} placeholder={qf.qDetailsPlaceholder} />
                <div className="an-form-grid af-line">
                  <label className="an-field">
                    <span>{qf.qQuantity}</span>
                    <input className="af-input" defaultValue="1" />
                  </label>
                  <label className="an-field">
                    <span>{qf.qUnitPrice}</span>
                    <input className="af-input" placeholder="0,00" />
                  </label>
                  <label className="an-field">
                    <span>{qf.qCurrency}</span>
                    <button className="af-input af-chip" type="button">
                      {qf.currencyTry}
                    </button>
                  </label>
                </div>
              </div>

              <button className="an-add-item" type="button">
                <Icon name="plus" size={14} color="var(--sc-primary)" />
                {qf.qAddItem}
              </button>

              <div className="an-sum">
                <div className="an-sum-row">
                  <span>{qf.qSubtotal}</span>
                  <strong>₺1.200,00</strong>
                </div>
                <div className="an-sum-row">
                  <span>{qf.qKdv} %20</span>
                  <strong>₺240,00</strong>
                </div>
                <div className="an-sum-row total">
                  <span>{qf.qGrandTotal}</span>
                  <strong>₺1.440,00</strong>
                </div>
              </div>

              <div className="an-rate-card">
                <div className="an-rate-head">
                  <span className="an-rate-live"><i />{dd.fxLive} · {dd.fxHead}</span>
                  <span className="an-rate-src">{dd.fxSource} · {dd.fxDate}</span>
                  <button className="an-rate-refresh" type="button"><Icon name="refresh" size={12} />{dd.fxRefresh}</button>
                </div>
                {FX_ROWS.map((r) => (
                  <div className="an-rate-row" key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>
                ))}
              </div>

              <label className="an-field">
                <span>{qf.qNotes}</span>
                <textarea className="af-input af-ta" rows={3} placeholder={qf.qNotesPlaceholder} />
              </label>

              <div className="an-form-actions">
                <button className="af-btn af-btn-danger" type="button">{qf.qClear}</button>
                <button className="af-btn af-btn-primary" type="button">
                  <Icon name="check-circle" size={15} color="var(--sc-primary-on)" />
                  {qf.qSave}
                </button>
              </div>
            </div>
          )}

          <div className="an-cut-head">
            <span className="an-cut-title">{q.allLabel}</span>
            <div className="an-chips" style={{ gap: 8 }}>
              <span className="an-refresh">
                <Icon name="refresh" size={15} />
              </span>
              <span className="an-cut-count">{q.count}</span>
            </div>
          </div>

          <div className="an-filters">
            {q.filters.map((f, i) => (
              <span key={f} className={`an-fpill${i === 0 ? " active" : ""}`}>
                {f}
              </span>
            ))}
            <span className="an-inp">{q.filterDate}</span>
            <span className="an-inp an-inp-grow">{q.filterCustomer}</span>
            <span className="an-clear">
              <Icon name="close" size={15} />
            </span>
          </div>

          <div className="an-table">
            <div className="an-tr an-th">
              <span className="an-c-date">{q.cols[0]}</span>
              <span className="an-c-main">{q.cols[1]}</span>
              <span className="an-c-right">{q.cols[2]}</span>
              <span className="an-actions an-th-empty" />
            </div>
            {q.rows.map((date, i) => (
              <div className="an-tr" key={date}>
                <span className="an-c-date">{date}</span>
                <span className="an-c-main">{q.customers[i]}</span>
                <span className="an-c-right">
                  <strong>{q.totals[i]}</strong>
                  <span>{q.tryTotals[i]}</span>
                </span>
                <span className="an-actions">
                  <Icon name="share" size={17} color="var(--sc-purple)" />
                  <Icon name="trash" size={17} color="#EF4444" />
                  <Icon name="eye" size={17} color="var(--sc-primary)" />
                  <Icon name="pencil" size={17} color="#10B981" />
                  <Icon name="download" size={17} color="#F59E0B" />
                </span>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (screen === "services") {
      const s = sc.services;
      const sf = sc.forms;
      return (
        <>
          <ScreenHead title={s.title} />
          <p className="an-sub">{s.subtitle}</p>

          <button className="an-head-new" onClick={() => setShowServiceForm(!showServiceForm)}>
            <span className="an-chevbox">
              <Icon name={showServiceForm ? "chevron-up" : "chevron-down"} size={16} />
            </span>
            <strong style={{ color: "var(--sc-text)", fontSize: 15, fontWeight: 600 }}>{sf.sNewRecord}</strong>
          </button>

          {showServiceForm && (
            <div className="an-form-card">
              <div className="an-form-head">
                <strong>{sf.sNewRecord}</strong>
                <button className="an-form-close" onClick={() => setShowServiceForm(false)}>
                  <Icon name="close" size={16} color="var(--sc-muted)" />
                </button>
              </div>

              <div className="an-tpl-row">
                <span className="an-profile-label">{sf.sFormLabel}</span>
                <span className="an-fpill an-fpill active">
                  <Icon name="star" size={13} color="var(--sc-primary-on)" />
                  {sf.sDefaultTemplate}
                </span>
              </div>

              <button className="an-select-row">
                <span>
                  <Icon name="person" size={15} color="var(--sc-muted)" />
                  {sf.sSelectCustomer}
                </span>
                <Icon name="chevron-down" size={15} color="var(--sc-secondary)" />
              </button>
              <span className="an-select-hint">{sf.qSearchCustomer}</span>

              <div className="an-form-grid">
                <label className="an-field">
                  <span>{sf.sCustomerName}</span>
                  <input className="af-input" placeholder="Yılmaz Isı Sistemleri" />
                </label>
                <label className="an-field">
                  <span>{sf.sServiceAddress}</span>
                  <input className="af-input" placeholder={sf.sServiceAddressPlaceholder} />
                </label>
              </div>

              <div className="an-form-grid">
                <label className="an-field">
                  <span>{sf.sStartTime}</span>
                  <input className="af-input" defaultValue="09:00" />
                </label>
                <label className="an-field">
                  <span>{sf.sEndTime}</span>
                  <input className="af-input" defaultValue="10:00" />
                </label>
              </div>

              <label className="an-field">
                <span>{sf.sPhone}</span>
                <input className="af-input" placeholder="0532 000 00 00" />
              </label>

              <div className="an-chipgroup">
                <span className="an-profile-label">{sf.sServiceServices}</span>
                <div className="an-chiprow">
                  <span className="an-fpill an-fpill active">
                    <Icon name="check-circle" size={13} color="var(--sc-primary-on)" />
                    Periyodik Bakım
                  </span>
                  <span className="an-fpill">Arıza Onarım</span>
                  <span className="an-fpill">Montaj</span>
                </div>
              </div>

              <div className="an-chipgroup">
                <span className="an-profile-label">{sf.sTechnicalServices}</span>
                <div className="an-chiprow">
                  <span className="an-fpill an-fpill active">
                    <Icon name="check-circle" size={13} color="var(--sc-primary-on)" />
                    Kombi
                  </span>
                  <span className="an-fpill">Klima</span>
                  <span className="an-fpill an-fpill active">
                    <Icon name="check-circle" size={13} color="var(--sc-primary-on)" />
                    Hidrofor
                  </span>
                </div>
              </div>

              <label className="an-field">
                <span>{sf.sDetails}</span>
                <textarea className="af-input af-ta" rows={3} placeholder={sf.sDetailsPlaceholder} />
              </label>

              <div className="an-form-grid">
                <label className="an-field">
                  <span>{sf.sServiceFee}</span>
                  <input className="af-input" placeholder="0,00" />
                </label>
                <div className="an-field">
                  <span>{sf.sTechnician}</span>
                  <div className="an-tech">
                    <span className="an-tech-ic">
                      <Icon name="person" size={15} />
                    </span>
                    <span>{sf.sTechnicianName}</span>
                  </div>
                </div>
              </div>

              <label className="an-field">
                <span>{sf.sDocumentDate}</span>
                <input className="af-input" placeholder={sf.sDatePlaceholder} />
              </label>

              <div className="an-form-actions">
                <button className="af-btn af-btn-danger" type="button">{sf.sClear}</button>
                <button className="af-btn af-btn-primary" type="button">
                  <Icon name="check-circle" size={15} color="var(--sc-primary-on)" />
                  {sf.sSave}
                </button>
              </div>
            </div>
          )}

          <div className="an-cut-head">
            <span className="an-cut-title">{s.allLabel}</span>
            <div className="an-chips" style={{ gap: 8 }}>
              <span className="an-refresh">
                <Icon name="refresh" size={15} />
              </span>
              <span className="an-cut-count">{s.count}</span>
            </div>
          </div>

          <div className="an-filters">
            {s.filters.map((f, i) => (
              <span key={f} className={`an-fpill${i === 0 ? " active" : ""}`}>
                {f}
              </span>
            ))}
            <span className="an-fpill an-fpill-sel">
              <strong style={{ color: "var(--sc-secondary)", fontSize: 12, fontWeight: 500 }}>{s.allTemplates}</strong>
              <Icon name="chevron-down" size={13} color="var(--sc-muted)" />
            </span>
            <span className="an-inp">{s.filterDate}</span>
            <span className="an-inp">{s.filterDoc}</span>
            <span className="an-inp an-inp-grow">{s.filterCustomer}</span>
            <span className="an-clear">
              <Icon name="close" size={15} />
            </span>
          </div>

          <div className="an-table">
            <div className="an-tr an-th">
              <span className="an-c-date">{s.cols[0]}</span>
              <span className="an-c-main" style={{ flex: 1.6 }}>{s.cols[1]}</span>
              <span className="an-c-main">{s.cols[2]}</span>
              <span className="an-c-main" style={{ flex: 1.1 }}>{s.cols[3]}</span>
              <span className="an-c-tpl">{s.cols[4]}</span>
              <span className="an-actions an-th-empty" />
            </div>
            {s.rows.map((row, i) => (
              <div className="an-tr" key={i}>
                <span className="an-c-date">{row[0]}</span>
                <span className="an-c-main" style={{ flex: 1.6 }}>{row[1]}</span>
                <span className="an-c-main">{row[2]}</span>
                <span className="an-c-main" style={{ flex: 1.1 }}>{row[3]}</span>
                <span className="an-c-tpl">
                  <span className={row[4] === s.rows[2]?.[4] ? "an-tpl none" : "an-tpl"}>{row[4]}</span>
                </span>
                <span className="an-actions">
                  <Icon name="share" size={17} color="var(--sc-purple)" />
                  <Icon name="trash" size={17} color="#EF4444" />
                  <Icon name="eye" size={17} color="var(--sc-primary)" />
                  <Icon name="pencil" size={17} color="#10B981" />
                  <Icon name="download" size={17} color="#F59E0B" />
                </span>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (screen === "payments") {
      const py = sc.payments;
      return (
        <>
          <ScreenHead title={py.title} />
          <p className="an-sub">{py.subtitle}</p>

          <div className="an-card">
            <div className="an-card-head">
              <span className="an-iconbox an-ib-warn">
                <Icon name="card" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{py.status}</strong>
              </div>
            </div>
            <PayBars data={py} />
            {py.totalsLabels.map((label, i) => (
              <div className={`an-total-row${i === py.totalsLabels.length - 1 ? " pb" : ""}`} key={label}>
                <span>{label}</span>
                <strong className={labelColors[py.payColors[i] ?? "primary"]}>{py.totalsAmounts[i]}</strong>
              </div>
            ))}
          </div>

          <div className="an-paylist">
            <p className="an-paylist-title">{py.list}</p>
            <div className="an-filters">
              <span className="an-paysearch">
                <Icon name="search" size={14} color="var(--sc-muted)" />
                <span className="an-paysearch-text">{py.search}</span>
                <Icon name="close" size={14} color="var(--sc-muted)" />
              </span>
              {py.timeFilters.map((f, i) => (
                <span key={f} className={`an-fpill${i === 0 ? " active" : ""}`} style={{ height: 32, padding: "0 12px" }}>
                  {f}
                </span>
              ))}
              <span className="an-fpill an-fpill-sel" style={{ height: 32 }}>
                <strong style={{ color: "var(--sc-text)", fontSize: 12, fontWeight: 500 }}>{py.allStatus}</strong>
                <Icon name="chevron-down" size={13} color="var(--sc-muted)" />
              </span>
              <span className="an-payref">
                <Icon name="refresh" size={16} />
              </span>
            </div>
            <div className="an-payblock">
              {py.rows.map((row, i) => {
                const state = row[3];
                return (
                  <div className="an-payrow" key={i}>
                    <div className="an-payrow-l">
                      <strong>{row[0]}</strong>
                      <span>{row[1]}</span>
                    </div>
                    <span className="an-payamt">{row[2]}</span>
                    <span className={`an-pill ${state}`}>
                      <Icon name={state === "paid" ? "check-circle" : "clock"} size={12} />
                      {state === "paid" ? py.paid : py.pending}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="an-pag an-paypag">
              <span className="an-pag-btn muted">{py.previous}</span>
              <span className="an-pag-txt">{py.page}</span>
              <span className="an-pag-btn">{py.next}</span>
            </div>
          </div>
        </>
      );
    }

    if (screen === "plan") {
      const pl = sc.plan;
      const teamColors = isDark ? ["#6080FF", "#10B981"] : ["#7A6CFD", "#10B981"];
      const d = new Date();
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const firstDow = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
      const startOffset = firstDow === 0 ? 6 : firstDow - 1;
      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
      const cells: (number | null)[] = [];
      for (let i = 0; i < totalCells; i++) {
        const day = i - startOffset + 1;
        cells.push(day >= 1 && day <= daysInMonth ? day : null);
      }
      const eventDays: Record<number, number> = { 1: 1, 3: 1, 5: 2, 9: 4, 15: 1, 22: 2, 27: 1 };
      const monthLabel = `${pl.months[d.getMonth()]} ${d.getFullYear()}`;
      return (
        <>
          <ScreenHead title={pl.title} />
          <p className="an-sub">{pl.subtitle}</p>

          <div className="an-card">
            <div className="an-card-head">
              <span className="an-iconbox an-ib-primary">
                <Icon name="people" size={20} />
              </span>
              <div className="an-card-title">
                <strong>{pl.teamsTitle}</strong>
              </div>
              <span className="an-btn" style={{ background: "var(--sc-primary-rgba)", color: "var(--sc-primary)" }}>
                <Icon name="plus" size={14} color="var(--sc-primary)" />
                {pl.newTeam}
              </span>
            </div>
            <div className="an-team-grid">
              {pl.teams.map((team, i) => (
                <div className="an-team-card" key={team[0]}>
                  <div className="an-team-top">
                    <span className="an-team-ic" style={{ background: `${teamColors[i]}22`, color: teamColors[i] }}>
                      <Icon name="people" size={16} />
                    </span>
                    <div className="an-card-title">
                      <strong className="an-team-name">{team[0]}</strong>
                      <span className="an-team-sub">{pl.leader} {team[1]}</span>
                    </div>
                    <Icon name="trash" size={15} color="#EF4444" />
                  </div>
                  <div className="an-team-meta">
                    <span>{pl.personnelLabel} ({pl.teamMembers[i]})</span>
                  </div>
                  <div className="an-team-foot">
                    <span className="an-team-ass">{pl.teamAssigns[i]}</span>
                    <span className="an-team-tools">
                      <span className="an-ib-warn an-ib-mini">
                        <Icon name="person-remove" size={15} />
                      </span>
                      <span className="an-ib-primary an-ib-mini">
                        <Icon name="person-add" size={15} />
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="an-caltools">
            <div className="an-calfilters">
              {[pl.day, pl.week, pl.month].map((f, i) => (
                <span key={f} className={`an-fpill${i === 0 ? " active" : ""}`}>
                  {f}
                </span>
              ))}
              <span className="an-fpill an-fpill-sel">
                <strong style={{ color: "var(--sc-secondary)", fontSize: 12, fontWeight: 500 }}>{pl.allTeams}</strong>
                <Icon name="chevron-down" size={13} color="var(--sc-muted)" />
              </span>
              <span className="an-cal-close">
                <Icon name="close" size={15} />
              </span>
              <span className="an-btn an-btn-newplan">
                <Icon name="plus" size={14} color="var(--sc-primary-on)" />
                {pl.newPlan}
              </span>
            </div>
            <div className="an-cal-nav">
              <span className="an-cal-prev">
                <Icon name="back" size={15} />
              </span>
              <span className="an-cal-label">{monthLabel}</span>
              <span className="an-cal-next">
                <Icon name="chevron-fwd" size={15} />
              </span>
            </div>
          </div>

          <div className="an-mgrid">
            <div className="an-mhead">
              {pl.dayShorts.map((g) => (
                <span key={g}>{g}</span>
              ))}
            </div>
            {Array.from({ length: Math.ceil(cells.length / 7) }, (_, r) => (
              <div className="an-mrow" key={r}>
                {cells.slice(r * 7, r * 7 + 7).map((day, ci) => {
                  const dayNum = day as number | null;
                  const isToday = dayNum === d.getDate();
                  const count = dayNum ? eventDays[dayNum] ?? 0 : 0;
                  return (
                    <div className={`an-mcell${isToday ? " today" : ""}`} key={ci}>
                      {dayNum !== null && (
                        <>
                          <span className="an-mnum">{dayNum}</span>
                          {count > 0 &&
                            Array.from({ length: Math.min(count, 3) }, (_, ei) => (
                              <span
                                className={`an-m-ev${ei % 2 === 1 ? " teal" : ""}`}
                                key={ei}
                              >
                                {pl.teams[ei % 2][0]}
                              </span>
                            ))}
                          {count > 3 && <span className="an-m-more">+{count - 3} {pl.more}</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="an-plist">
            <div className="an-plist-head">
              <Icon name="card" size={18} color="var(--sc-primary)" />
              <span className="an-plist-title">{pl.planList}</span>
              <span className="an-plist-count">{pl.listCount}</span>
            </div>
            <div className="an-filters">
              {pl.listFilters.map((f, i) => (
                <span key={f} className={`an-fpill${i === 0 ? " active" : ""}`} style={{ height: 28, padding: "0 12px" }}>
                  {f}
                </span>
              ))}
              <span className="an-fpill an-fpill-sel" style={{ height: 28, padding: "0 12px" }}>
                <strong style={{ color: "var(--sc-secondary)", fontSize: 12, fontWeight: 500 }}>{pl.allTeams}</strong>
                <Icon name="chevron-down" size={13} color="var(--sc-muted)" />
              </span>
            </div>
            {pl.appts.map((a, i) => {
              const state = a[5];
              return (
                <div className={`an-appt${i % 2 === 1 ? " teal" : ""}`} key={a[2]}>
                  <div className="an-appt-time">
                    <strong>{a[0]}</strong>
                    <span>{a[1]}</span>
                  </div>
                  <span className="an-appt-div" />
                  <div className="an-appt-main">
                    <strong>{a[2]}</strong>
                    <div className="an-appt-sub">
                      <span className="an-appt-dot" style={{ background: teamColors[i % 2] }} />
                      <span>{a[3]}</span>
                      <span>•</span>
                      <span>{a[4]}</span>
                    </div>
                  </div>
                  {state === "today" && <span className="an-appt-badge today">{pl.today}</span>}
                  {state === "past" && <span className="an-appt-badge past">{pl.past}</span>}
                </div>
              );
            })}
          </div>
        </>
      );
    }

    if (screen === "customer") {
      const cd = sc.customer;
      const cust = MOCK_CUSTOMERS[custIdx % MOCK_CUSTOMERS.length];
      return (
        <>
          <ScreenHead title={cust.companyName} subtitle={cd.detail} backTo="customers" />

          <div className="an-ccard">
            <div className="an-ccard-top">
              <span className="an-ph-avatar">{cust.companyName.charAt(0)}</span>
              <div className="an-ccard-id">
                <strong>{cust.companyName}</strong>
                <span>{cust.contactPerson}</span>
              </div>
            </div>
            <div className="an-cust-rows">
              <span className="an-cust-row">
                <span className="an-cust-ic"><Icon name="phone" size={14} color="var(--sc-muted)" /></span>
                <span className="an-cust-lbl">{cd.phone}</span>
                <span className="an-cust-val">{cust.phone}</span>
              </span>
              <span className="an-cust-row">
                <span className="an-cust-ic"><Icon name="card" size={14} color="var(--sc-muted)" /></span>
                <span className="an-cust-lbl">{cd.subscriberNo}</span>
                <span className="an-cust-val">{cust.subscriberNo}</span>
              </span>
              <span className="an-cust-row">
                <span className="an-cust-ic"><Icon name="mail" size={14} color="var(--sc-muted)" /></span>
                <span className="an-cust-lbl">{cd.email}</span>
                <span className="an-cust-val">{cust.email}</span>
              </span>
              <span className="an-cust-row">
                <span className="an-cust-ic"><Icon name="globe" size={14} color="var(--sc-muted)" /></span>
                <span className="an-cust-lbl">{cd.website}</span>
                <span className="an-cust-val">{cust.website}</span>
              </span>
              <span className="an-cust-row">
                <span className="an-cust-ic"><Icon name="location" size={14} color="var(--sc-muted)" /></span>
                <span className="an-cust-lbl">{cd.address}</span>
                <span className="an-cust-val">{cust.address}</span>
              </span>
            </div>
            <div className="an-ccard-foot">
              <Icon name="check-circle" size={15} color="var(--sc-primary)" />
              <span>{cd.customerInfo} · {lang === "tr" ? "veriler güvenle saklanır" : "data stored securely"}</span>
            </div>
          </div>

          <div className="an-cloud-note">
            <span className="an-cloud-ic"><Icon name="cloud" size={20} /></span>
            <div>
              <strong>{cd.cloudTitle}</strong>
              <span>{cd.cloudBody}</span>
            </div>
          </div>

          <div className="an-hist-bar">
            <span className="an-sec-ic"><Icon name="clock" size={16} /></span>
            <strong>{cd.historyTitle}</strong>
            <button className="an-hist-btn soft"><Icon name="share" size={14} />{cd.share}</button>
            <button className="an-hist-btn solid"><Icon name="download" size={14} />{cd.download}</button>
          </div>

          <div className="an-sec-head">
            <span className="an-sec-ic"><Icon name="construct" size={16} /></span>
            <strong>{cd.serviceReports}</strong>
            <span className="an-sec-count">{cust.services.length}</span>
          </div>
          <div className="an-rec-list">
            {cust.services.map((s, i) => (
              <button className="an-rec" key={i} onClick={() => setDoc({ kind: "service", title: s.label, date: s.date })}>
                <div className="an-rec-main">
                  <strong>{s.label}</strong>
                  <span>{s.date} · {s.tech}</span>
                </div>
                <span className="an-rec-fee">{s.fee}</span>
                <span className="an-ib-purple an-ib-btn"><Icon name="share" size={16} /></span>
                <span className="an-ib-primary an-ib-btn"><Icon name="eye" size={16} /></span>
                <span className="an-ib-warn an-ib-btn"><Icon name="download" size={16} /></span>
              </button>
            ))}
          </div>

          <div className="an-sec-head">
            <span className="an-sec-ic"><Icon name="doc" size={16} /></span>
            <strong>{cd.quotes}</strong>
            <span className="an-sec-count">{cust.quotes.length}</span>
          </div>
          <div className="an-rec-list">
            {cust.quotes.map((q, i) => (
              <button className="an-rec" key={i} onClick={() => setDoc({ kind: "quote", title: q.label, date: q.date })}>
                <div className="an-rec-main">
                  <strong>{q.label}</strong>
                  <span>{q.date}</span>
                </div>
                <div className="an-rec-money">
                  <strong>{q.totals}</strong>
                  <span>{q.tryTotal}</span>
                </div>
                <span className="an-ib-purple an-ib-btn"><Icon name="share" size={16} /></span>
                <span className="an-ib-primary an-ib-btn"><Icon name="eye" size={16} /></span>
                <span className="an-ib-warn an-ib-btn"><Icon name="download" size={16} /></span>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (screen === "document") {
      const df = sc.doc;
      const isQ = doc?.kind !== "service";
      const cust = MOCK_CUSTOMERS[custIdx % MOCK_CUSTOMERS.length];
      const dtitle = doc?.title ?? (isQ ? sc.quotes.title : sc.services.title);
      const ddate = doc?.date ?? "05.09.2026";
      return (
        <>
          <ScreenHead title={isQ ? sc.quotes.label : sc.services.label} subtitle={dtitle} backTo="customer" />

          <div className="an-doc-actions">
            <button className="an-doc-share">
              <Icon name="share" size={15} />
              {df.shareOnline}
            </button>
            <button className="an-doc-dl">
              <Icon name="download" size={15} />
              {df.downloadPdf}
            </button>
          </div>

          <div className="an-doc-sheet">
            <div className="an-doc-head">
              <span className="an-doc-logo">
                <Icon name="shield" size={22} />
              </span>
              <div className="an-doc-title">
                <strong>{df.companyNameLabel}</strong>
                <span className="an-doc-doctitle">{isQ ? df.quoteLabel : df.serviceTitle}</span>
              </div>
              <div className="an-doc-meta">
                <span><b>{df.date}</b> {ddate}</span>
                {isQ && <span><b>{df.validUntil}</b> 12.09.2026</span>}
              </div>
            </div>

            {isQ ? (
              <>
                <div className="an-doc-cols">
                  <div className="an-doc-col">
                    <div className="an-doc-coltitle">{df.companyInfo}</div>
                    <DocRow l={df.address} v={df.companyAddressLabel} />
                    <DocRow l={df.phone} v={df.companyPhone} />
                    <DocRow l={df.gsm} v={df.companyGsm} />
                    <DocRow l={df.email} v={df.companyEmail} />
                    <DocRow l={df.website} v={df.companyWeb} />
                    <DocRow l={df.taxNo} v={df.companyTax} />
                  </div>
                  <div className="an-doc-col">
                    <div className="an-doc-coltitle">{df.customerInfo}</div>
                    <DocRow l={df.customerName} v={cust.companyName} />
                    <DocRow l={df.contactPerson} v={cust.contactPerson} />
                    <DocRow l={df.phone} v={cust.phone} />
                    <DocRow l={df.email} v={cust.email} />
                    <DocRow l={df.address} v={cust.address} />
                    <DocRow l={df.subscriberNo} v={cust.subscriberNo} />
                  </div>
                </div>

                <div className="an-doc-coltitle an-doc-u">{df.notes}</div>
                <p className="an-doc-par">
                  {lang === "tr"
                    ? "Tüm ürünler 2 yıl garanti kapsamındadır; kurulum, devreye alma ve kullanıcı eğitimi ücrete dahildir."
                    : "All products are covered by a 2-year warranty; installation, commissioning and user training are included."}
                </p>

                <div className="an-doc-coltitle an-doc-u">{df.items}</div>
                <table className="an-doc-table">
                  <thead>
                    <tr>
                      <th className="an-doc-wt">#</th>
                      <th>{df.product}</th>
                      <th className="an-doc-wn">{df.quantity}</th>
                      <th className="an-doc-wn">{df.unitPrice}</th>
                      <th className="an-doc-wn">{df.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUOTE_ITEMS.map((it, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <b>{it[0]}</b>
                          <span className="an-doc-sub">{it[1]}</span>
                        </td>
                        <td>{it[2]}</td>
                        <td>{it[3]}</td>
                        <td><b>{it[4]}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="an-doc-totals">
                  <div className="an-doc-trow"><span>{df.subtotal} (₺)</span><b>136.500,00 ₺</b></div>
                  <div className="an-doc-trow"><span>{df.kdv}</span><b>27.300,00 ₺</b></div>
                  <div className="an-doc-trow g-total"><span>{df.grandTotal} (₺)</span><b>163.800,00 ₺</b></div>
                  <div className="an-doc-split" />
                  <div className="an-doc-trow"><span>{df.subtotal} (US$)</span><b>1.500,00 $</b></div>
                  <div className="an-doc-trow"><span>{df.kdv}</span><b>300,00 $</b></div>
                  <div className="an-doc-trow g-total"><span>{df.grandTotal} (US$)</span><b>1.800,00 $</b></div>
                </div>

                <div className="an-doc-fx">
                  <div className="an-fx-head">
                    <span className="an-fx-live"><i />{df.fxLive}</span>
                    <strong>{df.effectiveSellingRate}</strong>
                    <span className="an-fx-src">({df.fxSource} · {df.fxDate})</span>
                    <button className="an-fx-refresh"><Icon name="refresh" size={12} />{df.fxRefresh}</button>
                  </div>
                  {FX_ROWS.map((r) => (
                    <div className="an-doc-trow" key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>
                  ))}
                  <div className="an-doc-split" />
                  <div className="an-doc-trow g-total"><span>{df.grandTotalTry}</span><b>≈ 223.424,10 ₺</b></div>
                </div>
              </>
            ) : (
              <>
                <div className="an-doc-cols">
                  <div className="an-doc-col">
                    <div className="an-doc-coltitle">{df.customerInfo}</div>
                    <DocRow l={df.customerName} v={cust.companyName} />
                    <DocRow l={df.address} v={cust.address} />
                    <DocRow l={df.phone} v={cust.phone} />
                    <DocRow l={df.email} v={cust.email} />
                    <DocRow l={df.subscriberNo} v={cust.subscriberNo} />
                  </div>
                  <div className="an-doc-col">
                    <div className="an-doc-coltitle">{df.serviceDetails}</div>
                    <DocRow l={df.responsiblePersonnel} v="Ahmet Yıldız" />
                    <DocRow l={df.startTime} v="09:00" />
                    <DocRow l={df.endTime} v="12:30" />
                    <DocRow l={df.technicianPhone} v={df.companyGsm} />
                  </div>
                </div>

                {SVC_GROUPS.map((g, gi) => (
                  <div key={gi}>
                    <div className="an-doc-coltitle an-doc-u">{gi === 0 ? df.serviceServices : df.technicalServices}</div>
                    <div className="an-doc-checks">
                      {g.items.map((it) => <CheckItem key={it[0]} label={it[0]} on={it[1]} />)}
                    </div>
                  </div>
                ))}

                <div className="an-doc-coltitle an-doc-u">{df.detailsNotes}</div>
                <p className="an-doc-par">
                  {lang === "tr"
                    ? "Kamera ve kayıt sisteminin periyodik bakımı yapılmış, tüm cihazlar test edilmiştir. Kayıt ve yedekleme eğitimi tamamlanmıştır."
                    : "Periodic maintenance of the camera and recording system completed, all devices tested. Recording and backup training finished."}
                </p>

                <div className="an-doc-fee">
                  <div className="an-doc-coltitle">{df.serviceFee}</div>
                  <b>{lang === "tr" ? "Servis Bedeli: ₺6.000 + KDV" : "Service Fee: ₺6.000 + VAT"}</b>
                </div>
              </>
            )}

            <div className="an-doc-sign">
              <div className="an-doc-sign-title">{df.signatureArea}</div>
              <p className="an-doc-sign-note">{df.signatureNote}</p>
              <div className="an-doc-sign-boxes">
                <div className="an-doc-sbox">
                  <span className="an-sig-label">{df.companyStamp}</span>
                  <Stamp />
                </div>
                <div className="an-doc-sbox strong">
                  <span className="an-sig-label">{df.approvedBy}</span>
                  <span className="an-sig-badge"><Icon name="check-circle" size={13} />{df.digitalSignature} · {df.verified}</span>
                  <Sig t="a" />
                  <b className="an-sig-name">Ahmet Yıldız</b>
                </div>
                <div className="an-doc-sbox">
                  <span className="an-sig-label">{df.technicianSignature}</span>
                  <Sig t="b" />
                  <b className="an-sig-name">Ahmet Yıldız</b>
                </div>
                {!isQ && (
                  <div className="an-doc-sbox">
                    <span className="an-sig-label">{df.customerSignature}</span>
                    <Sig t="b" />
                    <b className="an-sig-name">{cust.contactPerson}</b>
                  </div>
                )}
              </div>
            </div>

            <div className="an-doc-foot">
              <b>{df.companyNameLabel}</b>
              <span>{df.companyAddressLabel}</span>
              <span>Tel: {df.companyPhone}&nbsp;&nbsp;Gsm: {df.companyGsm}</span>
              <span>Email: {df.companyEmail}&nbsp;&nbsp;Web: {df.companyWeb}</span>
              <span>{lang === "tr" ? "Vergi No:" : "Tax No:"} {df.companyTax}</span>
            </div>

            <div className="an-doc-privacy">
              <b>{df.privacyTitle}</b>
              <span>{df.privacyBody}</span>
            </div>
          </div>
        </>
      );
    }

    const c = sc.customers;
    return (
      <>
        <ScreenHead title={c.title} />
        <p className="an-sub">{c.subtitle}</p>

        <div className="an-cut-head">
          <span className="an-cut-title">{c.allLabel}</span>
          <span className="an-cut-count">{c.count}</span>
        </div>

        <div className="an-search">{c.search}</div>

        <div className="an-stack" style={{ gap: 12 }}>
          {c.rows.map((row, i) => (
            <div className="an-card an-row an-row-btn" key={i} onClick={() => { setCustIdx(i); setScreen("customer"); }}>
              <span className="an-avatar an-avatar-lg">{row[0].charAt(0)}</span>
              <div className="an-rowmain no-sub an-cust-main">
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
              </div>
              <span className="an-ib-primary an-ib-btn">
                <Icon name="pencil" size={18} />
              </span>
              <span className="an-ib-danger an-ib-btn">
                <Icon name="trash" size={18} />
              </span>
              <Icon name="chevron-fwd" size={20} color="var(--sc-secondary)" />
            </div>
          ))}
        </div>

        <div className="an-pag">
          <span className="an-pag-btn muted">{c.previous}</span>
          <span className="an-pag-txt">{c.page}</span>
          <span className="an-pag-btn">{c.next}</span>
        </div>
      </>
    );
  };

  return (
    <section className="section" id="screens">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{sc.badge}</span>
          <h2 className="section-title">{sc.title}</h2>
          <p className="section-subtitle">{sc.description}</p>
        </div>

        <div className="showcase">
          <div className="browser" data-theme={isDark ? "dark" : "light"}>
            <div className="browser-top">
              <span className="browser-dots">
                <i className="r" />
                <i className="y" />
                <i className="g" />
              </span>
              <span className="browser-url">
                <Icon name="card" size={14} color="var(--sc-muted)" />
                loomy-omega.vercel.app
              </span>
            </div>
            <div className="browser-body">{renderBody()}</div>
            <div className="an-tabbar">
              {sc.tabs.map((label, i) => (
                <button className={`an-tab ${i === activeTab ? "active" : ""}`} key={label} onClick={() => setScreen(screenKeys[i])}>
                  <span className="an-tab-ic">
                    <Icon name={tabBarIcons[i]} size={i === activeTab ? 22 : 20} color={i === activeTab ? "var(--sc-primary)" : "var(--sc-muted)"} />
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}