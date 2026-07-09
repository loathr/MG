// Unit checks for app/api/authCore.js — the pure server-auth helpers. The actual
// token verification (firebase-admin) is deploy-only; here we cover the gate
// decision + header parsing.
import test from "node:test";
import assert from "node:assert/strict";
import { parseBearer, adminCredentials, authGateEnabled, isBootstrapAdmin, allowedEmailDomains, emailAllowed, normalizeEmail, allowedEmails, memberEmailDomains, isMemberEmail } from "../app/api/authCore.js";

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

test("normalizeEmail: gmail dot/plus-insensitive, others lowercased/trimmed", () => {
  assert.equal(normalizeEmail("  JANE.Doe+news@Gmail.com "), "janedoe@gmail.com");
  assert.equal(normalizeEmail("a.b.c@googlemail.com"), "abc@gmail.com");
  assert.equal(normalizeEmail("First.Last@acme.io"), "first.last@acme.io"); // dots kept off-gmail
  assert.equal(normalizeEmail("no-at"), "no-at");
});

test("allowedEmails + emailAllowed: individual accounts pass on top of the domain lock", () => {
  const env = { ALLOWED_EMAILS: "Jane.Doe@gmail.com, bob+x@gmail.com" };
  assert.deepEqual(allowedEmails(env), ["janedoe@gmail.com", "bob@gmail.com"]);
  // domain lock still @loathr.com, but these individual gmail accounts are allowed…
  assert.equal(emailAllowed("janedoe@gmail.com", env), true);
  assert.equal(emailAllowed("jane.doe@gmail.com", env), true); // dot variant → same mailbox
  assert.equal(emailAllowed("bob@gmail.com", env), true);
  assert.equal(emailAllowed("sam@loathr.com", env), true);     // domain still works
  // …but a NON-listed gmail is still rejected (gmail.com never opened wholesale)
  assert.equal(emailAllowed("stranger@gmail.com", env), false);
});

test("memberEmailDomains + isMemberEmail: loathr.com is a member, allowed guests are not", () => {
  assert.deepEqual(memberEmailDomains({}), ["loathr.com"]);                                 // default
  assert.deepEqual(memberEmailDomains({ MEMBER_EMAIL_DOMAINS: "loathr.com, acme.io" }), ["loathr.com", "acme.io"]);
  assert.deepEqual(memberEmailDomains({ MEMBER_EMAIL_DOMAIN: "@Team.co" }), ["team.co"]);   // single, lowered, @stripped
  // a team member (member domain) → true; an external / individually-allowed gmail → false
  assert.equal(isMemberEmail("sam@loathr.com", {}), true);
  assert.equal(isMemberEmail("SAM@LOATHR.COM", {}), true);      // case-insensitive
  assert.equal(isMemberEmail("guest@gmail.com", {}), false);    // allowed guest is NOT a member
  assert.equal(isMemberEmail("notanemail", {}), false);
  assert.equal(isMemberEmail("", {}), false);
  assert.equal(isMemberEmail("x@acme.io", { MEMBER_EMAIL_DOMAINS: "acme.io" }), true);
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
