import { useLanguage } from "../i18n";
import { APP_URL } from "../App";
import { DownloadIcon } from "../icons";

export default function InstallApp({ className = "btn-secondary" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <a className={`btn ${className}`} href={APP_URL}>
      <DownloadIcon />
      {t.install.button}
    </a>
  );
}
