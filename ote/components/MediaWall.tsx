"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DISCIPLINES, type Discipline, type Work } from "../lib/content";
import { pack } from "../lib/packing";
import { rng } from "../lib/rng";
import { loadWork, type Frame } from "../lib/media";

type Props = { disciplineSlug?: string };

type Loaded = {
  disc: Discipline;
  index: number; // index within the active set
  frames: Frame[];
  works: Work[];
};

type Panel = {
  c: number;
  r: number;
  w: number;
  h: number;
  d: number; // index into `set`
  mode: "cross" | "scroll" | "ticker";
  off: number;
  speed: number;
  seq: number[]; // indices into that discipline's frames
  flash: number;
  _r?: { x: number; y: number; w: number; h: number };
};

export default function MediaWall({ disciplineSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState<{ name: string; sub: string } | null>(null);
  const [solo, setSolo] = useState(-1);
  const soloRef = useRef(-1);
  soloRef.current = solo;
  const [open, setOpen] = useState<{ title: string; year?: number } | null>(null);

  const single = disciplineSlug
    ? DISCIPLINES.find((d) => d.slug === disciplineSlug)
    : undefined;
  const setKey = disciplineSlug ?? "__all__";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;
    let raf = 0;

    const activeDiscs = single ? [single] : DISCIPLINES;

    // ---- load frames for every work in scope ----
    const load = async () => {
      const set: Loaded[] = await Promise.all(
        activeDiscs.map(async (disc, index) => ({
          disc,
          index,
          works: disc.works,
          frames: await Promise.all(
            disc.works.map((wk) => loadWork(wk, disc.slug, disc.pal, "wall"))
          ),
        }))
      );
      if (!alive) return;
      start(set);
    };

    // ---- geometry ----
    let W = 0,
      H = 0,
      dpr = 1,
      cols = 0,
      rows = 0,
      cw = 0,
      ch = 0;
    let panels: Panel[] = [];
    let scan: CanvasPattern | null = null;

    const buildScan = () => {
      const p = document.createElement("canvas");
      p.width = 1;
      p.height = 3;
      const g = p.getContext("2d")!;
      g.fillStyle = "rgba(0,0,0,.22)";
      g.fillRect(0, 2, 1, 1);
      scan = ctx.createPattern(p, "repeat");
    };

    const layout = (set: Loaded[]) => {
      cols = Math.max(7, Math.min(14, Math.round(W / 150)));
      rows = Math.max(5, Math.min(10, Math.round(H / 150)));
      cw = W / cols;
      ch = H / rows;
      const raw = pack(cols, rows, 7);
      panels = raw.map((cell, i) => {
        const d = single ? 0 : (cell.c * 3 + cell.r * 7 + i) % set.length;
        const pr = rng(i * 13 + 2)();
        const mode: Panel["mode"] =
          pr > 0.88 ? "ticker" : pr > 0.74 ? "scroll" : "cross";
        const n = set[d].frames.length;
        const seq = Array.from({ length: n }, (_, k) => k)
          .sort(() => rng(i * 17 + cell.c)() - 0.5)
          .slice(0, Math.min(4, n));
        return {
          ...cell,
          d,
          mode,
          off: rng(i * 5 + 9)() * 10,
          speed: 0.22 + rng(i * 3 + 1)() * 0.32,
          seq: seq.length ? seq : [0],
          flash: 0,
        };
      });
    };

    const resize = (set: Loaded[]) => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScan();
      layout(set);
    };

    const cover = (img: Frame, x: number, y: number, w: number, h: number) => {
      const s = Math.max(w / img.width, h / img.height);
      const iw = img.width * s,
        ih = img.height * s;
      ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    };
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const start = (set: Loaded[]) => {
      resize(set);
      setReady(true);
      const onResize = () => resize(set);
      addEventListener("resize", onResize);

      let t = 0,
        sweep = 0,
        hover = -1,
        nextBurst = 1.2,
        nextTake = 5.0,
        flashFrame = 0;
      let takeover: { d: number; img: Frame; t0: number; dur: number } | null = null;

      const drawPanel = (p: Panel, x: number, y: number, w: number, h: number) => {
        const L = set[p.d];
        const hue = L.disc.hue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h);

        if (p.mode === "ticker") {
          ctx.fillStyle = `hsl(${hue} 60% 10%)`;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = `hsl(${hue} 85% 68%)`;
          ctx.font = `800 ${Math.min(h * 0.5, 34)}px "Arial Narrow",Arial`;
          ctx.textBaseline = "middle";
          const msg = "  " + L.disc.name.toUpperCase() + "   ·   SELECTED WORK   ·   ";
          const tw = ctx.measureText(msg).width;
          let ox = -((t * 70 + p.off * 200) % tw);
          if (ox > 0) ox -= tw;
          for (let k = -1; k < Math.ceil(w / tw) + 1; k++)
            ctx.fillText(msg, x + ox + k * tw, y + h / 2);
        } else if (p.mode === "scroll") {
          const img = L.frames[p.seq[0]];
          const sc = w / img.width;
          const ih = img.height * sc;
          let oy = -((t * 26 + p.off * 100) % ih);
          if (oy > 0) oy -= ih;
          for (let k = 0; k < Math.ceil(h / ih) + 1; k++)
            ctx.drawImage(img, x, y + oy + k * ih, w, ih);
        } else {
          const spd = p.flash > 0 ? p.speed * 5 : p.speed;
          const cyc = t * spd + p.off;
          const i0 = Math.floor(cyc) % p.seq.length;
          const f = cyc - Math.floor(cyc);
          const a = L.frames[p.seq[i0]];
          const b = L.frames[p.seq[(i0 + 1) % p.seq.length]];
          cover(a, x, y, w, h);
          const af = Math.min(1, Math.max(0, (f - 0.6) / 0.4));
          if (af > 0) {
            ctx.globalAlpha = af;
            cover(b, x, y, w, h);
            ctx.globalAlpha = 1;
          }
        }

        if (p.flash > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = `hsla(${hue} 95% 70% / ${p.flash * 0.6})`;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = `rgba(255,255,255,${p.flash * 0.35})`;
          ctx.fillRect(x, y, w, h);
          ctx.restore();
        }
        const s = soloRef.current;
        const dim =
          s >= 0 && s !== p.d
            ? 0.62
            : hover >= 0 && panels[hover].d !== p.d
            ? 0.22
            : 0;
        if (dim > 0) {
          ctx.fillStyle = `rgba(4,6,12,${dim})`;
          ctx.fillRect(x, y, w, h);
        }
        ctx.fillStyle = `hsla(${hue} 70% 45% / 0.08)`;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      };

      const frame = () => {
        if (!alive) return;
        t += reduced ? 0.004 : 0.016;
        sweep += 0.0016;

        if (!reduced && t > nextBurst) {
          const n = 1 + ((Math.random() * 2) | 0);
          for (let k = 0; k < n; k++) {
            const p = panels[(Math.random() * panels.length) | 0];
            if (p) p.flash = 0.8;
          }
          if (Math.random() > 0.86) flashFrame = 0.4;
          nextBurst = t + 0.7 + Math.random() * 1.1;
        }
        for (const p of panels) if (p.flash > 0) p.flash = Math.max(0, p.flash - 0.045);

        if (!reduced && !takeover && t > nextTake) {
          const d = (Math.random() * set.length) | 0;
          const frames = set[d].frames;
          takeover = {
            d,
            img: frames[(Math.random() * frames.length) | 0],
            t0: t,
            dur: 2.2,
          };
          nextTake = t + 6.5 + Math.random() * 5.5;
        }

        for (const p of panels) {
          const x = p.c * cw,
            y = p.r * ch,
            w = p.w * cw,
            h = p.h * ch;
          drawPanel(p, x, y, w, h);
          p._r = { x, y, w, h };
        }

        if (scan) {
          ctx.fillStyle = scan;
          ctx.fillRect(0, 0, W, H);
        }
        const sx = ((sweep % 1.4) - 0.2) * W;
        const g = ctx.createLinearGradient(sx - 160, 0, sx + 160, H);
        g.addColorStop(0, "rgba(90,209,255,0)");
        g.addColorStop(0.5, "rgba(120,220,255,.06)");
        g.addColorStop(1, "rgba(90,209,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        if (takeover) {
          const L = set[takeover.d];
          const pr = (t - takeover.t0) / takeover.dur;
          if (pr >= 1) {
            takeover = null;
          } else {
            const grow = pr < 0.35 ? easeOut(pr / 0.35) : 1;
            const fade = pr > 0.7 ? 1 - (pr - 0.7) / 0.3 : 1;
            const bw = W * (0.34 + grow * 0.3),
              bh = H * (0.34 + grow * 0.3),
              bx = (W - bw) / 2,
              by = (H - bh) / 2;
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.shadowColor = `hsl(${L.disc.hue} 90% 60%)`;
            ctx.shadowBlur = 60 * fade;
            const sc = Math.max(bw / takeover.img.width, bh / takeover.img.height);
            ctx.beginPath();
            ctx.rect(bx, by, bw, bh);
            ctx.clip();
            ctx.drawImage(
              takeover.img,
              bx + (bw - takeover.img.width * sc) / 2,
              by + (bh - takeover.img.height * sc) / 2,
              takeover.img.width * sc,
              takeover.img.height * sc
            );
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = `hsla(${L.disc.hue} 90% 60% / ${0.15 * fade})`;
            ctx.fillRect(bx, by, bw, bh);
            ctx.restore();
            ctx.strokeStyle = `hsl(${L.disc.hue} 90% 66%)`;
            ctx.lineWidth = 2;
            ctx.globalAlpha = fade;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.globalAlpha = 1;
          }
        }

        if (flashFrame > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = `rgba(150,220,255,${flashFrame * 0.14})`;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
          flashFrame = Math.max(0, flashFrame - 0.08);
        }

        // bezels + hover outline
        ctx.strokeStyle = "rgba(0,0,0,.85)";
        ctx.lineWidth = 2.5;
        for (const p of panels)
          if (p._r) ctx.strokeRect(p._r.x + 1, p._r.y + 1, p._r.w - 2, p._r.h - 2);
        if (hover >= 0 && panels[hover]._r) {
          const rr = panels[hover]._r!;
          const hue = set[panels[hover].d].disc.hue;
          ctx.strokeStyle = `hsl(${hue} 90% 66%)`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = `hsl(${hue} 90% 60%)`;
          ctx.shadowBlur = 18;
          ctx.strokeRect(rr.x + 2, rr.y + 2, rr.w - 4, rr.h - 4);
          ctx.shadowBlur = 0;
        }

        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 0.95);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, "rgba(0,0,0,.35)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);

        raf = requestAnimationFrame(frame);
      };

      // ---- pointer ----
      const hit = (px: number, py: number) => {
        for (let i = 0; i < panels.length; i++) {
          const r = panels[i]._r;
          if (r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
        }
        return -1;
      };
      const onMove = (e: PointerEvent) => {
        hover = hit(e.clientX, e.clientY);
        if (hover >= 0) {
          const p = panels[hover];
          const L = set[p.d];
          setCaption({
            name: L.disc.name,
            sub: `Channel ${String(L.index + 1).padStart(2, "0")} · ${p.mode.toUpperCase()}`,
          });
          canvas.style.cursor = "pointer";
        } else {
          setCaption(null);
          canvas.style.cursor = "default";
        }
      };
      const onClick = (e: PointerEvent) => {
        const i = hit(e.clientX, e.clientY);
        if (i < 0) return;
        const p = panels[i];
        const L = set[p.d];
        if (!single) {
          routerRef.current.push(`/${L.disc.slug}`);
        } else {
          const cyc = t * p.speed + p.off;
          const idx = p.seq[Math.floor(cyc) % p.seq.length];
          const wk = L.works[idx];
          if (wk) setOpen({ title: wk.title, year: wk.year });
        }
      };
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("click", onClick);

      raf = requestAnimationFrame(frame);

      cleanup = () => {
        removeEventListener("resize", onResize);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("click", onClick);
      };
    };

    let cleanup = () => {};
    load();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setKey]);

  return (
    <div className="wall-stage">
      <canvas ref={canvasRef} className="wall-canvas" />
      {!ready && <div className="wall-boot">warming up the wall…</div>}

      {/* hover caption */}
      <div className={`hud cap ${caption ? "show" : ""}`}>
        {caption && (
          <>
            <div className="cap-t grot">{caption.name}</div>
            <div className="cap-s mono">{caption.sub}</div>
          </>
        )}
      </div>

      {/* landing-only legend */}
      {!single && (
        <div className="hud legend">
          {DISCIPLINES.map((d, i) => (
            <button
              key={d.slug}
              className="chip"
              onMouseEnter={() => setSolo(i)}
              onMouseLeave={() => setSolo(-1)}
              onClick={() => router.push(`/${d.slug}`)}
            >
              <i style={{ background: `hsl(${d.hue} 80% 55%)` }} />
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* section-only work overlay (minimal — full detail lands next pass) */}
      {open && (
        <div className="work-overlay" onClick={() => setOpen(null)}>
          <div className="work-card" onClick={(e) => e.stopPropagation()}>
            <div className="work-meta mono">
              {disciplineSlug?.toUpperCase()} {open.year ? `· ${open.year}` : ""}
            </div>
            <div className="work-title grot">{open.title}</div>
            <button className="work-close" onClick={() => setOpen(null)}>
              Close ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
