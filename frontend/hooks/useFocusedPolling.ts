import { useEffect, useRef } from "react";
import { useIsFocused } from "expo-router";

export function useFocusedPolling(refetch: () => Promise<void> | void, intervalMs = 30000) {
  const isFocused = useIsFocused();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        await refetch();
      } catch {
      } finally {
        inFlight.current = false;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [isFocused, refetch, intervalMs]);
}