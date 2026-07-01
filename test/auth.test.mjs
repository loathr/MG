// Unit checks for app/api/authCore.js — the pure server-auth helpers. The actual
// token verification (firebase-admin) is deploy-only; here we cover the gate
// decision + header parsing.
import test from "node:test";
import assert from "node:assert/strict";
import { parseBearer, adminCredentials, authGateEnabled, isBootstrapAdmin, allowedEmailDomains, emailAllowed } from "../app/api/authCore.js";

test("allowedEmailDomains: defaults to loathr.com; env overrides (comma list, strips @)", () => {
  assert.deepEqual(allowedEmailDomains({}), ["loathr.com"]);                                  // default
  assert.deepEqual(allowedEmailDomains({ ALLOWED_EMAIL_DOMAIN: "@Acme.com" }), ["acme.com"]);  // single, lowered, @stripped
  assert.deepEqual(allowedEmailDomains({ ALLOWED_EMAIL_DOMAINS: "loathr.com, acme.io" }), ["loathr.com", "acme.io"]);
  assert.deepEqual(allowedEmailDomains({ ALLOWED_EMAIL_DOMAINS: "" }), ["loathr.com"]);         // empty falls to default
});

test("emailAllowed: only the allowed domain passes; wrong domain / missing @ rejected", () => {
  assert.equal(emailAllowed("sam@loathr.com", {}), true);
  assert.equal(emailAllowed("SAM@LOATHR.COM", {}), true);        // case-insensitive
  assert.equal(emailAllowed("sam@gmail.com", {}), false);
  assert.equal(emailAllowed("notanemail", {}), false);
  assert.equal(emailAllowed("", {}), false);
  assert.equal(emailAllowed("x@acme.io", { ALLOWED_EMAIL_DOMAINS: "acme.io" }), true);
  // the "*" wildcard disables the restriction (any signed-in account allowed)
  assert.deepEqual(allowedEmailDomains({ ALLOWED_EMAIL_DOMAINS: "*" }), []);
  assert.equal(emailAllowed("anyone@gmail.com", { ALLOWED_EMAIL_DOMAINS: "*" }), true);
});

test("isBootstrapAdmin: only the exact BOOTSTRAP_ADMIN_UID matches", () => {
  const env = { BOOTSTRAP_ADMIN_UID: "uid-123" };
  assert.equal(isBootstrapAdmin("uid-123", env), true);
  assert.equal(isBootstrapAdmin("uid-999", env), false);   // wrong uid
  assert.equal(isBootstrapAdmin("", env), false);          // no uid
  assert.equal(isBootstrapAdmin(null, env), false);
  assert.equal(isBootstrapAdmin("uid-123", {}), false);    // env var unset → nobody
});

test("parseBearer extracts the token (case/space tolerant); null otherwise", () => {
  assert.equal(parseBearer("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(parseBearer("bearer   tok"), "tok");
  assert.equal(parseBearer("Basic xyz"), null);
  assert.equal(parseBearer(""), null);
  assert.equal(parseBearer(null), null);
});

test("auth gate is OFF without admin creds (open); ON with the trio or a JSON blob", () => {
  // No creds → gate off → requests pass (today's open behaviour).
  assert.equal(authGateEnabled({}), false);
  assert.equal(adminCredentials({}), null);
  // Split trio → on; the literal "\n" in the private key is normalised.
  const trio = { FIREBASE_PROJECT_ID: "p", FIREBASE_CLIENT_EMAIL: "e@x", FIREBASE_PRIVATE_KEY: "line1\\nline2" };
  assert.equal(authGateEnabled(trio), true);
  assert.equal(adminCredentials(trio).privateKey, "line1\nline2");
  // JSON service account → on.
  const json = { FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ project_id: "p", client_email: "e" }) };
  assert.equal(authGateEnabled(json), true);
  assert.equal(adminCredentials(json).project_id, "p");
  // Malformed JSON → null (gate off, not a crash).
  assert.equal(adminCredentials({ FIREBASE_SERVICE_ACCOUNT: "{bad" }), null);
});
