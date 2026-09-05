import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";
import { FeatureIcon } from "../icons";

const iconProps = { size: 24, stroke: "#8b5cf6" };

function UsersIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke={iconProps.stroke} strokeWidth="1.8" />
      <path d="M3.5 19c0-3 2.5-4.8 5.5-4.8S14.5 16 14.5 19" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 5.2a3.2 3.2 0 010 5.6M17 14.5c1.9.7 3.5 2.2 3.5 4.5" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 6.5a4 4 0 015.5-3.7L17 5.8l1.2 1.2 3-3A4 4 0 1114.5 12l-8 8a2.2 2.2 0 01-3.1-3.1l8-8"
        stroke={iconProps.stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="15" rx="3" stroke={iconProps.stroke} strokeWidth="1.8" />
      <path d="M3 9h18" stroke={iconProps.stroke} strokeWidth="1.8" />
      <circle cx="16" cy="14.5" r="1.4" fill={iconProps.stroke} />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="3" stroke={iconProps.stroke} strokeWidth="1.8" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke={iconProps.stroke} strokeWidth="1.8" />
      <path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 3.6a3.5 3.5 0 010 5.8" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.5" stroke={iconProps.stroke} strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" stroke={iconProps.stroke} strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" stroke={iconProps.stroke} strokeWidth="1.8" />
      <path d="M17 14v6M14 17h6" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3.5h9l4 4V20a1 1 0 01-1 1H6a1 1 0 01-1-1V4.5a1 1 0 011-1z"
        stroke={iconProps.stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5M9 13h6M9 16.5h6" stroke={iconProps.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const icons = [UsersIcon, DocumentIcon, WrenchIcon, WalletIcon, CalendarIcon, TeamIcon, DashboardIcon];

function Mini({ name, size = 15, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const p = {
    fill: "none" as const,
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const s = { width: size, height: size, flexShrink: 0 as const };
  switch (name) {
    case "back":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M15 5l-7 7 7 7" /></svg>;
    case "clock":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
    case "doc":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M7 3.5h6.5L18.5 8.5V20H7V3.5z" /><path d="M13.5 3.5v5h5" /></svg>;
    case "share":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 3v11" /><circle cx="12" cy="3" r="1.8" /><circle cx="6" cy="15.5" r="1.8" /><circle cx="18" cy="15.5" r="1.8" /><path d="m6.8 14.5 4.4-7M17.2 14.5l-4.4-7" /></svg>;
    case "eye":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case "download":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" /></svg>;
    case "cloud":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M7 18.5h10.5a3.5 3.5 0 0 0 .7-6.9A5.5 5.5 0 0 0 7 9.6a4 4 0 0 0 0 8.9Z" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
    case "shield":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 3l7 2.5v6c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5v-6L12 3z" /></svg>;
    default:
      return null;
  }
}

export default function Features() {
  const { t } = useLanguage();
  const [detail, setDetail] = useState<"customer" | "quote" | null>(null);
  const open = detail !== null;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const fd = t.features.featureDetail;
  const cd = fd.customer;
  const qd = fd.quote;
  const hi = cd.history;

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.features.badge}</span>
          <h2 className="section-title">{t.features.title}</h2>
          <p className="section-subtitle">{t.features.description}</p>
        </div>

        <div className="features-grid">
          {t.features.items.map((feature, index) => {
            const Icon = icons[index % icons.length];
            const isCustomer = index === 0;
            const isQuote = index === 1;
            return (
              <button
                className={`feature-card feature-card-btn${isCustomer ? " customer" : ""}`}
                key={feature.title}
                onClick={
                  isCustomer
                    ? () => setDetail("customer")
                    : isQuote
                      ? () => setDetail("quote")
                      : undefined
                }
                type="button"
              >
                <FeatureIcon>
                  <Icon />
                </FeatureIcon>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                {(isCustomer || isQuote) && (
                  <span className="feature-card-link">
                    {fd.link}
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14m0 0-5.5-5.5M19 12l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fmodal" onClick={() => setDetail(null)} role="dialog" aria-modal="true">
          <div className="fmodal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="fmodal-head">
              <span className="section-badge">{fd.badge}</span>
              <button className="fmodal-close" onClick={() => setDetail(null)} aria-label="close" type="button">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {detail === "customer" ? (
              <>
            <h2 className="fmodal-title">{cd.title}</h2>
            <p className="fmodal-intro">{cd.intro}</p>

            <div className="fmodal-grid">
              <div className="fmodal-mock">
                <span className="fmodal-mock-label">{cd.visualTitle}</span>
                  <div className="mock-frame">
                    <div className="mock-frame-bar">
                      <span className="mock-f-btn r" />
                      <span className="mock-f-btn y" />
                      <span className="mock-f-btn g" />
                      <span className="mock-f-url">loomy-app · Müşteri Detayı</span>
                    </div>
                    <div className="mock-frame-body">
                    <div className="an-head">
                      <span className="an-chip" style={{ padding: 0 }}>
                        <Mini name="back" size={18} color="var(--sc-primary)" />
                      </span>
                      <div style={{ minWidth: 0, flexGrow: 1, textAlign: "left" }}>
                        <h3 className="an-title" style={{ fontSize: 15 }}>Yılmaz Isı Sistemleri</h3>
                        <span className="an-top-sub">İşlem Geçmişi</span>
                      </div>
                      <span className="an-chip">TR</span>
                    </div>

                    <div className="an-ccard">
                      <div className="an-ccard-top">
                        <span className="an-ph-avatar">Y</span>
                        <div className="an-ccard-id">
                          <strong>Yılmaz Isı Sistemleri</strong>
                          <span>Ayşe Yılmaz</span>
                        </div>
                      </div>
                      <div className="an-cust-rows">
                        <span className="an-cust-row">
                          <span className="an-cust-ic"><Mini name="clock" size={13} color="var(--sc-muted)" /></span>
                          <span className="an-cust-lbl">Telefon</span>
                          <span className="an-cust-val">0532 000 00 00</span>
                        </span>
                        <span className="an-cust-row">
                          <span className="an-cust-ic"><Mini name="doc" size={13} color="var(--sc-muted)" /></span>
                          <span className="an-cust-lbl">Abone No</span>
                          <span className="an-cust-val">AK-101204</span>
                        </span>
                      </div>
                    </div>

                    <div className="an-cloud-note">
                      <span className="an-cloud-ic"><Mini name="cloud" size={18} /></span>
                      <div>
                        <strong>Tüm belgeler bulutta saklanır</strong>
                        <span>Dijital imza, kaşe ve canlı kurla; tek tıkla online paylaşım.</span>
                      </div>
                    </div>

                    <div className="an-sec-head">
                      <span className="an-sec-ic"><Mini name="doc" size={14} /></span>
                      <strong>Servis Raporları</strong>
                      <span className="an-sec-count">3</span>
                    </div>
                    <div className="an-rec-list">
                      <span className="an-rec">
                        <span className="an-rec-main">
                          <strong>Klima Bakım</strong>
                          <span>12.09.2026 · Ahmet Yıldız</span>
                        </span>
                        <span className="an-rec-fee">₺6.000</span>
                        <span className="an-ib-primary an-ib-btn"><Mini name="eye" size={14} /></span>
                        <span className="an-ib-warn an-ib-btn"><Mini name="download" size={14} /></span>
                      </span>
                      <span className="an-rec">
                        <span className="an-rec-main">
                          <strong>Kış Hazırlık Kontrolü</strong>
                          <span>05.09.2026 · Ahmet Yıldız</span>
                        </span>
                        <span className="an-rec-fee">Ücretsiz</span>
                        <span className="an-ib-primary an-ib-btn"><Mini name="eye" size={14} /></span>
                        <span className="an-ib-warn an-ib-btn"><Mini name="download" size={14} /></span>
                      </span>
                    </div>

                    <div className="an-sec-head">
                      <span className="an-sec-ic"><Mini name="doc" size={14} /></span>
                      <strong>Teklifler</strong>
                      <span className="an-sec-count">2</span>
                    </div>
                    <div className="an-rec-list">
                      <span className="an-rec">
                        <span className="an-rec-main">
                          <strong>Kamera Sistemleri Teklifi</strong>
                          <span>05.09.2026</span>
                        </span>
                        <span className="an-rec-money">
                          <strong>136.500,00 ₺</strong>
                          <span>≈ ₺163.800</span>
                        </span>
                        <span className="an-ib-purple an-ib-btn"><Mini name="share" size={14} /></span>
                        <span className="an-ib-primary an-ib-btn"><Mini name="eye" size={14} /></span>
                      </span>
                    </div>
                  </div>
                </div>
                <p className="fmodal-mock-desc">{cd.visualDesc}</p>
              </div>

              <div className="fmodal-points">
                <h3>{cd.pointsTitle}</h3>
                <ul>
                  {cd.points.map((point, i) => (
                    <li key={i}>
                      <span className="fmodal-check"><Mini name="check" size={13} color="var(--sc-bg)" /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="fmodal-doc">
              <div className="fmodal-doc-list">
                <h3>{cd.docTitle}</h3>
                <p>{cd.docIntro}</p>
                <ul>
                  {cd.docPoints.map((point, i) => (
                    <li key={i}>
                      <span className="fmodal-check"><Mini name="check" size={13} color="var(--sc-bg)" /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="fmod-history-photo">
                <div className="fph-photo">
                  <div className="fph-paper">
                    <div className="fph-brand">
                      <span className="fph-logo">L</span>
                      <div className="fph-brand-tx">
                        <strong>LOOMY</strong>
                        <span>Müşteri Geçmişi</span>
                      </div>
                      <span className="fph-date">05.09.2026</span>
                    </div>
                    <div className="fph-cust">
                      <b>Yılmaz Isı Sistemleri</b>
                      <span>0532 000 00 00 · Osmangazi/Bursa · AK-101204</span>
                    </div>
                    <div className="fph-sec">Servis Raporları (3)</div>
                    <div className="fph-row"><span><b>Klima Bakım</b> · 12.09.2026 · A. Yıldız</span><b>₺6.000</b></div>
                    <div className="fph-row"><span><b>Kış Hazırlık Kontrolü</b> · 05.09.2026</span><b>Ücretsiz</b></div>
                    <div className="fph-row fph-tot"><span>Toplam</span><b>₺7.250</b></div>
                    <div className="fph-sec">Teklifler (2)</div>
                    <div className="fph-row"><span><b>Kamera Sistemleri Teklifi</b> · 05.09.2026</span><b>₺136.500</b></div>
                    <div className="fph-row fph-tot"><span>Toplam</span><b>₺225.750</b></div>
                    <div className="fph-sec">Ödemeler (3)</div>
                    <div className="fph-row"><span><b>Klima Bakım</b> · 12.09.2026</span><span className="fph-pill on">Ödendi</span></div>
                    <div className="fph-row"><span><b>Kombi Montaj</b> · 11.09.2026</span><span className="fph-pill">Bekliyor</span></div>
                    <div className="fph-foot">Loomy ile oluşturuldu · Dijital imza, kaşe ve canlı kurla güvenle paylaşılır</div>
                  </div>
                </div>
                <p className="fph-caption">{hi.docTitle}</p>
              </div>
            </div>
              </>
            ) : (
              <>
                <h2 className="fmodal-title">{qd.title}</h2>
                <p className="fmodal-intro">{qd.intro}</p>

                <div className="fmodal-grid">
                  <div className="fmodal-mock">
                    <span className="fmodal-mock-label">{qd.visualTitle}</span>
                    <div className="mock-frame">
                      <div className="mock-frame-bar">
                        <span className="mock-f-btn r" />
                        <span className="mock-f-btn y" />
                        <span className="mock-f-btn g" />
                        <span className="mock-f-url">loomy-app · Yeni Teklif</span>
                      </div>
                      <div className="mock-frame-body">
                        <div className="an-head">
                          <span className="an-chip" style={{ padding: 0 }}>
                            <Mini name="back" size={18} color="var(--sc-primary)" />
                          </span>
                          <div style={{ minWidth: 0, flexGrow: 1, textAlign: "left" }}>
                            <h3 className="an-title" style={{ fontSize: 15 }}>Yeni Teklif</h3>
                            <span className="an-top-sub">Teklif Oluştur</span>
                          </div>
                          <span className="an-chip">TR</span>
                        </div>

                        <div className="an-form-card">
                          <div className="an-form-head">
                            <strong>Müşteri Bilgileri</strong>
                            <span className="fqm-new"><Mini name="check" size={12} color="var(--sc-primary)" /> Kayıtlı</span>
                          </div>
                          <div className="an-form-grid">
                            <div className="an-field">
                              <span>Müşteri</span>
                              <div className="af-input af-chip">Yılmaz Isı Sistemleri</div>
                            </div>
                            <div className="an-field">
                              <span>Para Birimi</span>
                              <div className="af-input af-chip">₺ TRY</div>
                            </div>
                          </div>

                          <div className="an-form-head an-form-head-sub">
                            <strong>Ürünler</strong>
                          </div>

                          <div className="an-item-card">
                            <div className="an-item-top">
                              <input className="af-input" defaultValue="4CH IP Kamera + 4TB Kayıt Cihazı" />
                              <span className="an-ib-danger an-ib-btn"><Mini name="trash" size={14} /></span>
                            </div>
                            <div className="an-form-grid af-line">
                              <div className="an-field">
                                <span>Adet</span>
                                <input className="af-input" defaultValue="1" />
                              </div>
                              <div className="an-field">
                                <span>Birim Fiyat</span>
                                <input className="af-input" defaultValue="82.000,00" />
                              </div>
                              <div className="an-field">
                                <span>KDV</span>
                                <div className="af-input af-chip">%20</div>
                              </div>
                            </div>
                          </div>

                          <div className="an-item-card">
                            <div className="an-item-top">
                              <input className="af-input" defaultValue="Kurulum ve Montaj" />
                              <span className="an-ib-danger an-ib-btn"><Mini name="trash" size={14} /></span>
                            </div>
                            <div className="an-form-grid af-line">
                              <div className="an-field">
                                <span>Adet</span>
                                <input className="af-input" defaultValue="1" />
                              </div>
                              <div className="an-field">
                                <span>Birim Fiyat</span>
                                <input className="af-input" defaultValue="16.000,00" />
                              </div>
                              <div className="an-field">
                                <span>KDV</span>
                                <div className="af-input af-chip">%20</div>
                              </div>
                            </div>
                          </div>

                          <button className="an-add-item" type="button">
                            <Mini name="check" size={14} color="var(--sc-primary)" /> Ürün Ekle
                          </button>

                          <div className="an-sum">
                            <div className="an-sum-row">
                              <span>Ara Toplam</span>
                              <strong>₺98.000,00</strong>
                            </div>
                            <div className="an-sum-row">
                              <span>KDV %20</span>
                              <strong>₺19.600,00</strong>
                            </div>
                            <div className="an-sum-row total">
                              <span>Genel Toplam</span>
                              <strong>₺117.600,00</strong>
                            </div>
                          </div>

                          <div className="an-rate-card">
                            <div className="an-rate-head">
                              <span className="an-rate-live"><i />Canlı Kur · TCMB</span>
                              <span className="an-rate-src">Efektif Satış · 05.09.2026</span>
                            </div>
                            <div className="an-rate-row"><span>USD / TRY</span><b>36,50</b></div>
                            <div className="an-rate-row"><span>EUR / TRY</span><b>39,90</b></div>
                            <div className="an-rate-row"><span>GBP / TRY</span><b>45,10</b></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="fmodal-mock-desc">{qd.visualDesc}</p>
                  </div>

                  <div className="fmodal-points">
                    <h3>{qd.pointsTitle}</h3>
                    <ul>
                      {qd.points.map((point, i) => (
                        <li key={i}>
                          <span className="fmodal-check"><Mini name="check" size={13} color="var(--sc-bg)" /></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="fmodal-doc">
                  <div className="fmodal-doc-list">
                    <h3>{qd.docTitle}</h3>
                    <p>{qd.docIntro}</p>
                    <ul>
                      {qd.docPoints.map((point, i) => (
                        <li key={i}>
                          <span className="fmodal-check"><Mini name="check" size={13} color="var(--sc-bg)" /></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="fmod-history-photo">
                    <div className="fph-photo">
                      <div className="fph-paper">
                        <div className="fph-brand">
                          <span className="fph-logo">L</span>
                          <div className="fph-brand-tx">
                            <strong>LOOMY</strong>
                            <span>Teklif</span>
                          </div>
                          <span className="fph-date">05.09.2026</span>
                        </div>
                        <div className="fph-cust">
                          <b>Yılmaz Isı Sistemleri</b>
                          <span>Karşıyaka Mah. Ata Cad. No: 42 · İzmir</span>
                        </div>
                        <div className="fph-sec">Teklif Özeti (3)</div>
                        <div className="fph-row"><span><b>4CH IP Kamera + 4TB Kayıt</b> · 1 adet</span><b>₺82.000,00</b></div>
                        <div className="fph-row"><span><b>Kurulum ve Montaj</b> · 1 adet</span><b>₺16.000,00</b></div>
                        <div className="fph-row"><span><b>12 Ay Uzaktan İzleme</b> · 12 adet</span><b>₺30.000,00</b></div>
                        <div className="fph-sec">Özet</div>
                        <div className="fph-row"><span>Ara Toplam</span><b>₺128.000,00</b></div>
                        <div className="fph-row"><span>KDV %20</span><b>₺25.600,00</b></div>
                        <div className="fph-row fph-tot"><span>Genel Toplam</span><b>₺153.600,00</b></div>
                        <div className="fph-fx">
                          <span className="fph-fx-title"><i /> TCMB Canlı Kur · 05.09.2026</span>
                          <div className="fph-fx-cols">
                            <span>USD <b>36,50</b></span>
                            <span>EUR <b>39,90</b></span>
                            <span>GBP <b>45,10</b></span>
                          </div>
                        </div>
                        <div className="fph-sig">
                          <span className="fph-stamp">ÜNSAL<i>TEKNİK SERVİS</i><b>KAŞE 2026</b></span>
                          <div className="fph-sig-tx">
                            <span className="fph-ok"><Mini name="check" size={10} color="#15803d" /> Doğrulandı</span>
                            <span>Firma kaşesi · Dijital imza</span>
                          </div>
                        </div>
                        <div className="fph-foot">Loomy ile oluşturuldu · KDV, para birimi ve canlı kur bilgisiyle</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="fmodal-cta">
              <button className="btn btn-primary" type="button">{fd.cta}</button>
              <button className="btn btn-secondary" onClick={() => setDetail(null)} type="button">{fd.back}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}