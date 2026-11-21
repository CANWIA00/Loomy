import { useEffect, useRef } from "react";
import { useIsFocused } from "expo-router";

/**
 * Ekran odaktayken verileri aralikla yeniler.
 * refetchOnFocus: ekrana geri donuldugunde (ilk acilis haric) hemen yeniler;
 * ornegin teklif kabul edilip Plan sekmesine gecildiginde liste beklemeden guncellenir.
 */
export function useFocusedPolling(
  refetch: () => Promise<void> | void,
  intervalMs = 30000,
  options: { refetchOnFocus?: boolean } = {},
) {
  const isFocused = useIsFocused();
  const inFlight = useRef(false);
  // Her render'da yeni fonksiyon gelse de sayac sifirlanmasin diye son hali ref'te tutulur.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const wasFocused = useRef<boolean | null>(null);

  const run = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await refetchRef.current();
    } catch {
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    const returned = isFocused && wasFocused.current === false;
    wasFocused.current = isFocused;
    if (!isFocused) return;
    if (returned && options.refetchOnFocus) run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, intervalMs, options.refetchOnFocus]);
}
