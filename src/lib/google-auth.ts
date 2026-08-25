"use client";

// Google Identity Services (GIS) client-side OAuth2 token flow — gets an
// access_token in the browser, which is then POSTed to
// /auth/google/access_token (same endpoint the mobile app's Flutter-web
// build uses, since a browser can't get an id_token the way native apps can).

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }): { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")));
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function isGoogleSignInConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

/** Opens the Google account picker and resolves with an OAuth2 access_token. */
export async function requestGoogleAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google sign-in is not available yet.");
  }
  await loadGsiScript();

  return new Promise((resolve, reject) => {
    try {
      const client = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error_description || "Google sign-in was cancelled."));
            return;
          }
          resolve(response.access_token);
        },
        error_callback: (err) => {
          reject(new Error(err?.message || "Google sign-in was cancelled."));
        },
      });
      client.requestAccessToken();
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Google sign-in failed."));
    }
  });
}
