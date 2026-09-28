import { useLanguage } from "../../../contexts/LanguageContext";
import OptionDropdownModal from "./OptionDropdownModal";
import { usePayments } from "../PaymentsContext";
import type { StatusFilter } from "../types";

export default function StatusDropdownModal() {
  const { t } = useLanguage();
  const {
    statusDropdownOpen,
    setStatusDropdownOpen,
    statusFilter,
    setStatusFilter,
    statusOptions,
  } = usePayments();

  return (
    <OptionDropdownModal
      visible={statusDropdownOpen}
      title={t("pay.selectStatus")}
      options={statusOptions}
      value={statusFilter}
      onSelect={(v) => setStatusFilter(v as StatusFilter)}
      onClose={() => setStatusDropdownOpen(false)}
    />
  );
}
