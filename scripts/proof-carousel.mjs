// ============================================================================
// CRASH-SAFETY PROOF (STUDIO_REBUILD §3 / §11.2)
//
// The old monolith crashed reproducibly on ~the 3rd/4th slide of a photo deck:
// each slide stacked another full-resolution decoded image (+ composited layers)
// into native/GPU memory until the OS killed the tab. The rebuild's rule is that
// ONLY the current slide renders its heavy background decode; off-screen slides
// live in the strip as lightweight thumbnails.
//
// This script drives a REAL Chromium through a 9-slide photo carousel, visiting
// every slide, and asserts:
//   1. the renderer never crashes and no page error is thrown,
//   2. at every slide exactly ONE full-resolution background image is mounted
//      (data-role="artboard-bg") — i.e. heavy decodes never accumulate,
//   3. all 9 slides are reachable and show their own photo.
// ============================================================================
import { chromium } from "playwright";

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = process.env.BASE_URL || "http://localhost:3100";
const SHOT_DIR = "/tmp/claude-0/-home-user-MG/44147da1-3191-511f-a376-74bfad603a4e/scratchpad";

function fail(msg) { console.error("✗ " + msg); process.exitCode = 1; }
function ok(msg) { console.log("✓ " + msg); }

const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

let crashed = false;
const pageErrors = [];
page.on("crash", () => { crashed = true; });
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => {
  // Only count real JS errors. Unrelated network/resource load failures (e.g. a
  // dev cert warning, favicon) are not renderer faults and don't bear on §3.
  if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) {
    pageErrors.push("console: " + m.text());
  }
});

try {
  await page.goto(BASE + "/studio?demo=photos9", { waitUntil: "networkidle", timeout: 30000 });

  // Wait for the first slide's heavy background to actually decode.
  await page.waitForSelector('[data-role="artboard-bg"]', { timeout: 15000 });

  // Sanity: the strip rendered 9 lightweight thumbnails.
  const thumbCount = await page.locator('[data-role="thumb-bg"]').count();
  if (thumbCount === 9) ok("slide strip rendered 9 lightweight thumbnails");
  else fail("expected 9 strip thumbnails, got " + thumbCount);

  const visited = [];
  let maxHeavyAtOnce = 0;

  for (let i = 0; i < 9; i++) {
    await page.getByTitle("Slide " + (i + 1), { exact: true }).click();

    // Wait until the current artboard background is this slide's photo AND fully decoded.
    await page.waitForFunction((n) => {
      const img = document.querySelector('[data-role="artboard-bg"]');
      return img && img.getAttribute("src") &&
        img.getAttribute("src").includes("/demo/photo-" + n + ".jpg") &&
        img.complete && img.naturalWidth > 0;
    }, i + 1, { timeout: 15000 });

    // INVARIANT: exactly one full-resolution background decode is mounted.
    const heavy = await page.locator('[data-role="artboard-bg"]').count();
    maxHeavyAtOnce = Math.max(maxHeavyAtOnce, heavy);
    if (heavy !== 1) { fail("slide " + (i + 1) + ": expected 1 heavy bg image, found " + heavy); break; }

    if (crashed) { fail("renderer CRASHED while on slide " + (i + 1)); break; }
    visited.push(i + 1);

    if (i === 0 || i === 3 || i === 8) {
      await page.screenshot({ path: SHOT_DIR + "/proof-slide-" + (i + 1) + ".png" });
    }
  }

  // The deck is still alive and responsive after visiting all slides.
  const alive = await page.evaluate(() => document.querySelectorAll('[data-role="artboard-bg"]').length);

  console.log("\n— results —");
  console.log("slides visited:", visited.join(", "));
  console.log("max full-res backgrounds mounted at once:", maxHeavyAtOnce);
  console.log("renderer crashed:", crashed);
  console.log("page errors:", pageErrors.length ? pageErrors : "none");

  if (crashed) fail("renderer crashed during navigation");
  if (pageErrors.length) fail("page/console errors occurred");
  if (visited.length !== 9) fail("did not reach all 9 slides (reached " + visited.length + ")");
  if (maxHeavyAtOnce !== 1) fail("more than one heavy background was mounted at once");
  if (alive !== 1) fail("post-navigation invariant broken (heavy imgs = " + alive + ")");

  if (process.exitCode !== 1) {
    ok("navigated all 9 photo slides; never more than ONE full-res decode; no crash, no errors");
    console.log("\nPROOF PASSED ✅");
  } else {
    console.log("\nPROOF FAILED ❌");
  }
} catch (e) {
  fail("exception: " + (e && e.stack ? e.stack : e));
  console.log("\nPROOF FAILED ❌");
} finally {
  await browser.close();
}
