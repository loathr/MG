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

// The email domains allowed to sign in (client-side mirror of the server gate):
// NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS (comma-separated), default "loathr.com".
function allowedDomainsClient() {
  const raw = (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS) || "loathr.com";
  return String(raw).split(",").map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
}
// Gmail-canonical normalisation (mirror of authCore.normalizeEmail) so the client
// gate matches the server: dot/plus-insensitive for gmail, lowercased/trimmed else.
function normalizeEmailClient(email) {
  const s = String(email || "").trim().toLowerCase();
  const at = s.lastIndexOf("@");
  if (at < 0) return s;
  let local = s.slice(0, at), domain = s.slice(at + 1);
  local = local.split("+")[0];
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return local + "@" + domain;
}
// Individually allow-listed addresses (NEXT_PUBLIC_ALLOWED_EMAILS), normalised.
function allowedEmailsClient() {
  const raw = (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_ALLOWED_EMAILS) || "";
  return String(raw).split(",").map((x) => normalizeEmailClient(x)).filter((x) => x.includes("@"));
}
function emailAllowedClient(email) {
  const norm = normalizeEmailClient(email);
  if (allowedEmailsClient().includes(norm)) return true;   // select individual accounts
  const doms = allowedDomainsClient();
  if (!doms.length) return true;
  const at = norm.lastIndexOf("@");
  return at >= 0 && doms.includes(norm.slice(at + 1));
}

// Open the Google sign-in popup; resolves the signed-in user (or null if cloud
// is disabled). Rejects an account outside the allowed domain (default @loathr.com)
// — signs it straight back out and throws a clear message the sign-in screen shows,
// so an outside Google account can never enter the app. Throws on a real auth
// failure too (the caller surfaces it).
export async function signInWithGoogle() {
  const auth = await authInstance();
  if (!auth) return null;
  const { GoogleAuthProvider, signInWithPopup, signOut } = await import("firebase/auth");
  const res = await signInWithPopup(auth, new GoogleAuthProvider());
  if (!emailAllowedClient(res.user && res.user.email)) {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    const doms = allowedDomainsClient().map((d) => "@" + d).join(" or ");
    throw new Error("Only " + doms + " accounts can sign in.");
  }
  return res.user;
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
