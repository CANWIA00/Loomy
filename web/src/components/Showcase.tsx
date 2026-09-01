import { useState } from "react";
import { useLanguage } from "../i18n";

type ScreenKey = "panel" | "quotes" | "services" | "customers";

const labelColors: Record<string, string> = {
  primary: "amt-primary",
  warning: "amt-warn",
  success: "amt-success",
};

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
    case "sunny":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></svg>;
    case "moon":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M20 13.5A8.5 8.5 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z" /></svg>;
    case "person-circle":
      return <svg viewBox="0 0 24 24" {...p} style={s}><circle cx="12" cy="12" r="9" /><path d="M12 11a2.7 2.7 0 1 0 0-5.4A2.7 2.7 0 0 0 12 11ZM6 19.5c1-2.8 4.5-4 6-4s5 1.2 6 4" /></svg>;
    case "back":
      return <svg viewBox="0 0 24 24" {...p} style={s}><path d="M15 5l-7 7 7 7" /></svg>;
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
  const { t } = useLanguage();
  const [screen, setScreen] = useState<ScreenKey>("panel");
  const sc = t.showcase;
  const statusLabels = sc.statuses as Record<string, string>;
  const statusLabel = (state: string) => statusLabels[state] ?? state;

  const activeTab = screen === "panel" ? 0 : screen === "quotes" ? 2 : screen === "services" ? 1 : 3;

  const PayBars = () => {
    const p = sc.panel;
    return (
      <>
        {p.payLabels.map((label, i) => (
          <div className="an-bar-wrap" key={label}>
            <div className="an-bar-top">
              <span>{label}</span>
              <strong className={labelColors[p.payColors[i] ?? "primary"]}>{p.payAmounts[i]}</strong>
            </div>
            <div className="an-bar">
              <i className={p.payColors[i] ?? "primary"} style={{ width: `${p.payPcts[i]}%` }} />
            </div>
          </div>
        ))}
      </>
    );
  };

  const ScreenHead = ({ title }: { title: string }) => (
    <div className="an-top">
      <div className="an-head">
        <span style={{ display: "flex" }}>
          <Icon name="back" size={22} color="#6080FF" />
        </span>
        <h3 className="an-title">{title}</h3>
      </div>
      <div className="an-chips">
        <span className="an-chip">{sc.langBtn}</span>
        <span className="an-chip" style={{ padding: 0 }}>
          <Icon name="sunny" size={20} color="#6080FF" />
        </span>
        <span style={{ display: "flex" }}>
          <Icon name="home" size={22} color="#6080FF" />
        </span>
      </div>
    </div>
  );

  const renderBody = () => {
    if (screen === "panel") {
      const p = sc.panel;
      return (
        <>
          <div className="an-top">
            <h3 className="an-title">{p.greeting}</h3>
            <div className="an-chips">
              <span className="an-chip">{sc.langBtn}</span>
              <span className="an-chip" style={{ padding: 0 }}>
                <Icon name="sunny" size={20} color="#6080FF" />
              </span>
              <span style={{ display: "flex" }}>
                <Icon name="person-circle" size={26} color="#6080FF" />
              </span>
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
                  <Icon name="person-add" size={14} color="#fff" />
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
                  <Icon name="plus" size={14} color="#fff" />
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
                    <Icon name="person-add" size={18} color="#fff" />
                  </span>
                </div>
                {p.customers.map((name, i) => (
                  <div className="an-listrow" key={name}>
                    <span className="an-avatar">{name.charAt(0)}</span>
                    <div className="an-rowmain">
                      <strong>{name}</strong>
                      <span>{p.customersInfo[i]}</span>
                    </div>
                    <Icon name="chevron-fwd" size={16} color="#303048" />
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
                  <Icon name="arrow-fwd" size={20} color="#8060FF" />
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
                  <PayBars />
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
      return (
        <>
          <ScreenHead title={q.title} />
          <p className="an-sub">{q.subtitle}</p>

          <div className="an-head an-head-new">
            <span className="an-chevbox">
              <Icon name="chevron-down" size={16} />
            </span>
            <strong style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{q.newQuote}</strong>
          </div>

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
                  <Icon name="share" size={17} color="#8060FF" />
                  <Icon name="trash" size={17} color="#EF4444" />
                  <Icon name="eye" size={17} color="#6080FF" />
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
      return (
        <>
          <ScreenHead title={s.title} />
          <p className="an-sub">{s.subtitle}</p>

          <div className="an-head an-head-new">
            <span className="an-chevbox">
              <Icon name="chevron-down" size={16} />
            </span>
            <strong style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{s.newRecord}</strong>
          </div>

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
              <strong style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 500 }}>{s.allTemplates}</strong>
              <Icon name="chevron-down" size={13} color="#6B7280" />
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
                  <Icon name="share" size={17} color="#8060FF" />
                  <Icon name="trash" size={17} color="#EF4444" />
                  <Icon name="eye" size={17} color="#6080FF" />
                  <Icon name="pencil" size={17} color="#10B981" />
                  <Icon name="download" size={17} color="#F59E0B" />
                </span>
              </div>
            ))}
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

        <div className="an-search">
          <Icon name="search" size={16} color="#6B7280" />
          {c.search}
        </div>

        {c.rows.map((row, i) => (
          <div className="an-card an-row" key={i}>
            <span className="an-avatar an-avatar-lg">{row[0].charAt(0)}</span>
            <div className="an-rowmain no-sub">
              <strong>{row[0]}</strong>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
            </div>
            <div className="an-cust-actions">
              <span className="an-ib-primary" style={{ width: 36, height: 36, borderRadius: 12 }}>
                <Icon name="pencil" size={18} />
              </span>
              <span className="an-ib-danger" style={{ width: 36, height: 36, borderRadius: 12 }}>
                <Icon name="trash" size={18} />
              </span>
              <Icon name="chevron-fwd" size={20} color="#9CA3AF" />
            </div>
          </div>
        ))}

        <div className="an-pag">
          <span className="an-pag-btn muted">{c.previous}</span>
          <span className="an-pag-txt">{c.page}</span>
          <span className="an-pag-btn">{c.next}</span>
        </div>
      </>
    );
  };

  const selectors: { key: ScreenKey; label: string }[] = [
    { key: "panel", label: sc.panel.label },
    { key: "quotes", label: sc.quotes.label },
    { key: "services", label: sc.services.label },
    { key: "customers", label: sc.customers.label },
  ];

  return (
    <section className="section" id="screens">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{sc.badge}</span>
          <h2 className="section-title">{sc.title}</h2>
          <p className="section-subtitle">{sc.description}</p>
        </div>

        <div className="showcase">
          <div className="browser">
            <div className="browser-top">
              <span className="browser-dots">
                <i className="r" />
                <i className="y" />
                <i className="g" />
              </span>
              <span className="browser-url">
                <Icon name="card" size={14} color="#6B7280" />
                loomy-omega.vercel.app
              </span>
            </div>
            <div className="browser-body">{renderBody()}</div>
            <div className="an-tabbar">
              {sc.tabs.map((label, i) => (
                <div className={`an-tab ${i === activeTab ? "active" : ""}`} key={label}>
                  <Icon name={tabBarIcons[i]} size={i === activeTab ? 22 : 20} color={i === activeTab ? "#6080FF" : "#6B7280"} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-selector">
            {selectors.map((s) => (
              <button
                key={s.key}
                className={screen === s.key ? "active" : ""}
                onClick={() => setScreen(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}