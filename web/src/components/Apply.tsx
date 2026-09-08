import { useState, type FormEvent } from "react";
import { useLanguage } from "../i18n";
import { CONTACT_EMAIL } from "../App";
import { CheckIcon } from "../icons";

const API_URL = import.meta.env.VITE_API_URL ?? "https://loomy-backend-production.up.railway.app/api";

type Status = "idle" | "sending" | "sent" | "error";

export default function Apply() {
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const f = t.apply.fields;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!businessName.trim() || !name.trim() || !email.trim() || !message.trim()) {
      setError(t.apply.errors.required);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.apply.errors.email);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(`${API_URL}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, name, email, phone, message }),
      });
      if (!res.ok) throw new Error("apply request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="section" id="apply">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.apply.badge}</span>
          <h2 className="section-title">{t.apply.title}</h2>
          <p className="section-subtitle">{t.apply.description}</p>
        </div>

        <div className="apply-grid">
          <div className="apply-steps">
            <h3>{t.apply.howTitle}</h3>
            <ol>
              {t.apply.steps.map((step) => (
                <li key={step}>
                  <span className="apply-step-check">
                    <CheckIcon />
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="apply-email-note">
              {t.apply.emailNote}
              <br />
              <a className="apply-email" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div className="apply-card">
            {status === "sent" ? (
              <div className="apply-success">
                <div className="apply-success-icon">
                  <CheckIcon size={28} />
                </div>
                <h3>{t.apply.successTitle}</h3>
                <p>{t.apply.successBody}</p>
                <a className="btn btn-secondary" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <label>
                  <span>{f.business} *</span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Örnek Isı Sistemleri"
                  />
                </label>
                <label>
                  <span>{f.name} *</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                  />
                </label>
                <div className="apply-row">
                  <label>
                    <span>{f.email} *</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                    />
                  </label>
                  <label>
                    <span>{f.phone}</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xx xxx xx xx"
                    />
                  </label>
                </div>
                <label>
                  <span>{f.message} *</span>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={f.messageHint}
                  />
                </label>

                {error ? <p className="apply-error">{error}</p> : null}
                {status === "error" ? <p className="apply-error">{t.apply.errorBody}</p> : null}

                <button className="btn btn-primary apply-submit" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? t.apply.sending : t.apply.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}