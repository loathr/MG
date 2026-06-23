# Studio scripts

Tooling for the LOATHR Studio rebuild (see `docs/STUDIO_REBUILD.md`).

## Demo photos

```
npm run gen:demo-photos
```

Generates 9 distinct demo photos (`public/demo/photo-N.jpg`, full 1280×1600) plus
small strip thumbnails (`thumb-N.jpg`). Used by the crash-safety demo reachable at
`/studio?demo=photos9`.

## Proofs (Playwright E2E)

These drive a **real Chromium** against a running server and assert the
STUDIO_REBUILD §3 crash-safety architecture and the §7 Photos panel behaviour.

```
# 1. build + start the app
npm run build && npm run start            # serves on :3000 (proofs default to :3100)

# 2. in another shell
BASE_URL=http://localhost:3000 npm run proof:carousel
BASE_URL=http://localhost:3000 npm run proof:photos
```

- **proof:carousel** — loads `/studio?demo=photos9`, visits all 9 photo slides
  (the old app died on slide ~3/4), and asserts the renderer never crashes and
  that **exactly one** full-resolution background image is ever mounted
  (`data-role="artboard-bg"`) while off-screen slides stay as lightweight
  thumbnails. This is the crux the old monolith failed.
- **proof:photos** — exercises the Photos panel: search → result grid → set as
  slide background (with readability scrim, one heavy decode) and place as a
  movable image element. Confirms there is no image-URL input anywhere.

In a sandbox without a downloadable browser, point Playwright at a prebuilt
Chromium, e.g. `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; the proof scripts
already pass an explicit `executablePath`.
