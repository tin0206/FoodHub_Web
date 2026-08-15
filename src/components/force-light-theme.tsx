"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { applyTheme } from "@/lib/theme";
import { ForceLightContext } from "@/lib/force-light-context";

/**
 * Wraps public marketing/guest pages (landing, public recipes) so every
 * descendant's useDarkMode() always resolves to light, regardless of
 * whatever dark-mode preference is stored from the authenticated app — the
 * `--tm-*` CSS vars are global and useDarkMode() re-reads localStorage on its
 * own, so a plain one-off applyTheme(false) call doesn't reliably stick.
 * This resets the live CSS vars too, for anything reading them directly, but
 * never touches the persisted preference, so it can't clobber what the user
 * saved in the app.
 */
export function ForceLightTheme({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme(false);
  }, []);

  return (
    <ForceLightContext.Provider value={true}>
      {children}
    </ForceLightContext.Provider>
  );
}
