import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorWindow from "./studio/ErrorWindow";

// Installed as a RAW inline <script> at the top of <head> so it runs before any app
// module evaluates — the only way to catch a module-load / import-time crash (which
// throws before React mounts, otherwise a blank white screen) and unhandled promise
// rejections. It buffers what it catches into window.__STUDIO_ERRORS__, dispatches a
// "studio-error" event the ErrorWindow overlay listens for, and — only if the whole
// bundle failed so React never mounted the overlay — draws its own bare-DOM panel.
// Mirrors app/studio/errtrap.js (fromErrorEvent / fromRejection), kept in sync.
const ERR_TRAP = `(function(){
  if (window.__STUDIO_ERRTRAP__) return; window.__STUDIO_ERRTRAP__ = 1;
  var errs = (window.__STUDIO_ERRORS__ = window.__STUDIO_ERRORS__ || []); var seen = {};
  function key(r){ return r.kind + "|" + r.message + "|" + r.source; }
  function fromError(e){
    var t = e && e.target;
    if (t && t !== window && (t.src || t.href)) { var u = t.src || t.href; return { kind:"load", message:"Failed to load resource: "+u, source:u, stack:"" }; }
    var err = e && e.error;
    return { kind:"error", message:(err&&err.message)||(e&&e.message)||"Uncaught error", source:(e&&e.filename)?(e.filename+":"+(e.lineno||0)+":"+(e.colno||0)):"", stack:(err&&err.stack)||"" };
  }
  function fromRej(e){ var r = e && e.reason; var m = (r && typeof r==="object") ? r.message : (typeof r==="string"?r:""); return { kind:"rejection", message:m||"Unhandled promise rejection", source:"", stack:(r&&r.stack)||"" }; }
  function push(rec){ var k = key(rec); if (seen[k]) return; seen[k]=1; errs.push(rec); try { window.dispatchEvent(new CustomEvent("studio-error")); } catch(_){} schedule(); }
  window.addEventListener("error", function(e){ push(fromError(e)); }, true);
  window.addEventListener("unhandledrejection", function(e){ push(fromRej(e)); });
  var timer = null;
  function schedule(){ if (timer) return; timer = setTimeout(function(){ timer=null; if(!window.__STUDIO_ERR_MOUNTED__) draw(); }, 1500); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
  function draw(){
    var box = document.getElementById("studio-errtrap-fallback");
    if (!box){ box = document.createElement("div"); box.id="studio-errtrap-fallback"; (document.body||document.documentElement).appendChild(box); }
    box.setAttribute("style","position:fixed;inset:0;z-index:2147483647;overflow:auto;padding:24px;font-family:Helvetica,Arial,sans-serif;color:#eaeaea;background:radial-gradient(1100px 600px at 50% -10%,#140f0f 0%,#080707 55%,#000 100%);");
    var items = errs.map(function(r){
      return '<div style="border:1px solid #23232b;border-radius:10px;padding:14px 15px;margin-bottom:12px;background:#0b0b0e">'
        + '<div style="font-size:11px;color:#7d7d85;font-family:monospace;margin-bottom:8px">'+esc(r.kind)+(r.source?' · '+esc(r.source):'')+'</div>'
        + '<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;color:#ff9a8a;background:#181113;border:1px solid #3a2323;border-radius:8px;padding:10px 12px;margin:0">'+esc(r.message)+'</pre>'
        + (r.stack?'<pre style="white-space:pre-wrap;word-break:break-word;font-size:11.5px;line-height:1.5;color:#c9c9d2;background:#101014;border:1px solid #23232b;border-radius:8px;padding:10px 12px;margin:8px 0 0;max-height:180px;overflow:auto;font-family:monospace">'+esc(r.stack)+'</pre>':'')
        + '</div>';
    }).join("");
    box.innerHTML = '<div style="max-width:680px;margin:0 auto;background:#0d0d10;border:1px solid #3a2323;border-radius:14px;padding:26px 28px;box-sizing:border-box">'
      + '<div style="font-size:17px;font-weight:700;margin-bottom:6px">The app failed to load</div>'
      + '<div style="font-size:12.5px;color:#a9a9b2;line-height:1.5;margin-bottom:16px">A script errored before the app could start. Copy the detail below (or open DevTools \\u2192 Console) and send it over.</div>'
      + items
      + '<div style="margin-top:18px"><button onclick="location.reload()" style="height:40px;padding:0 18px;background:#fff;color:#1f1f1f;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer">Reload</button></div>';
  }
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "loathrdotcom",
  description: "loathrdotcom — AI carousel studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* A RAW inline <script> (not next/script, which queues into __next_s and runs
            later): it executes SYNCHRONOUSLY at this parse position — before the studio
            app modules hydrate/execute — so it's listening in time to catch an
            import-time crash. Placed first in <head>. */}
        <script dangerouslySetInnerHTML={{ __html: ERR_TRAP }} />
        <link rel="preload" href="/Fonts/CourierPrime/CourierPrime-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/CourierPrime/CourierPrime-Bold.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/Foun/OpenType-TT/Foun.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/Wenssep/Wenssep.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/Maheni/Maheni-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/otilito-sans-font-family-2026-04-07-06-24-36-utc/OTF/TBJOtilito-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/qogee-font-2026-04-07-06-00-04-utc/Qogee.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/Matina/Font/Matina-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/FONT/QUICK-ZIP.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/GRAND%20HALVA.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/carbon-modern-typeface-webfonts-2026-04-07-06-00-24-utc/fonts/CarbonText-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/medhorn-modern-sport-display-bold-slab-serif-2026-04-07-05-58-49-utc/Web-PS/Medhorn.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/eroded-personal-use/ERODED%20PERSONAL%20USE.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/vintage-typist/VintageTypist.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/bramos/Bramos.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/the-cheelaved/TheCheelaved-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/reality-stone-personal-use/Reality%20Stone.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/Fonts/News%20Deck/crown-heritage/CrownHeritage.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body>
        <ErrorWindow />
        {children}
      </body>
    </html>
  );
}
