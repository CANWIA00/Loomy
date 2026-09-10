import React, { useRef, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { stockApi } from "../../apiclient/stock";

interface Props {
  visible: boolean;
  onClose: () => void;
  onImported: (summary: { created: number; updated: number; totalLines: number }) => void;
}

function FileInput({ triggerRef, onFile }: { triggerRef: React.MutableRefObject<any | null>; onFile: (name: string, content: string) => void }) {
  if (Platform.OS !== "web") return null;
  return React.createElement("input", {
    type: "file",
    accept: ".xml,text/xml,application/xml",
    ref: (el: any) => { triggerRef.current = el; },
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
  const fileTriggerRef = useRef<any>(null);

  const reset = () => {
    setPastedXml("");
    setFileName(null);
    setError(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleError = (err: any) => {
    const status = err.response?.status;
    let msg = err.response?.data?.message || err.message || "Error";
    if (status === 409) {
      const m = (err.response?.data?.message || "").match(/"([^"]+)"/)?.[1] || "";
      setError(t("stock.alreadyImported", { invoiceNo: m }));
    } else {
      setError(t("stock.parseError", { message: msg }));
    }
  };

  const runImport = async (xml: string, name?: string) => {
    if (!xml.trim()) {
      setError(t("stock.previewEmpty"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await stockApi.importXml(xml, name);
      onImported({
        created: res.data.created,
        updated: res.data.updated,
        totalLines: res.data.totalLines,
      });
      reset();
    } catch (err: any) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const pickFile = () => {
    if (!busy) fileTriggerRef.current?.click();
  };

  const onFileChosen = (name: string, content: string) => {
    setFileName(name);
    runImport(content, name);
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
              className="h-12 rounded-lg items-center justify-center mb-3 flex-row gap-2"
              style={{ backgroundColor: colors.primary }}
              onPress={pickFile}
              disabled={busy}
            >
              {busy && !fileName ? <ActivityIndicator size="small" color="white" /> : null}
              <Text style={{ color: "white" }} className="font-semibold">{t("stock.chooseFile")}</Text>
            </TouchableOpacity>
          ) : null}

          <FileInput triggerRef={fileTriggerRef} onFile={onFileChosen} />

          {fileName && !busy && !error ? (
            <View className="rounded-lg px-3 py-2 mb-3 flex-row items-center" style={{ backgroundColor: colors.success + "22", borderColor: colors.success + "66", borderWidth: 1 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text className="text-xs ml-2 flex-1" style={{ color: colors.success }}>{fileName}</Text>
            </View>
          ) : null}

          {error ? (
            <View className="rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: colors.danger + "22", borderColor: colors.danger + "66", borderWidth: 1 }}>
              <Text className="text-xs" style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}

          {busy ? (
            <View className="items-center justify-center py-4">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>{t("stock.loading")}</Text>
            </View>
          ) : null}

          <Text className="text-xs mb-1 mt-3" style={{ color: colors.textSecondary }}>{t("stock.pasteXml")}</Text>
          <TextInput
            value={pastedXml}
            onChangeText={setPastedXml}
            multiline
            className="rounded-lg px-3 py-2 mb-2"
            style={{ backgroundColor: colors.bgInput, color: colors.text, minHeight: 80, textAlignVertical: "top" }}
          />
          <Text className="text-[10px] mb-3" style={{ color: colors.textMuted }}>{t("stock.importHint")}</Text>

          <TouchableOpacity
            className="h-11 rounded-lg items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary }}
            disabled={busy || !pastedXml.trim()}
            onPress={() => runImport(pastedXml)}
          >
            {busy && pastedXml.trim() ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white" }} className="font-semibold">{t("stock.confirmImport")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="h-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={handleClose}
          >
            <Text style={{ color: colors.textSecondary }} className="font-semibold">{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}