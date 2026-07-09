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
    // Real-time "live viewer" pulse. Token-LESS: this doc holds only { updatedAt },
    // no token and no deck content, so it is safe to make world-readable — a viewer
    // subscribes with onSnapshot and, on each bump, re-fetches the VALIDATED deck
    // via /api/shared (which still checks the token). Writes come from the owner's
    // save (their uid) only.
    match /sharePulse/{deckId} {
      allow read:   if true;
      allow write:  if request.auth != null;
    }
    // Live presence (collab): each open editor's cursor/selection/name. Signed-in
    // users only, and you may only write a record that claims YOUR OWN uid (no
    // impersonating another peer's name/colour). Ephemeral + cosmetic — never the
    // deck content. Reads are any signed-in member of the workspace.
    match /presence/{deckId}/peers/{sessionId} {
      allow read:   if request.auth != null;
      allow write:  if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null;
    }
    // Live edit stream (collab): the append-only op log. Signed-in users only, and a
    // batch must be stamped with a `from` session id — so anonymous share-link
    // editors CANNOT inject ops here (they persist via the server /api/shared write,
    // which the Admin SDK does, bypassing rules). Append-only: no updates/deletes.
    match /edits/{deckId}/stream/{batchId} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null && request.resource.data.from is string;
      allow update, delete: if false;
    }
    // Access requests (external sign-ups awaiting admin approval): a signed-in user
    // may create/refresh ONLY their own pending request (uid == doc id) and read
    // their own status; the DECISION (status/role) is written server-side (Admin SDK,
    // /api/admin/requests) — so a requester can't self-approve or read the queue.
    match /accessRequests/{uid} {
      allow read:   if isAdmin() || (request.auth != null && request.auth.uid == uid);
      allow create: if request.auth != null && request.auth.uid == uid
                       && request.resource.data.status == 'pending';
      allow update, delete: if false; // approve/deny is Admin-SDK only
    }
    // Runtime allow-list (the addresses admins approve, extending the env seed):
    // written + read ONLY server-side by the gate/console (Admin SDK bypasses rules).
    match /config/{docId} {
      allow read, write: if false;
    }
    // Per-generation audit log: written by the gated generate/design routes and read
    // by the admin console, ONLY server-side (Admin SDK). Never client-accessible —
    // it carries account emails. A Firestore TTL policy on `ts` is recommended so
    // rows auto-reap (e.g. 90 days).
    match /auditLog/{id} {
      allow read, write: if false;
    }
  }
}
```
> **Anonymous share-link editors** never touch these collections from the client
> (the rules require auth). They collaborate live through the token-authorized relay
> `POST /api/shared/live` (Admin SDK), which reads/writes the SAME
> `presence/{deckId}/peers` + `edits/{deckId}/stream` docs on their behalf after
> verifying the share token grants edit — so a guest and the signed-in owner/members
> share one room. Their presence records are stamped `anon:true`; the client short-
> polls the relay (adaptive, visibility-gated cadence) instead of `onSnapshot`. No
> rule change is needed for anonymous editors — the relay is the only writer for them.
>
> Baseline for a trusted workspace: any signed-in member can read/write presence
> and edits. To lock collaboration to a specific deck's members, AND in a check
> that the deck is actually shared, e.g. `exists(/databases/$(database)/documents/shares/$(deckId))`,
> and consider a **TTL policy** on the `edits/{deckId}/stream` collection (on the
> `ts` field) so the op log auto-reaps instead of growing unbounded.
Roles ride as a `role` custom claim (`viewer`/`editor`/`admin`) set via
`POST /api/admin/role`. **Bootstrap the first admin is AUTOMATIC:** set
`BOOTSTRAP_ADMIN_UID` to your uid (Production env) → redeploy → sign in. The app
pings `POST /api/admin/bootstrap` once after sign-in; the server promotes ONLY the
account whose verified uid matches `BOOTSTRAP_ADMIN_UID` (a no-op for everyone
else), then refreshes your token so **⚙ Admin** appears — no console snippet, no
manual sign-out/in. Once you're set, **remove `BOOTSTRAP_ADMIN_UID`** to close the
escape (all further admins are assigned from the console UI). **Every non-admin
account is capped at a preset default of `DEFAULT_MONTHLY_LIMIT` = 75 generations
per month** unless an admin sets a per-account value at `users/{uid}.limits.monthly`
(an explicit `0` = unlimited; admins are always unlimited). Enforced server-side on
`/api/generate` (429 when reached); the admin console shows each account's effective
cap.

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

**Sign-in domain lock (default `@loathr.com`).** Access is restricted to one or
more email domains — **`loathr.com` by default**, so a configured deploy is locked
to `@loathr.com` with no extra setup. An outside Google account can still *sign in*
(a bare Firebase session grants nothing) but is **not allowed**: it's rejected with
**403** on every gated API route (`emailAllowed` in `authCore.js`) and the app routes
it to the **request-access screen** instead of the editor (see below). To change or
widen the domain lock:
| Var | Value |
| --- | --- |
| `ALLOWED_EMAIL_DOMAINS` (server) | comma list, e.g. `loathr.com,acme.io` — or `*` to allow any signed-in account |

Leave unset to keep the `@loathr.com` default. (The old `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`
client mirror is no longer needed — the client no longer decides access; the server
does, via `/api/access/status`.)

**Allow SELECT outside accounts (e.g. specific Gmail addresses).** `gmail.com` is
public, so never add it to the domain list. Instead allow individual addresses on
top of the domain lock:
| Var | Value |
| --- | --- |
| `ALLOWED_EMAILS` (server) | comma list of exact addresses, e.g. `jane@gmail.com,bob@acme.io` |
An address passes if it's individually listed OR its domain is allowed. Gmail is
matched **dot/plus-insensitive** (`jane.doe+news@gmail.com` == `janedoe@gmail.com`),
so an allow-listed Gmail can't be dodged or duplicated with dotted aliases. `ALLOWED_EMAILS`
is the **bootstrap seed**; admins add more addresses at runtime by approving requests
(persisted in Firestore `config/allowlist`, merged with the env seed at the gate).

**Request access + admin approval.** An allowed account enters straight away. Any
other signed-in account lands on a **Request access** screen (optional note). The
request is stored at `accessRequests/{uid}` (server-side; a requester can only create
their own pending doc). Admins review it in the console's **Requests** tab and
**Approve** (adds the email to the allow-list + sets a role) or **Deny**. On the
requester's next check, `/api/access/status` reports `approved` / `pending` / `denied`.
Approval grants sign-in + a role only — **member-vs-guest still follows the email
domain**, so an approved external account is a *guest* (9/mo, client branding, never
the loathr team). Routes: `POST /api/access/request`, `GET /api/access/status`,
`GET|POST /api/admin/requests`.

Defense in depth (optional): mirror it in the Firestore rules so storage is locked
too — add a helper and require it on the user/deck/pulse writes:
```
function loathr() { return request.auth != null &&
  request.auth.token.email.matches('.*@loathr[.]com$'); }
