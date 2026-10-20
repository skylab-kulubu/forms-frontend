import { signIn, signOut } from "next-auth/react";

const POST_LOGIN_KEY = "postLoginRedirect";

function framed() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function topHref(fallback) {
  try {
    return window.top.location.href;
  } catch {
    return fallback;
  }
}

// Stash where the user is headed before we leave for Keycloak, then start the sign-in.
// sessionStorage survives the OAuth round-trip within the same tab, so if the callback
// fails and we land on /auth/error, we can still send the user back to where they were
// instead of dropping them on a default page.
export function loginWithKeycloak(callbackUrl) {
  const inFrame = typeof window !== "undefined" && framed();
  const target = inFrame ? topHref(callbackUrl) : callbackUrl;
  try {
    if (target) sessionStorage.setItem(POST_LOGIN_KEY, target);
  } catch { }
  if (inFrame) {
    return signIn("keycloak", { callbackUrl: target, redirect: false }).then((res) => {
      if (res?.url) window.top.location.assign(res.url);
    });
  }
  return signIn("keycloak", target ? { callbackUrl: target } : undefined);
}

// The destination stashed by the most recent loginWithKeycloak, if any.
export function getPostLoginRedirect() {
  try {
    return sessionStorage.getItem(POST_LOGIN_KEY) || null;
  } catch {
    return null;
  }
}

export function clearPostLoginRedirect() {
  try { sessionStorage.removeItem(POST_LOGIN_KEY); } catch { }
}

// Sign out, clearing the stashed destination so a later unrelated auth error in the same
// tab can't bounce the user back to a page from a previous session.
export function logout(options) {
  clearPostLoginRedirect();
  return signOut(options);
}
