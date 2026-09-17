import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useLanguage } from "./i18n";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Showcase from "./components/Showcase";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import Cta from "./components/Cta";
import Apply from "./components/Apply";
import Footer from "./components/Footer";
import PrivacyPage from "./components/PrivacyPage";

export const APP_URL = "https://app.loomy-app.com";
export const CONTACT_EMAIL = "lommy.app.info@gmail.com";

function ScrollRestore() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Showcase />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
        <Cta />
        <Apply />
      </main>
      <Footer />
    </>
  );
}

function Privacy() {
  return (
    <>
      <Navbar />
      <PrivacyPage />
      <Footer />
    </>
  );
}

export default function App() {
  const { lang } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      <ScrollRestore />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gizlilik-politikasi" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}