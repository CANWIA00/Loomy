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

export default function Features() {
  const { t } = useLanguage();

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
            return (
              <div className="feature-card" key={feature.title}>
                <FeatureIcon>
                  <Icon />
                </FeatureIcon>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
