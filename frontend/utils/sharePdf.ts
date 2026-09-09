import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function sharePdfFile(
  uri: string,
  fileName: string,
  shareOptions: { mimeType: string; dialogTitle?: string; UTI?: string }
): Promise<void> {
  const clean = fileName.replace(/[\\/:*?"<>|]+/g, "-").trim();
  const dest = new File(Paths.cache, `${clean || "document"}.pdf`);
  try {
    new File(uri).copy(dest, { overwrite: true });
    await Sharing.shareAsync(dest.uri, shareOptions);
  } catch {
    await Sharing.shareAsync(uri, shareOptions);
  }
}