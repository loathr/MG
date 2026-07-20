// Unit checks for app/studio/imgproxy.js — the SSRF allow/deny logic + proxy URL,
// shared by the export renderer and the /api/img route.
import test from "node:test";
import assert from "node:assert/strict";
import { isProxyableImageUrl, proxyImageUrl } from "../app/studio/imgproxy.js";

test("allows public http(s) image hosts", () => {
  assert.equal(isProxyableImageUrl("https://upload.wikimedia.org/x/y.jpg"), true);
  assert.equal(isProxyableImageUrl("https://images.unsplash.com/photo-1"), true);
  assert.equal(isProxyableImageUrl("http://example.com/a.png"), true);
});

test("rejects non-http schemes (data/blob never need proxying)", () => {
  assert.equal(isProxyableImageUrl("data:image/png;base64,AAAA"), false);
  assert.equal(isProxyableImageUrl("blob:https://app/123"), false);
  assert.equal(isProxyableImageUrl("file:///etc/passwd"), false);
});

test("blocks loopback / private / link-local / metadata (SSRF)", () => {
  for (const bad of [
    "http://localhost/x", "http://127.0.0.1/x", "http://0.0.0.0/x",
    "http://10.0.0.5/x", "http://192.168.1.1/x", "http://172.16.0.1/x", "http://172.31.255.1/x",
    "http://169.254.169.254/latest/meta-data", "http://[::1]/x", "https://foo.internal/x", "https://db.local/x",
  ]) {
    assert.equal(isProxyableImageUrl(bad), false, bad + " should be blocked");
  }
});

test("allows a public 172.x that is NOT in the private 16-31 block", () => {
  assert.equal(isProxyableImageUrl("http://172.32.0.1/x"), true);
  assert.equal(isProxyableImageUrl("http://172.15.0.1/x"), true);
});

test("garbage / empty input is rejected, not thrown", () => {
  assert.equal(isProxyableImageUrl(""), false);
  assert.equal(isProxyableImageUrl("not a url"), false);
  assert.equal(isProxyableImageUrl(null), false);
  assert.equal(isProxyableImageUrl(undefined), false);
});

test("proxyImageUrl encodes the target", () => {
  assert.equal(proxyImageUrl("https://a.com/x y.jpg?q=1&z=2"), "/api/img?u=https%3A%2F%2Fa.com%2Fx%20y.jpg%3Fq%3D1%26z%3D2");
});
