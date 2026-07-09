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

// Open the Google sign-in popup; resolves the signed-in user (or null if cloud is
// disabled). It NO LONGER blocks an outside account here — access is decided
// server-side (the allow-list now includes admin-approved addresses the client
// can't see), so AuthGate reads /api/access/status after sign-in and routes an
// unapproved account to the request-access screen rather than the editor. A signed-
// in-but-unapproved session grants nothing: every gated route re-checks the list.
// Throws only on a real auth failure (the caller surfaces it).
export async function signInWithGoogle() {
  const auth = await authInstance();
  if (!auth) return null;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const res = await signInWithPopup(auth, new GoogleAuthProvider());
  return res.user;
}

// This account's server-side access status ("approved" | "pending" | "denied" |
// "none"), used by AuthGate to gate the app. Cloud off / no token → approved (the
// open local path). Fail-safe to "none" (the request screen) on any error.
export async function fetchAccessStatus() {
  const token = await getIdToken();
  if (!token) return { status: "approved" };
  try {
    const res = await fetch("/api/access/status", { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) return { status: "none" };
    return await res.json();
  } catch (e) { return { status: "none" }; }
}

// Lodge (or refresh) this account's own pending access request, with an optional
// note to the admin. Returns the new { status }. Fail-safe to "none".
export async function requestAccess(note) {
  const token = await getIdToken();
  if (!token) return { status: "none" };
  try {
    const res = await fetch("/api/access/request", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ note: note || "" }),
    });
    if (!res.ok) return { status: "none" };
    return await res.json();
  } catch (e) { return { status: "none" }; }
}

// Google OAuth access token for the Drive REST API. Re-runs the Google popup
// requesting ONLY the minimal `drive.file` scope (the app sees just files it
// creates, never the rest of the user's Drive), and reads the OAuth access token
// off the credential. null when cloud is disabled. Throws on a real auth failure
// (caller surfaces it). Deploy: enable the Drive API + add this scope to the OAuth
// consent screen (CLOUD_SETUP.md).
export async function getDriveAccessToken() {
  const auth = await authInstance();
  if (!auth) return null;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/drive.file");
  const res = await signInWithPopup(auth, provider);
  const cred = GoogleAuthProvider.credentialFromResult(res);
  return cred && cred.accessToken ? cred.accessToken : null;
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

// One-time auto-bootstrap for the FIRST admin: POST /api/admin/bootstrap with the
// current ID token. The SERVER promotes the caller to admin only if their verified
// uid matches BOOTSTRAP_ADMIN_UID — so this is a safe no-op for everyone else.
// Returns true when it actually promoted (the caller then force-refreshes its token
// to pick up the new claim). Never throws.
export async function bootstrapAdmin() {
  const token = await getIdToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/admin/bootstrap", { method: "POST", headers: { Authorization: "Bearer " + token } });
    if (!res.ok) return false;
    const data = await res.json();
    return !!(data && data.promoted);
  } catch (e) { return false; }
}
