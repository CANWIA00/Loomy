import { useLanguage } from "../i18n";

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.howItWorks.badge}</span>
          <h2 className="section-title">{t.howItWorks.title}</h2>
          <p className="section-subtitle">{t.howItWorks.description}</p>
        </div>

        <div className="how-grid">
          {t.howItWorks.steps.map((step) => (
            <div className="how-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
