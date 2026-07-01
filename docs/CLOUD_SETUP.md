# Cloud setup — Google sign-in + Firestore storage

Step-by-step to turn on the cloud layer (Google sign-in + per-user deck storage)
for LOATHR Studio. **Until these env vars are set, the app runs exactly as today**
— open, local-only, download-to-export. Setting them flips on the sign-in gate,
the token-gated generate route, and cloud autosave. Do this when you're ready to
deploy; nothing here runs from the sandbox.

The design + which keys are public vs secret is in `app/studio/cloud.js`.

---

## 1. Create the Firebase project
1. <https://console.firebase.google.com> → **Add project** (e.g. `loathr-studio`).
2. In the project, **Add app → Web (`</>`)**. Copy the `firebaseConfig` values —
   they map to the `NEXT_PUBLIC_FIREBASE_*` vars in step 6. (These are **public**
   by design — an API "key" here is an identifier, not a secret; access is
   enforced by the security rules in step 4.)

## 2. Enable Google sign-in
1. **Authentication → Get started → Sign-in method → Google → Enable.** Set the
   support email, Save.
2. **Authentication → Settings → Authorized domains:** add your Vercel domain
   (e.g. `loathr.com` and `*.vercel.app` for previews). `localhost` is preset.

## 3. Create Firestore
**Firestore Database → Create database → Production mode → pick a region.**

## 4. Security rules (per-user isolation)
**Firestore → Rules** — a signed-in user may touch only their own decks; a deck
shared by link is readable by anyone who knows it (the link token is the grant,
checked app-side); admins may read everything; usage counters are server-write
only:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() { return request.auth != null && request.auth.token.role == 'admin'; }

    match /users/{uid}/decks/{deckId} {
      // owner full access; shared decks are readable by any signed-in user (the
      // link token is verified in the app); admins read all.
      allow read:  if isAdmin() || (request.auth != null &&
                       (request.auth.uid == uid || resource.data.share.link in ['view','edit']));
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    // Profile + admin-set role/limits: the user reads their own; only admins (or
    // the Admin SDK, which bypasses rules) write role/limits.
    match /users/{uid} {
      allow read:  if isAdmin() || (request.auth != null && request.auth.uid == uid);
      allow write: if false; // role/limits are set server-side via the Admin SDK
    }
    // Usage counters are written ONLY by the server (Admin SDK bypasses rules);
    // the owner and admins may read.
    match /usage/{uid}/months/{period} {
      allow read:  if isAdmin() || (request.auth != null && request.auth.uid == uid);
      allow write: if false;
    }
    // Share index: the owner writes/clears it (sharing on/off); NOBODY reads it
    // via the client — share links are resolved by the server (/api/shared, Admin
    // SDK), which verifies the token, so a rotated token revokes old links.
    match /shares/{deckId} {
      allow read:   if false;
      allow create, update: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;
      allow delete: if request.auth != null && request.auth.uid == resource.data.ownerUid;
    }
  }
}
```
Roles ride as a `role` custom claim (`viewer`/`editor`/`admin`) set via
`POST /api/admin/role`; bootstrap the first admin by setting `BOOTSTRAP_ADMIN_UID`
to your uid, then call that route once. Per-account monthly limits live at
`users/{uid}.limits.monthly` (0/absent = unlimited) and are enforced server-side
on `/api/generate` (429 when reached).

**Admin console.** Once you're an admin, the Projects screen shows a **⚙ Admin**
entry (hidden from editors/viewers). It reads `GET /api/admin/accounts` (admin-gated;
every account with role + limit + this-month usage, plus every deck's metadata) and
writes via `/api/admin/role` and `/api/admin/limit`. These run on the Admin SDK, which
**bypasses** security rules — no extra rules needed. The **All decks** view uses a
Firestore **collection-group query** over `decks`; if it's empty on a populated
project, create the single-field **collection-group index** for `decks` (Firestore
surfaces a one-click link, or Indexes → add). The read fails open, so a missing index
just empties that tab rather than erroring.

**Storage → Rules** (for uploaded images, step 11b of the build):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**Uploads are wired (step 11c).** On save, every embedded `data:` image in the
deck is pushed to `users/{uid}/decks/{deckId}/img_<hash>.{jpg,png}` and the doc
is rewritten to download URLs, so the Firestore doc stays well under its 1 MB
limit. Set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` and enable Cloud Storage for
this to engage; with no bucket the editor falls back to inline data URLs (small
decks only). Content-hashed paths dedupe repeats across slides and re-saves.

## 5. Service account (server token verification)
**Project settings → Service accounts → Generate new private key** → downloads a
JSON file. You'll paste it (or its three fields) into the `FIREBASE_*` admin vars
in step 6. This is **secret** — never `NEXT_PUBLIC_*`.

## 6. Environment variables (Vercel → Settings → Environment Variables)

**Public — the web config (safe in the client bundle):**
| Var | From |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | firebaseConfig.apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | firebaseConfig.authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | firebaseConfig.projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | firebaseConfig.storageBucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | firebaseConfig.messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | firebaseConfig.appId |

The gate turns on only when `API_KEY` + `AUTH_DOMAIN` + `PROJECT_ID` + `APP_ID`
are all present (`cloud.js` `cloudConfig`).

**Secret — server only (never `NEXT_PUBLIC_`):**
| Var | From | Purpose |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | service-account `project_id` | verify ID tokens |
| `FIREBASE_CLIENT_EMAIL` | service-account `client_email` | " |
| `FIREBASE_PRIVATE_KEY` | service-account `private_key` | " (paste with the `\n`s as-is; the code restores newlines) |
| `ANTHROPIC_API_KEY` | Anthropic console | generation |
| `UNSPLASH_KEY` / `PEXELS_KEY` / `PIXABAY_KEY` | each provider | photo search |

> Alternative to the three `FIREBASE_*` fields: set `FIREBASE_SERVICE_ACCOUNT` to
> the **entire** service-account JSON on one line.

> **Image keys renamed:** the route now reads the non-`NEXT_PUBLIC_` names only
> (so provider keys never reach the browser). If you previously set
> `NEXT_PUBLIC_UNSPLASH_KEY` etc., re-add them as `UNSPLASH_KEY` etc.

The server gate (`/api/generate` requiring a token) turns on only when the
`FIREBASE_*` admin creds are present (`authCore.adminCredentials`). So you can ship
public auth first and add server gating once the service account is in.

## 7. Deploy & verify
1. Redeploy on Vercel so the env vars bake in.
2. Open `/studio` → you should see **Continue with Google** → sign in.
3. Create a deck, edit, **refresh** — it should reload from your account.
4. Sign out / open in another Google account → you must NOT see the first
   account's decks (confirms the security rules).
5. `/api/generate` without a session should 401 (server gate on).

## Rollback
Remove the `NEXT_PUBLIC_FIREBASE_*` vars and redeploy — the gate and cloud calls
go dormant and the app returns to the open, local-only flow. No data migration.
