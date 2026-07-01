"use client";
import { cloudConfig } from "./cloud";

// Guarded Firebase CLIENT adapter (auth). The firebase SDK is loaded LAZILY via
// dynamic import, and only when the cloud config is present — so with no config
// the app never pulls firebase into the bundle path and runs purely local.
// Browser-only; every call is a safe no-op on the server or when disabled.

let _authPromise = null;
async function authInstance() {
  const cfg = cloudConfig();
  if (!cfg || typeof window === "undefined") return null;
  if (!_authPromise) {
    _authPromise = (async () => {
      const { initializeApp, getApps } = await import("firebase/app");
      const app = getApps().length ? getApps()[0] : initializeApp(cfg);
      const { getAuth } = await import("firebase/auth");
      return getAuth(app);
    })();
  }
  return _authPromise;
}

// Open the Google sign-in popup; resolves the signed-in user (or null if cloud
// is disabled). Throws on a real auth failure (the caller surfaces it).
export async function signInWithGoogle() {
  const auth = await authInstance();
  if (!auth) return null;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const res = await signInWithPopup(auth, new GoogleAuthProvider());
  return res.user;
}

export async function signOutCloud() {
  const auth = await authInstance();
  if (!auth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}

// Subscribe to auth state: cb(user|null). Returns an unsubscribe fn. When cloud
// is disabled it reports null once and never fires again.
export function onAuthChange(cb) {
  let unsub = () => {};
  authInstance().then((auth) => {
    if (!auth) { cb(null); return; }
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      unsub = onAuthStateChanged(auth, (u) => cb(u || null));
    });
  });
  return () => unsub();
}

// The current user's Firebase ID token (a JWT), for the Authorization header on
// gated API calls. null when signed out / disabled.
export async function getIdToken() {
  const auth = await authInstance();
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

// The signed-in user's role custom claim ("viewer" | "editor" | "admin"), read
// from the ID-token result. Defaults to "editor" (DEFAULT_ROLE) when unset; null
// when signed out / disabled. Pass true to force a token refresh (e.g. right after
// an admin changed your role) so the new claim is picked up without re-signing-in.
export async function getUserRole(forceRefresh) {
  const auth = await authInstance();
  if (!auth || !auth.currentUser) return null;
  const res = await auth.currentUser.getIdTokenResult(!!forceRefresh);
  return (res && res.claims && res.claims.role) || "editor";
}
