export const serviceKeys = ["alarm", "fire", "cctv", "ahm", "wiring", "assembly", "commissioning", "docCheck"];
export const technicalKeys = ["ahmSignal", "drill", "dovr", "remote", "backup", "cameraClarity", "signalTest", "battery", "wirelessPil", "gprs"];

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
  documentDate: string;
  services: string[];
  technical: string[];
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
  documentDate: "",
  services: [],
  technical: [],
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
  startTime: string;
  endTime: string;
  details: string;
  internalIp?: string;
  externalIp?: string;
  signature: any;
  technicianSignature: any;
  companyLogo: string | null;
  companyStamp: string | null;
}

export type RecordFilter = "all" | "gun" | "ay" | "yil";
