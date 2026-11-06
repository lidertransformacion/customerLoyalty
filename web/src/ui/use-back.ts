import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import { menuOnly } from "../core/mode";

/**
 * Goes back the way the guest came, and to the menu when there is no way back:
 * a product opened from a shared link, a reload while reading it, a tab the phone
 * restored. Plain `navigate(-1)` there leaves the app or does nothing.
 */
export function useBack(fallback: string = menuOnly ? "/" : "/menu"): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    const firstEntry = location.key === "default" || window.history.length <= 1;
    if (firstEntry) navigate(fallback, { replace: true });
    else navigate(-1);
  }, [fallback, location.key, navigate]);
}
