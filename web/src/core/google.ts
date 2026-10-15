/**
 * Sign in with Google, through Google Identity Services.
 * Needs `VITE_GOOGLE_CLIENT_ID` (an OAuth client of Libertario's Google Cloud
 * project, with this origin authorized). Without it the button is not shown
 * and signup continues with email. The ID token is decoded on the phone only
 * to prefill name and email; a backend must verify it before trusting it.
 */
export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export type GoogleProfile = { sub: string; name: string; email: string; picture?: string };

type Credential = { credential: string };

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: Credential) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
      locale?: string;
    },
  ) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let loading: Promise<void> | null = null;

export function loadGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gsi failed"));
    document.head.appendChild(script);
  });
  return loading;
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1] ?? "";
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function renderGoogleButton(
  parent: HTMLElement,
  locale: string,
  onProfile: (profile: GoogleProfile) => void,
): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID) return false;
  await loadGoogle();
  const id = window.google?.accounts.id;
  if (!id) return false;
  id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    ux_mode: "popup",
    itp_support: true,
    callback: (response) => {
      const payload = decodePayload(response.credential);
      if (!payload) return;
      onProfile({
        sub: String(payload.sub ?? ""),
        name: String(payload.name ?? ""),
        email: String(payload.email ?? ""),
        ...(typeof payload.picture === "string" ? { picture: payload.picture } : {}),
      });
    },
  });
  id.renderButton(parent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width: Math.min(360, parent.clientWidth || 320),
    locale,
  });
  return true;
}
