// Unit checks for app/studio/categories.js — content voice (orthogonal to the
// visual style) and the per-category caution config.
import test from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES, CATEGORY_LIST, DEFAULT_CATEGORY, getCategory, cautionFor,
} from "../app/studio/categories.js";

test("five categories, editorial default", () => {
  assert.equal(CATEGORY_LIST.length, 5);
  assert.equal(DEFAULT_CATEGORY, "editorial");
});

test("getCategory falls back to editorial for unknown keys", () => {
  assert.equal(getCategory("business").key, "business");
  assert.equal(getCategory("nope").key, "editorial");
});

test("each category has a voice (persona/brief/roles/cta) and a default style", () => {
  for (const c of CATEGORY_LIST) {
    assert.ok(c.persona && c.brief && c.cta);
    assert.ok(Array.isArray(c.roles) && c.roles.length > 0);
    assert.ok(c.defaultStyle);
  }
});

test("category default styles map onto real families", () => {
  assert.equal(CATEGORIES.business.defaultStyle, "enterprise");
  assert.equal(CATEGORIES.news.defaultStyle, "newsdesk");
  assert.equal(CATEGORIES.editorial.defaultStyle, "editorial");
});

test("cautionFor: only business & news carry one; others are null", () => {
  const biz = cautionFor("business");
  assert.ok(biz && biz.default);
  assert.equal(biz.alts.length, 3);
  assert.ok(cautionFor("news"));
  assert.equal(cautionFor("editorial"), null);
  assert.equal(cautionFor("howto"), null);
  assert.equal(cautionFor("story"), null);
  assert.equal(cautionFor("unknown"), null);
});
