import { useState } from "react";
import { useLanguage } from "../i18n";

type ScreenKey = "panel" | "quotes" | "services" | "customers";

function TabIcon({ name, size = 15 }: { name: string; size?: number }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <path d="M3.5 10.5 12 3.5l8.5 7" />
          <path d="M6 9.5V20h12V9.5" />
        </svg>
      );
    case "wrench":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <path d="M14.5 6.5a4 4 0 0 1 5.5-3.7L17 5.8l1.2 1.2 3-3A4 4 0 1 1 14.5 12l-8 8a2.2 2.2 0 0 1-3.1-3.1l8-8" />
        </svg>
      );
    case "doc":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <path d="M6 3.5h8.5L18.5 7V20H6z" />
          <path d="M14.5 3.5V7h4" />
        </svg>
      );
    case "people":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19c0-2.8 2.4-4.5 5.5-4.5s5.5 1.7 5.5 4.5" />
          <path d="M15.5 5.8a3 3 0 0 1 0 5.4" />
        </svg>
      );
    case "cog":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
      );
    case "search":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.8-4.8" />
        </svg>
      );
    case "clock":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      );
    case "calendar":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
          <rect x="3.5" y="5" width="17" height="16" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      );
    default:
      return null;
  }
}

const tabBarIcons = ["home", "wrench", "doc", "people", "cog"];

export default function Showcase() {
  const { t } = useLanguage();
  const [screen, setScreen] = useState<ScreenKey>("panel");
  const sc = t.showcase;
  const statusLabels = sc.statuses as Record<string, string>;

  const statusLabel = (state: string) => statusLabels[state] ?? state;
  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const activeTab = screen === "panel" ? 0 : screen === "quotes" ? 2 : screen === "services" ? 1 : 3;

  const renderBody = () => {
    if (screen === "panel") {
      const p = sc.panel;
      return (
        <>
          <div className="sc-head">
            <div>
              <h3 className="sc-greet">{p.greeting}</h3>
              <p className="sc-sub">{p.subtitle}</p>
            </div>
            <div className="sc-avatar">OY</div>
          </div>
          <div className="sc-cards">
            {p.cards.map((card, i) => (
              <div className="sc-card" key={card}>
                <strong>{p.values[i]}</strong>
                <span>{card}</span>
              </div>
            ))}
          </div>
          <p className="sc-label">{p.payment}</p>
          <div className="sc-panel">
            <div className="sc-pay-row">
              <span className="sc-dot ok" />
              {p.received}
            </div>
            <div className="sc-pay-row">
              <span className="sc-dot warn" />
              {p.pendingAmount}
            </div>
            <div className="sc-bar">
              <i style={{ width: "70%" }} />
            </div>
          </div>
          <div className="sc-today">
            <TabIcon name="calendar" />
            {p.today}
          </div>
          <p className="sc-label">{p.recent}</p>
          <div className="sc-list">
            {p.rows.map((name, i) => {
              const state = p.states[i];
              return (
                <div className="sc-row" key={name}>
                  <div className={`sc-row-ic ${state === "paid" ? "ic-ok" : "ic-warn"}`}>
                    <TabIcon name={state === "paid" ? "check" : "clock"} size={14} />
                  </div>
                  <div className="sc-row-main">
                    <strong>{name}</strong>
                    <span>{p.info[i]}</span>
                  </div>
                  <span className={`sc-pill ${state}`}>{statusLabel(state)}</span>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    if (screen === "quotes") {
      const q = sc.quotes;
      return (
        <>
          <div className="sc-head">
            <h3 className="sc-title">{q.label}</h3>
            <div className="sc-add">+</div>
          </div>
          <div className="sc-search">
            <TabIcon name="search" size={13} />
            <span>{q.search}</span>
          </div>
          <span className="sc-chip">
            <TabIcon name="clock" size={12} />
            {q.currency}
          </span>
          <div className="sc-list">
            {q.rows.map((name, i) => {
              const state = q.states[i];
              return (
                <div className="sc-row" key={name}>
                  <div className={`sc-row-ic ${state === "approved" ? "ic-ok" : "ic-warn"}`}>
                    <TabIcon name={state === "approved" ? "check" : "clock"} size={14} />
                  </div>
                  <div className="sc-row-main">
                    <strong>{name}</strong>
                    <span>{q.info[i]}</span>
                  </div>
                  <div className="sc-row-right">
                    <strong>{q.amounts[i]}</strong>
                    <span className={`sc-pill ${state}`}>{statusLabel(state)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    if (screen === "services") {
      const s = sc.services;
      return (
        <>
          <div className="sc-head">
            <h3 className="sc-title">{s.label}</h3>
            <div className="sc-add">+</div>
          </div>
          <div className="sc-search">
            <TabIcon name="search" size={13} />
            <span>{s.search}</span>
          </div>
          <div className="sc-list">
            {s.rows.map((name, i) => {
              const state = s.states[i];
              return (
                <div className="sc-row" key={name}>
                  <div className={`sc-row-ic ${state === "paid" ? "ic-ok" : "ic-warn"}`}>
                    <TabIcon name={state === "paid" ? "check" : "clock"} size={14} />
                  </div>
                  <div className="sc-row-main">
                    <strong>{name}</strong>
                    <span>{s.info[i]}</span>
                  </div>
                  <span className={`sc-pill ${state}`}>{statusLabel(state)}</span>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    const c = sc.customers;
    return (
      <>
        <div className="sc-head">
          <h3 className="sc-title">{c.label}</h3>
          <div className="sc-add">+</div>
        </div>
        <div className="sc-search">
          <TabIcon name="search" size={13} />
          <span>{c.search}</span>
        </div>
        <div className="sc-list">
          {c.rows.map((name, i) => (
            <div className="sc-row" key={name}>
              <div className="sc-avatar-sm">{initials(name)}</div>
              <div className="sc-row-main">
                <strong>{name}</strong>
                <span>{c.info[i]}</span>
              </div>
              <span className="sc-tag">{c.tags[i]}</span>
            </div>
          ))}
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
          <div className="phone">
            <div className="phone-screen">
              <div className="phone-status">
                <span>9:41</span>
                <div className="phone-status-right">
                  <span className="phone-bars" />
                  <span className="phone-battery" />
                </div>
              </div>
              <div className="phone-body">{renderBody()}</div>
              <div className="phone-tabs">
                {sc.tabs.map((label, i) => (
                  <div className={`phone-tab ${i === activeTab ? "active" : ""}`} key={label}>
                    <TabIcon name={tabBarIcons[i]} size={15} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
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