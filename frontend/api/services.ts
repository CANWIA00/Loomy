import apiClient from "./client";

export interface ServiceRecord {
  id: number;
  tarih: string;
  customer: string;
  customerId?: string;
  service: string;
  adres: string;
  baslangic: string;
  bitis: string;
  telefon: string;
  dahiliIp: string;
  hariciIp: string;
  detaylar: string;
  ucret: string;
  teknisyen: string;
  hizmetler: string[];
  teknik: string[];
  imzali?: boolean;
  odendi?: boolean;
  signature?: string[];
  technicianSignature?: any;
}

interface ServiceRecordBackend {
  id: number;
  documentDate: string;
  customerName: string;
  customerId?: string;
  serviceType: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  phone?: string;
  internalIp?: string;
  externalIp?: string;
  details?: string;
  fee: string;
  technician?: string;
  services: string;
  technical: string;
  signed: boolean;
  paid: boolean;
  signature?: string;
  technicianSignature?: string;
}

export interface ServicePageResponse {
  content: ServiceRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

function toFrontend(b: ServiceRecordBackend): ServiceRecord {
  let hizmetler: string[] = [];
  let teknik: string[] = [];
  try { hizmetler = JSON.parse(b.services); } catch {}
  try { teknik = JSON.parse(b.technical); } catch {}
  let signatureParsed: string[] | undefined;
  if (b.signature) {
    try {
      const p = JSON.parse(b.signature);
      signatureParsed = Array.isArray(p) ? p : undefined;
    } catch {}
  }
  let techSigParsed: any = undefined;
  if (b.technicianSignature) {
    try { techSigParsed = JSON.parse(b.technicianSignature); } catch { techSigParsed = b.technicianSignature; }
  }
  return {
    id: b.id,
    tarih: b.documentDate,
    customer: b.customerName,
    customerId: b.customerId || undefined,
    service: b.serviceType,
    adres: b.address || "",
    baslangic: b.startTime || "",
    bitis: b.endTime || "",
    telefon: b.phone || "",
    dahiliIp: b.internalIp || "",
    hariciIp: b.externalIp || "",
    detaylar: b.details || "",
    ucret: b.fee,
    teknisyen: b.technician || "",
    hizmetler,
    teknik,
    imzali: b.signed,
    odendi: b.paid,
    signature: signatureParsed,
    technicianSignature: techSigParsed,
  };
}

function toBackend(f: Partial<ServiceRecord>): Record<string, any> {
  const data: Record<string, any> = {};
  if (f.tarih !== undefined) data.documentDate = f.tarih;
  if (f.customer !== undefined) data.customerName = f.customer;
  if (f.customerId !== undefined) data.customerId = f.customerId;
  if (f.service !== undefined) data.serviceType = f.service;
  if (f.adres !== undefined) data.address = f.adres;
  if (f.baslangic !== undefined) data.startTime = f.baslangic;
  if (f.bitis !== undefined) data.endTime = f.bitis;
  if (f.telefon !== undefined) data.phone = f.telefon;
  if (f.dahiliIp !== undefined) data.internalIp = f.dahiliIp;
  if (f.hariciIp !== undefined) data.externalIp = f.hariciIp;
  if (f.detaylar !== undefined) data.details = f.detaylar;
  if (f.ucret !== undefined) data.fee = f.ucret;
  if (f.teknisyen !== undefined) data.technician = f.teknisyen;
  if (f.hizmetler !== undefined) data.services = f.hizmetler;
  if (f.teknik !== undefined) data.technical = f.teknik;
  if (f.imzali !== undefined) data.signed = f.imzali;
  if (f.odendi !== undefined) data.paid = f.odendi;
  if (f.signature !== undefined) data.signature = JSON.stringify(f.signature);
  if (f.technicianSignature !== undefined) data.technicianSignature = JSON.stringify(f.technicianSignature);
  return data;
}

export const serviceApi = {
  getAll: async (page: number = 0, size: number = 50) => {
    const res = await apiClient.get<{ content: ServiceRecordBackend[]; totalElements: number; totalPages: number; number: number; size: number }>("/services", { params: { page, size } });
    return {
      ...res,
      data: {
        ...res.data,
        content: res.data.content.map(toFrontend),
      },
    };
  },

  search: async (query: string, page: number = 0, size: number = 50) => {
    const res = await apiClient.get<{ content: ServiceRecordBackend[]; totalElements: number; totalPages: number; number: number; size: number }>("/services/search", { params: { q: query, page, size } });
    return {
      ...res,
      data: {
        ...res.data,
        content: res.data.content.map(toFrontend),
      },
    };
  },

  getById: async (id: number) => {
    const res = await apiClient.get<ServiceRecordBackend>(`/services/${id}`);
    return { ...res, data: toFrontend(res.data) };
  },

  create: async (data: Omit<ServiceRecord, "id">) => {
    const res = await apiClient.post<ServiceRecordBackend>("/services", toBackend(data));
    return { ...res, data: toFrontend(res.data) };
  },

  update: async (id: number, data: Partial<ServiceRecord>) => {
    const res = await apiClient.put<ServiceRecordBackend>(`/services/${id}`, toBackend(data));
    return { ...res, data: toFrontend(res.data) };
  },

  delete: (id: number) =>
    apiClient.delete(`/services/${id}`),
};
