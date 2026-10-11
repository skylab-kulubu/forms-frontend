const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOAD_TIMEOUT_MS = 15000;

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

let loading = null;

export function loadTurnstile() {
  if (typeof window === "undefined") return Promise.reject(new Error("blocked"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let timer = null;

    const fail = () => {
      clearTimeout(timer);
      script.remove();
      loading = null;
      reject(new Error("blocked"));
    };

    timer = setTimeout(fail, LOAD_TIMEOUT_MS);
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return loading;
}
