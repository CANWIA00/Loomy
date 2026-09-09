import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toSafeFileName } from "./fileName";

export async function sharePdfFile(
  uri: string,
  fileName: string,
  shareOptions: { mimeType: string; dialogTitle?: string; UTI?: string }
): Promise<void> {
  const clean = toSafeFileName(fileName) || "document";
  const dest = new File(Paths.cache, `${clean}.pdf`);
  try {
    new File(uri).copy(dest, { overwrite: true });
    await Sharing.shareAsync(dest.uri, shareOptions);
  } catch {
    await Sharing.shareAsync(uri, shareOptions);
  }
}