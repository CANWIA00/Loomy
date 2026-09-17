import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, type Lang } from "../i18n";
import { APP_URL } from "../App";
import { BurgerIcon, CloseIcon } from "../icons";
import InstallApp from "./InstallApp";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/is-takip-programi", label: t.nav.techService },
    { to: "/#features", label: t.nav.features },
    { to: "/#how-it-works", label: t.nav.howItWorks },
    { to: "/#pricing", label: t.nav.pricing },
    { to: "/#faq", label: t.nav.faq },
    { to: "/#contact", label: t.nav.contact },
  ];

  const handleLang = (next: Lang) => {
    setLang(next);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="brand" to="/">
          <img src="/logo.png" alt="Loomy" />
          Loomy
        </Link>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
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