// then AND `loathr()` into the allow read/write conditions under users/{uid}/…
```

## 7. Deploy & verify
1. Redeploy on Vercel so the env vars bake in.
2. Open `/studio` → you should see **Continue with Google** → sign in.
3. Create a deck, edit, **refresh** — it should reload from your account.
4. Sign out / open in another Google account → you must NOT see the first
   account's decks (confirms the security rules).
5. `/api/generate` without a session should 401 (server gate on).

## 8. Google Drive export (optional)
The Download menu's **Save all to Google Drive** renders each slide to PNG and
uploads them into a deck-named folder in the signed-in user's Drive. It reuses the
existing Firebase Google sign-in (no server, no new API key) — it just needs the
Drive API turned on and the scope consented:
1. **Google Cloud console → APIs & Services → Library →** enable **Google Drive API**
   for the same project backing Firebase.
2. **OAuth consent screen → Scopes →** add `.../auth/drive.file` (the minimal
   per-file scope — the app only ever sees files it creates, never the rest of the
   user's Drive). While the consent screen is in *testing*, add the users who'll
   export as test users.
3. No env var. On first export the user gets a Google popup for the Drive scope;
   after granting, the deck's PNGs upload and a **↗ Open Drive folder** link appears.

The menu item is hidden unless cloud is configured and a user is signed in, so
with Firebase disabled nothing changes.

## Rollback
Remove the `NEXT_PUBLIC_FIREBASE_*` vars and redeploy — the gate and cloud calls
go dormant and the app returns to the open, local-only flow. No data migration.
The `sharePulse` rule and Drive scope are inert without the client config.
