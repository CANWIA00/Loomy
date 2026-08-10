import { useLanguage } from "../i18n";
import { APP_URL, CONTACT_EMAIL } from "../App";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="/logo.png" alt="Loomy" />
              Loomy
            </div>
            <p className="footer-tagline">{t.footer.tagline}</p>
          </div>

          <div>
            <h4>{t.footer.product}</h4>
            <ul>
              <li>
                <a href="#features">{t.nav.features}</a>
              </li>
              <li>
                <a href="#how-it-works">{t.nav.howItWorks}</a>
              </li>
              <li>
                <a href="#pricing">{t.nav.pricing}</a>
              </li>
              <li>
                <a href="#faq">{t.nav.faq}</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>{t.footer.contactTitle}</h4>
            <p>{CONTACT_EMAIL}</p>
            <p style={{ marginTop: 8 }}>
              <a href={APP_URL}>{t.nav.openApp}</a>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} Loomy. {t.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
