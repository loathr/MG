"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// The marketing-site shell: sticky nav, footer, and the "experiential" layer
// (custom cursor, movable Spotify music pill, scroll-reveal). Everything is scoped
// under `.site` so it never touches the Studio's styles. Ported from the approved
// v13 concept mock, with the SPA view-switcher replaced by real Next routes.
const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/work", label: "Our Work" },
  { href: "/insights", label: "Insights" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/contact", label: "Contact" },
];

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const curRef = useRef(null);
  const dotRef = useRef(null);
  const mpRef = useRef(null);

  // Share links are a Studio capability (`?deck=&s=`). The Studio lives at /studio
  // now, so if one lands on the marketing root, forward it (token preserved).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (pathname === "/" && p.get("deck") && p.get("s")) {
      router.replace(`/studio${window.location.search}`);
    }
  }, [pathname, router]);

  // Custom cursor: a subtle dot at rest; a ring + label fades in on hover targets.
  useEffect(() => {
    const cur = curRef.current, dot = dotRef.current;
    if (!cur || !dot || window.matchMedia("(pointer:coarse)").matches) return;
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, raf;
    dot.style.left = mx + "px"; dot.style.top = my + "px";
    const move = (e) => { mx = e.clientX; my = e.clientY; dot.style.left = mx + "px"; dot.style.top = my + "px"; };
    const loop = () => { cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18; cur.style.left = cx + "px"; cur.style.top = cy + "px"; raf = requestAnimationFrame(loop); };
    addEventListener("mousemove", move); loop();
    return () => { removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  });

  // Hover binding + scroll-reveal: re-run whenever the route changes.
  useEffect(() => {
    const cur = curRef.current;
    const enter = (e) => {
      if (!cur) return;
      cur.classList.add("big");
      const l = e.currentTarget.getAttribute("data-label");
      if (l) { cur.classList.add("text"); cur.setAttribute("data-label", l); }
    };
    const leave = () => cur && cur.classList.remove("big", "text");
    const els = document.querySelectorAll(".site a,.site button,.site [data-cursor],.site .wcard,.site .pill,.site .post,.site .issue,.site .q");
    els.forEach((el) => { el.addEventListener("mouseenter", enter); el.addEventListener("mouseleave", leave); });

    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: 0.12 });
    document.querySelectorAll(".site .reveal:not(.in)").forEach((el) => io.observe(el));
    // anything already in view on load
    requestAnimationFrame(() => document.querySelectorAll(".site .reveal").forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }));

    return () => { els.forEach((el) => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); }); io.disconnect(); };
  }, [pathname]);

  // Solidify nav on scroll.
  useEffect(() => {
    const nav = document.getElementById("siteNav");
    const onScroll = () => nav && nav.classList.toggle("solid", scrollY > 40);
    addEventListener("scroll", onScroll); onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // Music: housed pill that expands into a movable Spotify player, snaps home on close.
  useEffect(() => {
    const mp = mpRef.current;
    if (!mp) return;
    let sideOpen = false, drag = null;
    const btn = document.getElementById("siteMusicBtn");
    const setMusic = (on) => {
      sideOpen = on; mp.classList.toggle("open", on);
      if (btn) btn.classList.toggle("on", on);
      if (!on) { mp.style.left = mp.style.top = mp.style.right = mp.style.bottom = ""; }
    };
    const house = mp.querySelector(".house");
    const close = mp.querySelector(".close");
    const onHouse = () => setMusic(true);
    const onClose = () => setMusic(false);
    const onBtn = () => setMusic(!sideOpen);
    house && house.addEventListener("click", onHouse);
    close && close.addEventListener("click", onClose);
    btn && btn.addEventListener("click", onBtn);
    const down = (e) => {
      if (!mp.classList.contains("open") || !e.target.closest(".grip")) return;
      e.preventDefault();
      const r = mp.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      mp.style.left = r.left + "px"; mp.style.top = r.top + "px"; mp.style.right = "auto"; mp.style.bottom = "auto";
      mp.classList.add("dragging");
    };
    const moveD = (e) => {
      if (!drag) return;
      const x = Math.max(6, Math.min(innerWidth - mp.offsetWidth - 6, e.clientX - drag.dx));
      const y = Math.max(6, Math.min(innerHeight - mp.offsetHeight - 6, e.clientY - drag.dy));
      mp.style.left = x + "px"; mp.style.top = y + "px";
    };
    const up = () => { if (drag) { drag = null; mp.classList.remove("dragging"); } };
    mp.addEventListener("mousedown", down); addEventListener("mousemove", moveD); addEventListener("mouseup", up);
    mp.classList.add("ready");
    return () => {
      house && house.removeEventListener("click", onHouse);
      close && close.removeEventListener("click", onClose);
      btn && btn.removeEventListener("click", onBtn);
      mp.removeEventListener("mousedown", down); removeEventListener("mousemove", moveD); removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <div className="site">
      <div id="cur" ref={curRef} /><div id="curDot" ref={dotRef} />

      <nav id="siteNav">
        <Link className="logo" href="/">LOATHR</Link>
        <div className="navlinks">
          {NAV.filter((n) => n.href !== "/").map((n) => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>{n.label}</Link>
          ))}
          <Link className="navcta" href="/contact" data-cursor="Let's talk" data-label="→">Get Started</Link>
          <button className="music" id="siteMusicBtn" title="Music" data-cursor="Music" data-label="♪">
            <span className="eq"><i /><i /><i /><i /></span>
          </button>
        </div>
      </nav>

      <main>{children}</main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <div>
              <span className="logo" style={{ fontSize: 24 }}>LOATHR</span>
              <p className="lead">A strategy-led creative consultancy. From concept to completion.</p>
            </div>
            <div className="fcols">
              <div className="fcol"><b>Explore</b><Link href="/about">About</Link><Link href="/what-we-do">What We Do</Link><Link href="/work">Our Work</Link><Link href="/insights">Insights</Link></div>
              <div className="fcol"><b>Pillars</b><Link href="/what-we-do">Strategy</Link><Link href="/what-we-do">Creative · Studios</Link><Link href="/what-we-do">Growth</Link></div>
              <div className="fcol"><b>Connect</b><Link href="/newsletter">Newsletter</Link><Link href="/contact">Contact</Link><Link href="/studio">Studio</Link></div>
            </div>
          </div>
          <div className="fine"><span>© 2026 Loathr</span><span className="mono">Black &amp; white · red accent</span></div>
        </div>
      </footer>

      {/* movable Spotify music pill */}
      <div id="mp" ref={mpRef}>
        <button className="house" data-cursor="Play" data-label="♪">
          <span className="cue" /><span className="eq"><i /><i /><i /><i /></span><span className="lbl">Loathr Radio</span>
        </button>
        <div className="player">
          <span className="grip" data-cursor="Move" data-label="⠿"><i /><i /><i /></span>
          <iframe title="Loathr Radio" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            src="https://open.spotify.com/embed/playlist/1SvWV3KHDI0GDU239ErQFL?utm_source=generator&theme=0" />
          <button className="close" data-cursor="Close" data-label="×">×</button>
        </div>
      </div>
    </div>
  );
}
