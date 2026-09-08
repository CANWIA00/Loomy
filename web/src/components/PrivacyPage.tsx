import { useLanguage } from "../i18n";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="privacy-page">
      <div className="container">
        <a href="#home" className="privacy-back">{t.privacyPage.back}</a>
        <h1>{t.privacyPage.title}</h1>
        <p className="privacy-updated">{t.privacyPage.updated}</p>
        {t.privacyPage.sections.map((s) => (
          <section key={s.title} className="privacy-section">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}