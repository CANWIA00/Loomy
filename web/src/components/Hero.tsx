import { useLanguage } from "../i18n";
import { APP_URL } from "../App";
import InstallApp from "./InstallApp";

function HeroIcon({ name, size = 16, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const p = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s = { width: size, height: size, flexShrink: 0 as const, color };
  switch (name) {
    case "doc":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M7 3.5h6.5L18.5 8.5V20H7V3.5z" /><path d="M13.5 3.5v5h5" /></svg>;
    case "construct":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M14.5 6.5a4 4 0 0 1 5.5-3.7L17 5.8l1.2 1.2 3-3A4 4 0 1 1 14.5 12l-8 8a2.2 2.2 0 0 1-3.1-3.1l8-8" /></svg>;
    case "people":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-2.8 2.4-4.5 5.5-4.5s5.5 1.7 5.5 4.5" /><path d="M15.5 5.8a3 3 0 0 1 0 5.4" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>;
    case "card":
      return <svg viewBox="0 0 24 24" {...p} style={s}><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="M3 9.5h18" /></svg>;
    case "chat":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M8 10.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3.5L9.5 17v-1.5H8a2 2 0 0 1-2-2v-3z" /></svg>;
    case "plus":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M12 5v14M5 12h14" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
    case "bolt":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M13 2.5 4.5 13.5H11L10 21.5l8.5-11H13l0-8Z" /></svg>;
    case "arrow":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" /></svg>;
    default:
      return null;
  }
}

const linesCol = ["primary", "warning", "success"];

export default function Hero() {
  const { t } = useLanguage();
  const p = t.showcase.panel;

  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-split">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              {t.hero.badge}
            </div>

            <h1>
              {t.hero.title1} <span className="gradient-text">{t.hero.title2}</span>
            </h1>
            <p>{t.hero.description}</p>

            <div className="hero-actions">
              <a className="btn btn-primary" href={APP_URL}>
                {t.hero.ctaPrimary}
              </a>
              <a className="btn btn-secondary" href="#how-it-works">
                {t.hero.ctaSecondary}
              </a>
              <InstallApp className="btn-secondary" />
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{t.hero.stat1Value}</strong>
                <span>{t.hero.stat1Label}</span>
              </div>
              <div className="hero-stat">
                <strong>{t.hero.stat2Value}</strong>
                <span>{t.hero.stat2Label}</span>
              </div>
              <div className="hero-stat">
                <strong>{t.hero.stat3Value}</strong>
                <span>{t.hero.stat3Label}</span>
              </div>
            </div>
          </div>

          <div className="hero-showcase" aria-hidden="true">
            <div className="hero-float hero-float-a">
              <span className="hf-ic"><HeroIcon name="check" size={13} color="var(--sc-primary-on)" /></span>
              <div>
                <strong>{t.hero.visual.floatATitle}</strong>
                <small>{t.hero.visual.floatASub}</small>
              </div>
            </div>
            <div className="hero-float hero-float-b">
              <span className="hf-ic"><HeroIcon name="bolt" size={13} color="#fff" /></span>
              <div>
                <strong>{t.hero.visual.floatBTitle}</strong>
                <small>{t.hero.visual.floatBSub}</small>
              </div>
            </div>

            <div className="hero-phone">
              <div className="mock-frame">
                <div className="mock-frame-bar">
                  <span className="mock-f-btn r" />
                  <span className="mock-f-btn y" />
                  <span className="mock-f-btn g" />
                  <span className="mock-f-url">loomy-app · {p.greeting}</span>
                </div>
                <div className="mock-frame-body">
                  <div className="an-top">
                    <h3 className="an-title">{p.greeting}</h3>
                    <div className="an-chips">
                      <span className="an-chip"><HeroIcon name="chat" size={15} color="var(--sc-primary)" /></span>
                      <span className="an-avatar hero-av">LM</span>
                    </div>
                  </div>
                  <p className="an-sub">{p.subtitle}</p>

                  <div className="an-stack">
                    <div className="an-card an-row">
                      <span className="an-iconbox an-ib-primary"><HeroIcon name="construct" size={18} color="var(--sc-primary)" /></span>
                      <div className="an-card-title">
                        <strong>{p.servicesTitle}</strong>
                        <span>{p.servicesDesc}</span>
                      </div>
                      <div className="an-btn-row">
                        <span className="an-btn"><HeroIcon name="plus" size={13} color="var(--sc-primary-on)" /> {p.newService}</span>
                      </div>
                    </div>

                    <div className="an-card an-row">
                      <span className="an-iconbox an-ib-primary"><HeroIcon name="doc" size={18} color="var(--sc-primary)" /></span>
                      <div className="an-card-title">
                        <strong>{p.quotesTitle}</strong>
                        <span>{p.quotesDesc}</span>
                      </div>
                      <div className="an-btn-row">
                        <span className="an-btn"><HeroIcon name="plus" size={13} color="var(--sc-primary-on)" /> {p.newQuote}</span>
                      </div>
                    </div>

                    <div className="an-col2">
                      <div className="an-card">
                        <div className="an-card-head">
                          <span className="an-iconbox an-ib-teal"><HeroIcon name="people" size={18} color="#2dd4bf" /></span>
                          <div className="an-card-title">
                            <strong>{p.customersTitle}</strong>
                            <span>{p.customersDesc}</span>
                          </div>
                        </div>
                        {p.customers.slice(0, 2).map((name, i) => (
                          <div className="an-listrow" key={name}>
                            <span className="an-avatar">{name.charAt(0)}</span>
                            <div className="an-rowmain">
                              <strong>{name}</strong>
                              <span>{p.customersInfo[i]}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="an-card">
                        <div className="an-card-head">
                          <span className="an-iconbox an-ib-purple"><HeroIcon name="calendar" size={18} color="var(--sc-purple)" /></span>
                          <div className="an-card-title"><strong>{p.planTitle}</strong></div>
                        </div>
                        <p className="an-plan-date">{p.planDate}</p>
                        {p.planTimes.slice(0, 2).map((time, i) => (
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
                        <span className="an-iconbox an-ib-warn"><HeroIcon name="card" size={18} color="#f59e0b" /></span>
                        <div className="an-card-title"><strong>{p.paymentsTitle}</strong></div>
                      </div>
                      <div className="an-pay">
                        <div>
                          {p.payLabels.slice(0, 3).map((label, i) => (
                            <div className="an-bar-wrap" key={label}>
                              <div className="an-bar-top">
                                <span>{label}</span>
                                <strong className={linesCol[p.payColors[i] === "warning" ? 1 : p.payColors[i] === "success" ? 2 : 0]}>{p.payAmounts[i]}</strong>
                              </div>
                              <div className="an-bar">
                                <i className={p.payColors[i]} style={{ width: `${p.payPcts[i]}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="an-recent-title">{p.recentTitle}</p>
                          <div className="an-recent">
                            {p.recentCustomers.slice(0, 2).map((name, i) => (
                              <div className="an-recent-row" key={name}>
                                <div className="an-rowmain" style={{ marginLeft: 0 }}>
                                  <strong>{name}</strong>
                                  <span>{p.recentInfo[i]}</span>
                                </div>
                                <span className={`an-pill ${p.recentStates[i]}`}>
                                  <HeroIcon name={p.recentStates[i] === "paid" ? "check" : "calendar"} size={11} />
                                  {p.recentStates[i] === "paid" ? "Ödendi" : "Bekliyor"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-reflection" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
