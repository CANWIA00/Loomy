import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { customerApi, type Customer } from "../../api/customers";
import { useLanguage } from "../../contexts/LanguageContext";
import { PAGE_SIZE, type TogglePaymentState } from "./types";

interface CustomersContextValue {
  loading: boolean;
  customers: Customer[];
  search: string;
  setSearch: (v: string) => void;
  page: number;
  totalElements: number;
  totalPages: number;
  fetchCustomers: (pageNum?: number, searchQuery?: string) => Promise<void>;

  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  editingCustomer: Customer | null;
  newCompany: string;
  setNewCompany: (v: string) => void;
  newAddress: string;
  setNewAddress: (v: string) => void;
  newEmail: string;
  setNewEmail: (v: string) => void;
  newPhone: string;
  setNewPhone: (v: string) => void;
  newContact: string;
  setNewContact: (v: string) => void;
  newContactPhone: string;
  setNewContactPhone: (v: string) => void;
  newMonthlyFee: string;
  setNewMonthlyFee: (v: string) => void;
  newHasPaidMonthly: boolean;
  setNewHasPaidMonthly: (v: boolean) => void;
  resetForm: () => void;
  handleSave: () => Promise<void>;
  handleEdit: (id: string) => Promise<void>;
  handleDelete: (id: string) => void;

  mapSelectorVisible: boolean;
  setMapSelectorVisible: (v: boolean) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (v: Customer | null) => void;

  alertVisible: boolean;
  setAlertVisible: (v: boolean) => void;
  alertType: "success" | "error" | "confirm";
  alertTitle: string;
  alertMessage: string;
  alertOnConfirm: (() => void) | undefined;
  setAlertOnConfirm: (v: (() => void) | undefined) => void;

  togglePayment: TogglePaymentState;
  setTogglePayment: (v: TogglePaymentState) => void;
  handleTogglePayment: (customer: Customer, paid: boolean) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextValue | undefined>(undefined);

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomersProvider");
  return ctx;
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newMonthlyFee, setNewMonthlyFee] = useState("");
  const [newHasPaidMonthly, setNewHasPaidMonthly] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const size = PAGE_SIZE;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [mapSelectorVisible, setMapSelectorVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm">("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [togglePayment, setTogglePayment] = useState<TogglePaymentState>({ visible: false, customer: null });

  function showAlert(type: "success" | "error" | "confirm", title: string, message: string, onConfirm?: () => void) {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertVisible(true);
  }

  async function handleTogglePayment(customer: Customer, paid: boolean) {
    setLoading(true);
    try {
      await customerApi.update(customer.id, {
        hasPaidMonthly: paid,
        lastPaidAt: paid ? new Date().toISOString() : null,
      });
      showAlert("success", t("common.success"), paid ? t("cst.successMarkPaid") : t("cst.successMarkPending"));
      setTogglePayment({ visible: false, customer: null });
      fetchCustomers(page, search.trim() || undefined);
    } catch (error: any) {
      showAlert("error", t("common.error"), t("cst.errorPayment"));
    } finally {
      setLoading(false);
    }
  }

  const fetchCustomers = useCallback(async (pageNum: number = 0, searchQuery?: string) => {
    setLoading(true);
    try {
      const response = searchQuery
        ? await customerApi.search(searchQuery, pageNum, size)
        : await customerApi.getAll(pageNum, size);
      setCustomers(response.data.content.sort((a: any, b: any) => a.companyName.localeCompare(b.companyName, "tr")));
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
      setPage(response.data.number);
    } catch (error: any) {
      showAlert("error", t("common.error"), t("cst.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [size, t]);

  useEffect(() => {
    fetchCustomers(0);
  }, [fetchCustomers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search.trim()) {
        fetchCustomers(0, search.trim());
      } else {
        fetchCustomers(0);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, fetchCustomers]);

  function resetForm() {
    setNewCompany("");
    setNewAddress("");
    setNewEmail("");
    setNewPhone("");
    setNewContact("");
    setNewContactPhone("");
    setNewMonthlyFee("");
    setNewHasPaidMonthly(false);
    setEditingCustomer(null);
  }

  async function handleSave() {
    if (!newCompany.trim()) {
      showAlert("error", t("common.error"), t("cst.errorRequired"));
      return;
    }

    const data = {
      companyName: newCompany.trim(),
      address: newAddress.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      contactPerson: newContact.trim(),
      contactPhone: newContactPhone.trim(),
      monthlyFee: newMonthlyFee.trim() ? newMonthlyFee.trim().replace(",", ".") : "0.00",
      hasPaidMonthly: newHasPaidMonthly,
      lastPaidAt: newHasPaidMonthly ? new Date().toISOString() : null,
    };

    setLoading(true);
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, data);
        showAlert("success", t("common.success"), t("cst.successUpdate"));
      } else {
        await customerApi.create(data);
        showAlert("success", t("common.success"), t("cst.successAdd"));
      }
      resetForm();
      setFormOpen(false);
      fetchCustomers(page, search.trim() || undefined);
    } catch (error: any) {
      showAlert("error", t("common.error"), t("cst.errorSave"));
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    showAlert("confirm", t("cst.delete"), t("cst.confirmDelete"), async () => {
      setLoading(true);
      try {
        await customerApi.delete(id);
        showAlert("success", t("common.success"), t("cst.successDelete"));
        fetchCustomers(page, search.trim() || undefined);
      } catch (error: any) {
        showAlert("error", t("common.error"), t("cst.errorDelete"));
      } finally {
        setLoading(false);
      }
    });
  }

  async function handleEdit(id: string) {
    setLoading(true);
    try {
      const response = await customerApi.getById(id);
      const c = response.data;
      setEditingCustomer(c);
      setNewCompany(c.companyName);
      setNewAddress(c.address);
      setNewEmail(c.email);
      setNewPhone(c.phone);
      setNewContact(c.contactPerson);
      setNewContactPhone(c.contactPhone);
      setNewMonthlyFee(c.monthlyFee || "0.00");
      setNewHasPaidMonthly(c.hasPaidMonthly);
      setFormOpen(true);
    } catch (error: any) {
      showAlert("error", t("common.error"), t("cst.errorEdit"));
    } finally {
      setLoading(false);
    }
  }

  const value: CustomersContextValue = {
    loading,
    customers,
    search,
    setSearch,
    page,
    totalElements,
    totalPages,
    fetchCustomers,
    formOpen,
    setFormOpen,
    editingCustomer,
    newCompany,
    setNewCompany,
    newAddress,
    setNewAddress,
    newEmail,
    setNewEmail,
    newPhone,
    setNewPhone,
    newContact,
    setNewContact,
    newContactPhone,
    setNewContactPhone,
    newMonthlyFee,
    setNewMonthlyFee,
    newHasPaidMonthly,
    setNewHasPaidMonthly,
    resetForm,
    handleSave,
    handleEdit,
    handleDelete,
    mapSelectorVisible,
    setMapSelectorVisible,
    selectedCustomer,
    setSelectedCustomer,
    alertVisible,
    setAlertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    setAlertOnConfirm,
    togglePayment,
    setTogglePayment,
    handleTogglePayment,
  };

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}
