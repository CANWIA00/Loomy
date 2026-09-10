import React, { useRef, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { stockApi, type ParsedEInvoice } from "../../apiclient/stock";
import { formatMoney, formatQty, formatDate } from "./format";

interface Props {
  visible: boolean;
  onClose: () => void;
  onImported: (summary: { created: number; updated: number; totalLines: number }) => void;
}

function FileInput({ onFile }: { onFile: (name: string, content: string) => void }) {
  if (Platform.OS !== "web") return null;
  const ref = useRef<any>(null);
  return React.createElement("input", {
    type: "file",
    accept: ".xml,text/xml,application/xml",
    ref: (el: any) => { ref.current = el; },
    style: { display: "none" },
    onChange: (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      file
        .text()
        .then((content: string) => onFile(file.name, content))
        .catch(() => onFile(file.name, ""));
      e.target.value = "";
    },
  });
}

export default function InvoiceImportModal({ visible, onClose, onImported }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [pastedXml, setPastedXml] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ParsedEInvoice | null>(null);
  const fileTriggerRef = useRef<any>(null);

  const reset = () => {
    setPastedXml("");
    setFileName(null);
    setError(null);
    setPreview(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runPreview = async (xml: string, name?: string) => {
    if (!xml.trim()) {
      setError(t("stock.previewEmpty"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await stockApi.previewXml(xml, name);
      setPreview(res.data.invoice);
      setFileName(name || null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error";
      setError(t("stock.parseError", { message: msg }));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      let xml = pastedXml;
      if (!xml.trim() && fileName && (fileContentRef.current)) {
        xml = fileContentRef.current;
      }
      const res = await stockApi.importXml(xml, fileName ?? undefined);
      onImported({
        created: res.data.created,
        updated: res.data.updated,
        totalLines: res.data.totalLines,
      });
      reset();
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || "Error";
      if (status === 409) {
        setError(t("stock.alreadyImported", { invoiceNo: (err.response?.data?.message || "").match(/"([^"]+)"/)?.[1] || "" }));
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const fileContentRef = useRef("");

  const pickFile = () => {
    fileTriggerRef.current?.click();
  };

  const onFileChosen = (name: string, content: string) => {
    fileContentRef.current = content;
    setFileName(name);
    runPreview(content, name);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-5 w-full max-w-lg" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, maxHeight: "90%" }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("stock.importTitle")}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ color: colors.textMuted }} className="text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === "web" ? (
            <TouchableOpacity
              className="h-11 rounded-lg items-center justify-center mb-3 flex-row gap-2"
              style={{ backgroundColor: colors.primary }}
              onPress={pickFile}
            >
              {busy ? <ActivityIndicator size="small" color="white" /> : null}
              <Text style={{ color: "white" }} className="font-semibold">{t("stock.chooseFile")}</Text>
            </TouchableOpacity>
          ) : null}

          <FileInput onFile={onFileChosen} />

          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.pasteXml")}</Text>
          <TextInput
            value={pastedXml}
            onChangeText={setPastedXml}
            multiline
            className="rounded-lg px-3 py-2 mb-2"
            style={{ backgroundColor: colors.bgInput, color: colors.text, minHeight: 90, textAlignVertical: "top" }}
          />
          <Text className="text-[10px] mb-3" style={{ color: colors.textMuted }}>{t("stock.importHint")}</Text>

          <TouchableOpacity
            className="h-9 rounded-lg items-center justify-center mb-3"
            style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}
            disabled={busy || !pastedXml.trim()}
            onPress={() => runPreview(pastedXml)}
          >
            <Text style={{ color: colors.primary }} className="text-xs font-semibold">{t("stock.preview")}</Text>
          </TouchableOpacity>

          {error ? (
            <View className="rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: colors.danger + "22", borderColor: colors.danger + "66", borderWidth: 1 }}>
              <Text className="text-xs" style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}

          {busy && !preview && !error ? (
            <View className="items-center justify-center py-6">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}

          {preview ? (
            <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("stock.preview")}</Text>
                {fileName ? <Text className="text-[10px]" style={{ color: colors.textMuted }}>{fileName}</Text> : null}
              </View>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {preview.invoiceNo}
                {preview.supplierName ? ` · ${preview.supplierName}` : ""}
                {preview.date ? ` · ${formatDate(preview.date)}` : ""}
              </Text>
              {preview.totalAmount != null ? (
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {t("stock.amount")}: {formatMoney(preview.totalAmount, preview.currency)}
                </Text>
              ) : null}
              <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{t("stock.previewLines", { count: String(preview.lines.length) })}</Text>

              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {preview.lines.map((line, i) => (
                  <View key={i} className="flex-row items-center justify-between py-1.5 border-b" style={{ borderColor: colors.border }}>
                    <Text className="text-xs flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>{line.name}</Text>
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {formatQty(line.quantity)} {line.unit}
                    </Text>
                    <Text className="text-xs ml-2" style={{ color: colors.textMuted }}>{formatMoney(line.unitPrice, preview.currency)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
              onPress={handleClose}
            >
              <Text style={{ color: colors.textSecondary }} className="font-semibold">{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-11 rounded-lg items-center justify-center px-6 flex-row gap-2"
              style={{ backgroundColor: colors.primary }}
              disabled={busy || !preview}
              onPress={confirmImport}
            >
              {busy && preview ? <ActivityIndicator size="small" color="white" /> : null}
              <Text style={{ color: "white" }} className="font-semibold">{t("stock.confirmImport")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}