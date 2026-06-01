import { signIn, signOut } from "next-auth/react";

const POST_LOGIN_KEY = "postLoginRedirect";

// Stash where the user is headed before we leave for Keycloak, then start the sign-in.
// sessionStorage survives the OAuth round-trip within the same tab, so if the callback
// fails and we land on /auth/error, we can still send the user back to where they were
// instead of dropping them on a default page.
export function loginWithKeycloak(callbackUrl) {
  try {
    if (callbackUrl) sessionStorage.setItem(POST_LOGIN_KEY, callbackUrl);
  } catch { }
  return signIn("keycloak", callbackUrl ? { callbackUrl } : undefined);
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
