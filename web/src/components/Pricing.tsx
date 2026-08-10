import { useLanguage } from "../i18n";
import { CheckIcon } from "../icons";

export default function Pricing() {
  const { t } = useLanguage();
  const featuredLabel = t.pricing.comingSoon;

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.pricing.badge}</span>
          <h2 className="section-title">{t.pricing.title}</h2>
          <p className="section-subtitle">{t.pricing.description}</p>
        </div>

        <div className="pricing-grid">
          {t.pricing.plans.map((plan) => (
            <div className={`plan-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.featured ? <span className="plan-badge">{featuredLabel}</span> : null}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.description}</div>
              <div className="plan-price">{plan.price}</div>
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="plan-note">{t.pricing.note}</p>
      </div>
    </section>
  );
}
