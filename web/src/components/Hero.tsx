import { useLanguage } from "../i18n";
import { APP_URL } from "../App";
import InstallApp from "./InstallApp";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="hero" id="top">
      <div className="container hero-inner">
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
    </section>
  );
}
