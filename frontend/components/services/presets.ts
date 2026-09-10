import type { ServiceTemplateConfig } from "./types";

export interface TemplatePreset {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  config: ServiceTemplateConfig;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "general",
    nameKey: "tpl.preset.general",
    descKey: "tpl.preset.generalDesc",
    icon: "document-text-outline",
    config: {
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
    },
  },
  {
    id: "alarm",
    nameKey: "tpl.preset.alarm",
    descKey: "tpl.preset.alarmDesc",
    icon: "notifications-outline",
    config: {
      fields: [
        { key: "serviceAddress", labelTr: "Servis Adresi", labelEn: "Service Address", enabled: true, order: 10 },
        { key: "startTime", labelTr: "Başlangıç Saati", labelEn: "Start Time", enabled: true, order: 20 },
        { key: "endTime", labelTr: "Bitiş Saati", labelEn: "End Time", enabled: true, order: 30 },
        { key: "phone", labelTr: "Müşteri Telefonu", labelEn: "Customer Phone", enabled: true, order: 40 },
        { key: "internalIp", labelTr: "Dahili IP", labelEn: "Internal IP", enabled: false, order: 50 },
        { key: "externalIp", labelTr: "Harici IP", labelEn: "External IP", enabled: false, order: 60 },
        { key: "details", labelTr: "Detaylar", labelEn: "Details", enabled: true, order: 90 },
        { key: "fee", labelTr: "Servis Ücreti", labelEn: "Service Fee", enabled: true, order: 100 },
        { key: "documentDate", labelTr: "Belge Tarihi", labelEn: "Document Date", enabled: true, order: 110 },
      ],
      chipGroups: [
        {
          key: "services",
          labelTr: "Servis Türü",
          labelEn: "Service Type",
          enabled: true,
          order: 70,
          inputType: "radio",
          options: [
            { key: "maintenance", labelTr: "Bakım", labelEn: "Maintenance" },
            { key: "repair", labelTr: "Arıza", labelEn: "Repair" },
            { key: "alarm", labelTr: "Alarm", labelEn: "Alarm" },
            { key: "testing", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
          ],
        },
        {
          key: "technical",
          labelTr: "Teknik Kontroller",
          labelEn: "Technical Checks",
          enabled: true,
          order: 80,
          options: [
            { key: "ahmSignal", labelTr: "AHM Sinyal Kontrolü", labelEn: "AHM Signal Check" },
            { key: "battery", labelTr: "Akü Ömrü Kontrolü", labelEn: "Battery Life Check" },
            { key: "wirelessPil", labelTr: "Kablosuz Dedektör Pil Kontrolü", labelEn: "Wireless Detector Battery Check" },
            { key: "gprs", labelTr: "GPRS Bağlantısı", labelEn: "GPRS Connection" },
            { key: "signalTest", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
            { key: "drill", labelTr: "Eğitim ve Tatbikat", labelEn: "Training and Drill" },
          ],
        },
      ],
    },
  },
  {
    id: "cctv",
    nameKey: "tpl.preset.cctv",
    descKey: "tpl.preset.cctvDesc",
    icon: "videocam-outline",
    config: {
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
          labelTr: "Servis Türü",
          labelEn: "Service Type",
          enabled: true,
          order: 70,
          inputType: "radio",
          options: [
            { key: "cctv", labelTr: "CCTV", labelEn: "CCTV" },
            { key: "maintenance", labelTr: "Bakım", labelEn: "Maintenance" },
            { key: "repair", labelTr: "Arıza", labelEn: "Repair" },
            { key: "wiring", labelTr: "Kablolama", labelEn: "Wiring" },
            { key: "assembly", labelTr: "Montaj", labelEn: "Assembly" },
          ],
        },
        {
          key: "technical",
          labelTr: "Teknik Kontroller",
          labelEn: "Technical Checks",
          enabled: true,
          order: 80,
          options: [
            { key: "cameraClarity", labelTr: "Kameralara Netlik ve Yön Ayarı", labelEn: "Camera Clarity and Direction Adjustment" },
            { key: "dovr", labelTr: "DOVR Kayıt Kontrol", labelEn: "DOVR Record Check" },
            { key: "backup", labelTr: "Kayıt ve Yedekleme Eğitimi", labelEn: "Recording and Backup Training" },
            { key: "remote", labelTr: "Uzak Erişim", labelEn: "Remote Access" },
          ],
        },
      ],
    },
  },
  {
    id: "fire",
    nameKey: "tpl.preset.fire",
    descKey: "tpl.preset.fireDesc",
    icon: "flame-outline",
    config: {
      fields: [
        { key: "serviceAddress", labelTr: "Servis Adresi", labelEn: "Service Address", enabled: true, order: 10 },
        { key: "startTime", labelTr: "Başlangıç Saati", labelEn: "Start Time", enabled: true, order: 20 },
        { key: "endTime", labelTr: "Bitiş Saati", labelEn: "End Time", enabled: true, order: 30 },
        { key: "phone", labelTr: "Müşteri Telefonu", labelEn: "Customer Phone", enabled: true, order: 40 },
        { key: "internalIp", labelTr: "Dahili IP", labelEn: "Internal IP", enabled: false, order: 50 },
        { key: "externalIp", labelTr: "Harici IP", labelEn: "External IP", enabled: false, order: 60 },
        { key: "details", labelTr: "Detaylar", labelEn: "Details", enabled: true, order: 90 },
        { key: "fee", labelTr: "Servis Ücreti", labelEn: "Service Fee", enabled: true, order: 100 },
        { key: "documentDate", labelTr: "Belge Tarihi", labelEn: "Document Date", enabled: true, order: 110 },
      ],
      chipGroups: [
        {
          key: "services",
          labelTr: "Servis Türü",
          labelEn: "Service Type",
          enabled: true,
          order: 70,
          inputType: "radio",
          options: [
            { key: "fire", labelTr: "Yangın", labelEn: "Fire" },
            { key: "maintenance", labelTr: "Bakım", labelEn: "Maintenance" },
            { key: "testing", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
            { key: "repair", labelTr: "Arıza", labelEn: "Repair" },
          ],
        },
        {
          key: "technical",
          labelTr: "Teknik Kontroller",
          labelEn: "Technical Checks",
          enabled: true,
          order: 80,
          options: [
            { key: "signalTest", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
            { key: "drill", labelTr: "Eğitim ve Tatbikat", labelEn: "Training and Drill" },
            { key: "battery", labelTr: "Akü Ömrü Kontrolü", labelEn: "Battery Life Check" },
          ],
        },
      ],
    },
  },
  {
    id: "ahm",
    nameKey: "tpl.preset.ahm",
    descKey: "tpl.preset.ahmDesc",
    icon: "cellular-outline",
    config: {
      fields: [
        { key: "serviceAddress", labelTr: "Servis Adresi", labelEn: "Service Address", enabled: true, order: 10 },
        { key: "startTime", labelTr: "Başlangıç Saati", labelEn: "Start Time", enabled: true, order: 20 },
        { key: "endTime", labelTr: "Bitiş Saati", labelEn: "End Time", enabled: true, order: 30 },
        { key: "phone", labelTr: "Müşteri Telefonu", labelEn: "Customer Phone", enabled: true, order: 40 },
        { key: "internalIp", labelTr: "Dahili IP", labelEn: "Internal IP", enabled: false, order: 50 },
        { key: "externalIp", labelTr: "Harici IP", labelEn: "External IP", enabled: false, order: 60 },
        { key: "details", labelTr: "Detaylar", labelEn: "Details", enabled: true, order: 90 },
        { key: "fee", labelTr: "Servis Ücreti", labelEn: "Service Fee", enabled: true, order: 100 },
        { key: "documentDate", labelTr: "Belge Tarihi", labelEn: "Document Date", enabled: true, order: 110 },
      ],
      chipGroups: [
        {
          key: "services",
          labelTr: "Servis Türü",
          labelEn: "Service Type",
          enabled: true,
          order: 70,
          inputType: "radio",
          options: [
            { key: "ahm", labelTr: "AHM Bağlantısı", labelEn: "AHM Connection" },
            { key: "commissioning", labelTr: "Devreye Alma Eğitimi", labelEn: "Commissioning Training" },
            { key: "maintenance", labelTr: "Bakım", labelEn: "Maintenance" },
          ],
        },
        {
          key: "technical",
          labelTr: "Teknik Kontroller",
          labelEn: "Technical Checks",
          enabled: true,
          order: 80,
          options: [
            { key: "ahmSignal", labelTr: "AHM Sinyal Kontrolü", labelEn: "AHM Signal Check" },
            { key: "gprs", labelTr: "GPRS Bağlantısı", labelEn: "GPRS Connection" },
            { key: "remote", labelTr: "Uzak Erişim", labelEn: "Remote Access" },
            { key: "signalTest", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
          ],
        },
      ],
    },
  },
  {
    id: "wiring",
    nameKey: "tpl.preset.wiring",
    descKey: "tpl.preset.wiringDesc",
    icon: "git-network-outline",
    config: {
      fields: [
        { key: "serviceAddress", labelTr: "Servis Adresi", labelEn: "Service Address", enabled: true, order: 10 },
        { key: "startTime", labelTr: "Başlangıç Saati", labelEn: "Start Time", enabled: true, order: 20 },
        { key: "endTime", labelTr: "Bitiş Saati", labelEn: "End Time", enabled: true, order: 30 },
        { key: "phone", labelTr: "Müşteri Telefonu", labelEn: "Customer Phone", enabled: true, order: 40 },
        { key: "internalIp", labelTr: "Dahili IP", labelEn: "Internal IP", enabled: false, order: 50 },
        { key: "externalIp", labelTr: "Harici IP", labelEn: "External IP", enabled: false, order: 60 },
        { key: "details", labelTr: "Detaylar", labelEn: "Details", enabled: true, order: 90 },
        { key: "fee", labelTr: "Servis Ücreti", labelEn: "Service Fee", enabled: true, order: 100 },
        { key: "documentDate", labelTr: "Belge Tarihi", labelEn: "Document Date", enabled: true, order: 110 },
      ],
      chipGroups: [
        {
          key: "services",
          labelTr: "Yapılan İşlem",
          labelEn: "Work Performed",
          enabled: true,
          order: 70,
          inputType: "radio",
          options: [
            { key: "wiring", labelTr: "Kablolama", labelEn: "Wiring" },
            { key: "assembly", labelTr: "Montaj", labelEn: "Assembly" },
            { key: "commissioning", labelTr: "Devreye Alma Eğitimi", labelEn: "Commissioning Training" },
            { key: "training", labelTr: "Devreye Alma", labelEn: "Commissioning" },
          ],
        },
        {
          key: "technical",
          labelTr: "Teknik Kontroller",
          labelEn: "Technical Checks",
          enabled: true,
          order: 80,
          options: [
            { key: "docCheck", labelTr: "Belge Kontrolü", labelEn: "Document Check" },
          ],
        },
      ],
    },
  },
  {
    id: "commissioning",
    nameKey: "tpl.preset.commissioning",
    descKey: "tpl.preset.commissioningDesc",
    icon: "rocket-outline",
    config: {
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
          labelTr: "Yapılan İşlem",
          labelEn: "Work Performed",
          enabled: true,
          order: 70,
          inputType: "radio",
          options: [
            { key: "commissioning", labelTr: "Devreye Alma Eğitimi", labelEn: "Commissioning Training" },
            { key: "training", labelTr: "Devreye Alma", labelEn: "Commissioning" },
            { key: "docCheck", labelTr: "Belge Kontrolü", labelEn: "Document Check" },
            { key: "testing", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
          ],
        },
        {
          key: "technical",
          labelTr: "Teknik Kontroller",
          labelEn: "Technical Checks",
          enabled: true,
          order: 80,
          options: [
            { key: "drill", labelTr: "Eğitim ve Tatbikat", labelEn: "Training and Drill" },
            { key: "signalTest", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
            { key: "ahmSignal", labelTr: "AHM Sinyal Kontrolü", labelEn: "AHM Signal Check" },
          ],
        },
      ],
    },
  },
];

export function presetById(id: string): ServiceTemplateConfig | null {
  const preset = TEMPLATE_PRESETS.find((p) => p.id === id);
  if (!preset) return null;
  return JSON.parse(JSON.stringify(preset.config)) as ServiceTemplateConfig;
}
