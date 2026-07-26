"use client";
import React, { useEffect, useRef, useState } from "react";
import WorkGrid from "../work/WorkGrid";
import "./gallery.css";

// Progressive enhancement: server renders the accessible grid; on a capable
// desktop (fine pointer, motion allowed, wide) we upgrade to the immersive
// gallery. Mobile / reduced-motion keep the grid.
export default function GalleryExperience({ projects, cards, hero }) {
  const [immersive, setImmersive] = useState(false);
  useEffect(() => {
    const ok =
      window.matchMedia("(pointer:fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.innerWidth > 900;
    setImmersive(ok);
  }, []);
  return immersive ? <Immersive projects={projects} /> : <Fallback cards={cards} hero={hero} />;
}

function Fallback({ cards, hero }) {
  const h = hero || {};
  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">{h.eyebrow || "Our work"}</div>
        <h1 className="h-hd reveal d1">{h.heading || "We bring your boldest ideas to life."}</h1>
        <p className="lead reveal d2" style={{ marginTop: 22 }}>{h.lead || "Each project tells a story — client, challenge, solution, outcome. Not just a wall of images."}</p>
      </div></section>
      <WorkGrid cards={cards} />
    </>
  );
}

function Immersive({ projects }) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const [gtheme, setGtheme] = useState("light");
  const [book, setBook] = useState({ i: null, phase: "closed" }); // closed|show|lit|open|closing
  const api = useRef({});

  const P = projects;
  const N = P.length;
  const tri = [0, 1, 2];

  // book controls (kept in a ref so the DOM loop can call the latest)
  const open = (i) => {
    setBook({ i, phase: "show" });
    requestAnimationFrame(() => {
      setBook((b) => ({ ...b, phase: "lit" }));
      setTimeout(() => setBook((b) => (b.i === i ? { ...b, phase: "open" } : b)), 140);
    });
  };
  const close = () => {
    setBook((b) => ({ ...b, phase: "closing" }));
    setTimeout(() => setBook({ i: null, phase: "closed" }), 700);
  };
  api.current.open = open;
  api.current.close = close;

  useEffect(() => {
    const root = rootRef.current, track = trackRef.current;
    if (!root || !track) return;
    document.body.setAttribute("data-gallery", "1");

    const cur = root.querySelector(".gcur"), dot = root.querySelector(".gdot"), arw = root.querySelector(".arw");
    const stage = root.querySelector(".stage"), you = root.querySelector(".you"), nav = root.querySelector(".gnav");
    const hint = root.querySelector(".ghint"), curName = root.querySelector(".curName");
    const pieces = [...track.querySelectorAll(".gpiece")];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const SPEED = 17;

    let setW = 0, off = 0, vel = 0, desired = 0, goActive = false;
    let held = false, px = 0, cxp = 0, moved = 0, raf;
    requestAnimationFrame(() => { setW = pieces[N].getBoundingClientRect().left - pieces[0].getBoundingClientRect().left; off = setW; });

    // navigator ticks
    const pad = 4;
    for (let j = 0; j < N; j++) {
      const t = document.createElement("div"); t.className = "tick";
      t.style.left = (pad + ((j + 0.5) / N) * (100 - 2 * pad)) + "%";
      t.addEventListener("click", (ev) => { ev.stopPropagation(); focusWork(j); });
      nav.appendChild(t);
    }
    function focusWork(k) {
      const vc = innerWidth / 2; let best = 1e9, bd = 0;
      pieces.forEach((el) => { if (+el.dataset.i !== k) return; const r = el.getBoundingClientRect(); const d = (r.left + r.width / 2) - vc; if (Math.abs(d) < best) { best = Math.abs(d); bd = d; } });
      desired = off + bd; goActive = true;
    }

    let hintGone = false;
    const fadeHint = () => { if (!hintGone) { hintGone = true; setTimeout(() => hint && hint.classList.add("gone"), 900); } };

    function frame() {
      if (held) { const dx = cxp - px, dead = 10; vel += ((Math.abs(dx) > dead ? clamp(dx / 230, -1, 1) * SPEED : 0) - vel) * 0.12; }
      else if (goActive) { vel += (clamp((desired - off) * 0.045, -SPEED, SPEED) - vel) * 0.18; if (Math.abs(desired - off) < 4) goActive = false; }
      else { vel *= 0.92; }
      off += vel;
      if (setW) { if (off > setW * 2) { off -= setW; desired -= setW; } if (off < 0) { off += setW; desired += setW; } }
      track.style.transform = `translateX(${-off}px)`;
      if (setW && you) you.style.left = (pad + ((((off - setW) % setW) + setW) % setW / setW) * (100 - 2 * pad)) + "%";
      const vc = innerWidth / 2; let best = 1e9, bi = 0;
      pieces.forEach((el) => {
        const r = el.getBoundingClientRect(); const near = Math.abs(r.left + r.width / 2 - vc);
        el.classList.toggle("center", near < innerWidth * 0.2);
        const v = el.querySelector("video");
        if (v) { if (near < innerWidth * 0.26) { if (v.paused) v.play().catch(() => {}); } else if (!v.paused) v.pause(); }
        if (near < best) { best = near; bi = +el.dataset.i; }
      });
      if (curName) curName.textContent = P[bi] ? P[bi].n : "—";
      raf = requestAnimationFrame(frame);
    }
    frame();

    // cursor follow
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, craf;
    const cloop = () => { cx += (mx - cx) * 0.25; cy += (my - cy) * 0.25; if (cur) { cur.style.left = cx + "px"; cur.style.top = cy + "px"; } craf = requestAnimationFrame(cloop); };
    cloop();

    const onWheel = (e) => { vel += clamp(Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, -80, 80) * 0.04; goActive = false; fadeHint(); };
    const onDown = (e) => { held = true; goActive = false; px = cxp = e.clientX; moved = 0; cur && cur.classList.add("pull"); fadeHint(); try { stage.setPointerCapture(e.pointerId); } catch (_) {} };
    const onUp = () => { held = false; cur && cur.classList.remove("pull"); };
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY; if (dot) { dot.style.left = mx + "px"; dot.style.top = my + "px"; }
      if (held) { cxp = e.clientX; moved += Math.abs(e.movementX); if (arw) arw.style.transform = `translate(-50%,-50%) translateX(26px) scaleX(${cxp >= px ? 1 : -1})`; }
    };
    const onKey = (e) => { if (e.key === "ArrowRight") vel += 5; if (e.key === "ArrowLeft") vel -= 5; if (e.key === "Escape") api.current.close(); };
    const onClick = (e) => { if (moved > 10) return; const pc = e.target.closest(".gpiece"); if (pc) { e.stopPropagation(); api.current.open(+pc.dataset.i); } };

    addEventListener("wheel", onWheel, { passive: true });
    stage.addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    addEventListener("pointermove", onMove);
    addEventListener("keydown", onKey);
    stage.addEventListener("click", onClick);

    // hover → big cursor
    const hoverEls = [...root.querySelectorAll("[data-hover]")];
    const enter = (e) => { cur && cur.classList.add("big"); if (cur) cur.textContent = e.currentTarget.getAttribute("data-hover") || ""; };
    const leave = () => { cur && cur.classList.remove("big"); if (cur) cur.textContent = ""; };
    hoverEls.forEach((el) => { el.addEventListener("mouseenter", enter); el.addEventListener("mouseleave", leave); });

    return () => {
      document.body.removeAttribute("data-gallery");
      cancelAnimationFrame(raf); cancelAnimationFrame(craf);
      removeEventListener("wheel", onWheel); removeEventListener("pointerup", onUp);
      removeEventListener("pointermove", onMove); removeEventListener("keydown", onKey);
      stage.removeEventListener("pointerdown", onDown); stage.removeEventListener("click", onClick);
      hoverEls.forEach((el) => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); });
      nav.querySelectorAll(".tick").forEach((t) => t.remove());
    };
  }, [N]);

  const bp = book.i != null ? P[book.i] : null;
  const bookCls = `book${book.phase !== "closed" ? " show" : ""}${book.phase === "lit" || book.phase === "open" ? " lit" : ""}${book.phase === "open" ? " open" : ""}`;

  return (
    <div className="galleryRoot" ref={rootRef} data-gtheme={gtheme}>
      <div className="gbg" />
      <div className="lights" /><div className="floor" /><div className="baseboard" />

      <div className="stage"><div className="track" ref={trackRef}>
        {tri.map((copy) => P.map((p, i) => (
          <div className="gpiece" data-i={i} data-hover="view" key={`${copy}-${i}`}>
            <div className="pool" />
            <div className="frame"><div className="mat"><div className="gmedia">
              {p.vid
                ? (<><video src={p.vid} poster={p.img || undefined} muted loop playsInline preload="none" /><span className="vbadge"><span className="p" />Film</span></>)
                : (p.img ? <img src={p.img} alt={p.n} loading="lazy" /> : null)}
            </div></div></div>
            <div className="glabel"><div className="n">{p.n}</div><div className="m">{p.c}{p.m ? ` — ${p.m}` : ""}</div></div>
            {p.img ? <div className="refl"><img src={p.img} alt="" /></div> : null}
          </div>
        )))}
      </div></div>

      <div className="gui gtop"><div className="eye">Our Work</div><h2>The collection.</h2></div>
      <div className="gui gplate"><div className="g">Now before you</div><b className="curName">—</b></div>
      <button className="gui gtoggle" data-hover="room" onClick={() => setGtheme((t) => (t === "light" ? "dark" : "light"))}>
        <span className="sw" />{gtheme === "light" ? "Dark" : "Light"}
      </button>
      <div className="gnav"><div className="rail" /><div className="you" /></div>
      <div className="gui ghint"><span className="key">hold &amp; pull</span> · scroll · drag &nbsp;—&nbsp; click a work to open</div>

      <div className={bookCls}>
        {bp && (
          <div className="spread">
            <div className="pg left"><div className="inner">
              {bp.vid ? <video src={bp.vid} poster={bp.img || undefined} autoPlay muted loop playsInline /> : (bp.img ? <img src={bp.img} alt="" /> : null)}
            </div></div>
            <div className="pg right"><div className="in">
              <div className="eye">{(bp.c || "").toUpperCase()}</div>
              <h3>{bp.n}</h3>
              <p>{bp.d}</p>
              {bp.slug ? <a className="go" href={`/work/${bp.slug}`} data-hover>View full project →</a> : <button className="go" data-hover>View full project →</button>}
            </div></div>
            <div className="spine" />
            <div className="cover"><img src={bp.img || undefined} alt="" /></div>
          </div>
        )}
      </div>
      <button className={`bclose${book.phase !== "closed" ? " show" : ""}`} onClick={close}>← Back to the room</button>

      <div className="gcur"><span className="arw" /></div><div className="gdot" />
    </div>
  );
}
