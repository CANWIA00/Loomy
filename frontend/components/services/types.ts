export interface ServiceFormData {
  customerName: string;
  serviceAddress: string;
  startTime: string;
  endTime: string;
  phone: string;
  internalIp: string;
  externalIp: string;
  details: string;
  fee: string;
  technician: string;
  technicianPhone: string;
  documentDate: string;
  services: string[];
  technical: string[];
  customChips: Record<string, string[]>;
  customValues: Record<string, string>;
}

export const initialForm: ServiceFormData = {
  customerName: "",
  serviceAddress: "",
  startTime: "",
  endTime: "",
  phone: "",
  internalIp: "",
  externalIp: "",
  details: "",
  fee: "",
  technician: "",
  technicianPhone: "",
  documentDate: "",
  services: [],
  technical: [],
  customChips: {},
  customValues: {},
};

export interface NewCustomerFormData {
  companyName: string;
  subscriberNo: string;
  address: string;
  email: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
}

export const initialNewCustomerForm: NewCustomerFormData = {
  companyName: "",
  subscriberNo: "",
  address: "",
  email: "",
  phone: "",
  contactPerson: "",
  contactPhone: "",
};

export interface PdfData {
  customerName: string;
  documentDate: string;
  serviceAddress: string;
  phone: string;
  services: string[];
  technical: string[];
  fee: string;
  technician: string;
  technicianPhone?: string;
  startTime: string;
  endTime: string;
  details: string;
  internalIp?: string;
  externalIp?: string;
  customChips?: Record<string, string[]>;
  customValues?: Record<string, string>;
  signature: any;
  technicianSignature: any;
  companyLogo: string | null;
  companyStamp: string | null;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyGsm?: string;
  companyEmail?: string;
  companyFax?: string;
  companyWebsite?: string;
  companyTaxNumber?: string;
  templateName?: string | null;
  templateConfig?: any;
}

export type RecordFilter = "all" | "gun" | "ay" | "yil";

export type TemplateFieldInputType = "text" | "number" | "textarea" | "select" | "radio" | "multi";

export interface TemplateField {
  key: string;
  labelTr: string;
  labelEn: string;
  enabled: boolean;
  order: number;
  inputType?: TemplateFieldInputType;
  options?: TemplateChipOption[];
}

export interface TemplateChipOption {
  key: string;
  labelTr: string;
  labelEn: string;
}

export interface TemplateChipGroup {
  key: string;
  labelTr: string;
  labelEn: string;
  enabled: boolean;
  order: number;
  inputType?: "radio" | "select" | "multi";
  options: TemplateChipOption[];
}

export interface ServiceTemplateConfig {
  fields: TemplateField[];
  chipGroups: TemplateChipGroup[];
}

export const isCustomField = (key: string) => key.startsWith("custom_");

export const FIELD_INPUT_TYPES: TemplateFieldInputType[] = ["text", "number", "textarea", "select", "radio", "multi"];

export const fieldNeedsOptions = (type?: TemplateFieldInputType) =>
  type === "select" || type === "radio" || type === "multi";

export function defaultTemplateConfig(): ServiceTemplateConfig {
  return {
    fields: [
      { key: "serviceAddress", labelTr: "Servis Adresi", labelEn: "Service Address", enabled: true, order: 10 },
      { key: "startTime", labelTr: "Başlangıç Saati", labelEn: "Start Time", enabled: true, order: 20 },
      { key: "endTime", labelTr: "Bitiş Saati", labelEn: "End Time", enabled: true, order: 30 },
      { key: "phone", labelTr: "Müşteri Telefonu", labelEn: "Customer Phone", enabled: true, order: 40 },
      { key: "internalIp", labelTr: "Dahili IP", labelEn: "Internal IP", enabled: true, order: 50 },
      { key: "externalIp", labelTr: "Harici IP", labelEn: "External IP", enabled: true, order: 60 },
      { key: "details", labelTr: "Detaylar", labelEn: "Details", enabled: true, order: 90 },
      { key: "fee", labelTr: "Servis Ücreti", labelEn: "Service Fee", enabled: true, order: 100 },
      { key: "documentDate", labelTr: "Belge Tarihi", labelEn: "Document Date", enabled: true, order: 110 },
    ],
    chipGroups: [
      {
        key: "services",
        labelTr: "Servis Hizmetleri",
        labelEn: "Service Types",
        enabled: true,
        order: 70,
        options: [
          { key: "alarm", labelTr: "Alarm", labelEn: "Alarm" },
          { key: "fire", labelTr: "Yangın", labelEn: "Fire" },
          { key: "cctv", labelTr: "CCTV", labelEn: "CCTV" },
          { key: "ahm", labelTr: "AHM Bağlantısı", labelEn: "AHM Connection" },
          { key: "wiring", labelTr: "Kablolama", labelEn: "Wiring" },
          { key: "assembly", labelTr: "Montaj", labelEn: "Assembly" },
          { key: "commissioning", labelTr: "Devreye Alma Eğitimi", labelEn: "Commissioning Training" },
          { key: "docCheck", labelTr: "Belge Kontrolü", labelEn: "Document Check" },
          { key: "testing", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
          { key: "maintenance", labelTr: "Bakım", labelEn: "Maintenance" },
          { key: "repair", labelTr: "Arıza", labelEn: "Repair" },
          { key: "training", labelTr: "Devreye Alma", labelEn: "Commissioning" },
        ],
      },
      {
        key: "technical",
        labelTr: "Teknik Hizmetler",
        labelEn: "Technical Services",
        enabled: true,
        order: 80,
        options: [
          { key: "ahmSignal", labelTr: "AHM Sinyal Kontrolü", labelEn: "AHM Signal Check" },
          { key: "drill", labelTr: "Eğitim ve Tatbikat", labelEn: "Training and Drill" },
          { key: "dovr", labelTr: "DOVR Kayıt Kontrol", labelEn: "DOVR Record Check" },
          { key: "remote", labelTr: "Uzak Erişim", labelEn: "Remote Access" },
          { key: "backup", labelTr: "Kayıt ve Yedekleme Eğitimi", labelEn: "Recording and Backup Training" },
          { key: "cameraClarity", labelTr: "Kameralara Netlik ve Yön Ayarı", labelEn: "Camera Clarity and Direction Adjustment" },
          { key: "signalTest", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
          { key: "battery", labelTr: "Akü Ömrü Kontrolü", labelEn: "Battery Life Check" },
          { key: "wirelessPil", labelTr: "Kablosuz Dedektör Pil Kontrolü", labelEn: "Wireless Detector Battery Check" },
          { key: "gprs", labelTr: "GPRS Bağlantısı", labelEn: "GPRS Connection" },
        ],
      },
    ],
  };
}
