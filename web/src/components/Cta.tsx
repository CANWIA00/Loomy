import { useLanguage } from "../i18n";
import { APP_URL, CONTACT_EMAIL } from "../App";
import InstallApp from "./InstallApp";

export default function Cta() {
  const { t } = useLanguage();

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="cta">
          <h2>{t.cta.title}</h2>
          <p>{t.cta.description}</p>
          <div className="cta-actions">
            <a className="btn btn-white" href={APP_URL}>
              {t.cta.primary}
            </a>
            <a className="btn btn-ghost" href={`mailto:${CONTACT_EMAIL}`}>
              {t.cta.secondary}
            </a>
            <InstallApp className="btn-ghost" />
          </div>
        </div>
      </div>
    </section>
  );
}
