import { useState } from "react";
import { useLanguage } from "../i18n";
import { PlusIcon } from "../icons";

export default function Faq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.faq.badge}</span>
          <h2 className="section-title">{t.faq.title}</h2>
          <p className="section-subtitle">{t.faq.description}</p>
        </div>

        <div className="faq-list">
          {t.faq.items.map((item, index) => {
            const open = openIndex === index;
            return (
              <div className={`faq-item ${open ? "open" : ""}`} key={item.q}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                >
                  {item.q}
                  <PlusIcon />
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
