import { useState } from "react";
import { useLanguage, type Lang } from "../i18n";
import { APP_URL } from "../App";
import { BurgerIcon, CloseIcon } from "../icons";
import InstallApp from "./InstallApp";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#how-it-works", label: t.nav.howItWorks },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
    { href: "#contact", label: t.nav.contact },
  ];

  const handleLang = (next: Lang) => {
    setLang(next);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a className="brand" href="#top">
          <img src="/logo.png" alt="Loomy" />
          Loomy
        </a>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <div className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === "tr" ? "active" : ""}
              onClick={() => handleLang("tr")}
            >
              TR
            </button>
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              onClick={() => handleLang("en")}
            >
              EN
            </button>
          </div>

          <a className="btn btn-primary nav-cta" href={APP_URL}>
            {t.nav.openApp}
          </a>

          <InstallApp className="btn-secondary nav-cta" />

          <button
            type="button"
            className="burger"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <CloseIcon /> : <BurgerIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
