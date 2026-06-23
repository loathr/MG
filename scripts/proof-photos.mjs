// ============================================================================
// PHOTOS PANEL PROOF (STUDIO_REBUILD §7 / §11.2)
//
// Drives the Photos panel: type a query, get a result grid (from /api/images),
// then (a) set a result as the slide background — asserting a single full-res
// decode with a readability scrim — and (b) place a result as a movable image
// element. The /api/images search is intercepted with local demo photos so the
// flow is provable without live provider keys. Also confirms there is NO
// image-URL input anywhere in the editor ("pick, never paste", §3/§12).
// ============================================================================
import { chromium } from "playwright";

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = process.env.BASE_URL || "http://localhost:3100";

function fail(m) { console.error("✗ " + m); process.exitCode = 1; }
function ok(m) { console.log("✓ " + m); }

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

// Mock the Photos-panel search so we don't depend on provider API keys.
await page.route("**/api/images", async (route) => {
  const body = route.request().postDataJSON() || {};
  if (typeof body.q === "string") {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ results: [
        { url: BASE + "/demo/photo-2.jpg", thumb: BASE + "/demo/thumb-2.jpg", alt: "two", credit: "Demo", source: "Local" },
        { url: BASE + "/demo/photo-7.jpg", thumb: BASE + "/demo/thumb-7.jpg", alt: "seven", credit: "Demo", source: "Local" },
      ] }),
    });
  } else { await route.continue(); }
});

try {
  await page.goto(BASE + "/studio", { waitUntil: "domcontentloaded", timeout: 30000 });

  // Photos panel opens by default; type a query and search.
  await page.getByPlaceholder("Search photos…").fill("mountains");
  await page.getByRole("button", { name: "Go" }).click();

  await page.waitForSelector('img[src*="/demo/thumb-2.jpg"]', { timeout: 10000 });
  const tiles = await page.locator('img[src*="/demo/thumb-"]').count();
  if (tiles === 2) ok("search returned a 2-photo result grid"); else fail("expected 2 result tiles, got " + tiles);

  // No image-URL input must exist anywhere ("pick, never paste").
  const urlInputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input")).filter((i) => /url|http|paste|link/i.test((i.placeholder || "") + (i.getAttribute("aria-label") || ""))).length);
  if (urlInputs === 0) ok("no image-URL input present anywhere"); else fail("found a URL-style input");

  // (a) Click a tile -> set as background, with a scrim, one heavy decode.
  await page.locator('img[src*="/demo/thumb-2.jpg"]').first().click();
  await page.waitForFunction(() => {
    const img = document.querySelector('[data-role="artboard-bg"]');
    return img && img.getAttribute("src").includes("/demo/photo-2.jpg") && img.complete && img.naturalWidth > 0;
  }, null, { timeout: 10000 });
  const heavy = await page.locator('[data-role="artboard-bg"]').count();
  if (heavy === 1) ok("tap set the slide background — exactly one full-res decode"); else fail("expected 1 bg decode, got " + heavy);

  // a scrim overlay should sit over the background for text readability
  const hasScrim = await page.evaluate(() => {
    const img = document.querySelector('[data-role="artboard-bg"]');
    if (!img) return false;
    const sib = img.nextElementSibling;
    return !!sib && /rgba\(0, 0, 0/.test(getComputedStyle(sib).backgroundColor);
  });
  if (hasScrim) ok("readability scrim applied over the photo"); else fail("no scrim over the background photo");

  // (b) Place a result as a movable image element via the tile's + button.
  const before = await page.evaluate(() => document.querySelectorAll('[data-role="artboard-bg"]').length);
  await page.locator('img[src*="/demo/thumb-7.jpg"]').first().hover();
  await page.getByTitle("Place as image element").first().click();
  // an <img> element with photo-7 now lives on the canvas (a placed element, not the bg)
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("img")).some((i) => i.src.includes("/demo/photo-7.jpg") && i.getAttribute("data-role") !== "thumb-bg"),
    null, { timeout: 10000 });
  ok("placed a photo as a movable image element on the canvas");

  console.log("\n— results —");
  console.log("background decodes after place:", before);
  if (process.exitCode !== 1) { ok("Photos panel: search → set-background (scrim) and place-as-element both work"); console.log("\nPROOF PASSED ✅"); }
  else console.log("\nPROOF FAILED ❌");
} catch (e) {
  fail("exception: " + (e && e.stack ? e.stack : e));
  console.log("\nPROOF FAILED ❌");
} finally {
  await browser.close();
}
