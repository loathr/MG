"use client";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { reducer, initStudio, carryBrandKit } from "./store";
import { makeElement, imageBackground, blankDoc, uid, ARTBOARD_W, ARTBOARD_H } from "./model";
import { readFontFile, registerFont, registerDocFonts } from "./fonts";
import { generateCarousel, regenerateCaption } from "./generate";
import { writeElementText } from "./aitext";
import { setShare as buildShare, shareUrl } from "./sharing";
import { photosDemoDoc } from "./demo";
import Artboard from "./Artboard";
import Toolbar from "./Toolbar";
import FormatBar from "./FormatBar";
import SlideThumb from "./SlideThumb";
import StaticSlide from "./StaticSlide";
import ShapeBacking from "./ShapeBacking";
import { UI } from "./theme";
import { SHAPE_VARIANTS, shapeVariant, SHAPE_PAPER, SHAPE_PAPER_INK } from "./shapes";
import PhotosPanel from "./PhotosPanel";
import BrandPanel from "./BrandPanel";
import CaptionPanel from "./CaptionPanel";
import TemplatesPanel from "./TemplatesPanel";
import CreateScreen from "./CreateScreen";
import ProjectsScreen from "./ProjectsScreen";
import AdminConsole from "./AdminConsole";
import { isCloudEnabled } from "./cloud";
import { onAuthChange, signOutCloud, getUserRole, bootstrapAdmin, getIdToken } from "./firebaseClient";
import { saveDeck, loadDeck, listDecks, deleteDeck, watchSharePulse } from "./firebaseStore";
import { exportSlide, exportSlides } from "./export";
import { exportDeckToDrive } from "./driveExport";
import { verifyDeck } from "./verify";
import FactCheckPanel from "./FactCheckPanel";
import CoherencePanel from "./CoherencePanel";
import { checkCoherence } from "./coherence";
import {
  Type, Shapes, Image as ImageIcon, LayoutTemplate, Palette, Captions,
  Undo2, Redo2, RotateCcw, RotateCw, ShieldCheck, Share2, Download,
  ChevronDown, ChevronRight, CornerDownLeft, Eye, Workflow, Copy, Check,
} from "lucide-react";

const hbtn = {
  height: 32, padding: "0 12px", background: UI.surface2, color: UI.text,
  border: "1px solid " + UI.border, borderRadius: 7, cursor: "pointer", fontSize: 12,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
};

// Share-link Copy button that confirms the click: swaps to a green "Copied!" for
// ~1.5s, then reverts. Owns its own copied state so it drops into the inline
// share panel without threading state through Studio.
function ShareCopyButton({ url }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) { /* ignore */ }
  };
  return (
    <button style={copied ? { ...hbtn, background: "#12201a", borderColor: "#2b5a3c", color: "#7be3a0" } : hbtn} onClick={copy} title="Copy the share link">
      {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}
const iconBtn = (enabled) => ({
  ...hbtn, minWidth: 34, padding: "0 9px", lineHeight: 1,
  opacity: enabled ? 1 : 0.4, cursor: enabled ? "pointer" : "default",
});

// Left tool rail (spec §5). Photos is wired; Text/Elements drop pre-styled
// content; Templates/Brand are placeholders for later passes.
const TOOLS = [
  { key: "text", label: "Text", Icon: Type },
  { key: "elements", label: "Elements", Icon: Shapes },
  { key: "photos", label: "Photos", Icon: ImageIcon },
  { key: "templates", label: "Templates", Icon: LayoutTemplate },
  { key: "brand", label: "Brand", Icon: Palette },
  { key: "caption", label: "Caption", Icon: Captions },
];

// Pre-styled text presets for the Text panel (centered when dropped).
const TEXT_PRESETS = {
  heading: { w: ARTBOARD_W - 2 * 80, h: 240, content: "Your heading", fontSize: 84, fontWeight: 700, fontFamily: "Georgia, serif", color: "#ffffff", lineHeight: 1.05 },
  subheading: { w: ARTBOARD_W - 2 * 80, h: 120, content: "A supporting subheading", fontSize: 40, fontWeight: 400, fontFamily: "Georgia, serif", color: "#eaeaea", lineHeight: 1.3 },
  body: { w: ARTBOARD_W - 2 * 80, h: 220, content: "Body text — double-click to edit.", fontSize: 30, fontWeight: 400, fontFamily: "Helvetica, Arial, sans-serif", color: "#e8e8e8", lineHeight: 1.45 },
};

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, initStudio);
  const [screen, setScreen] = useState("create"); // "create" | "editor"
  const [projectName, setProjectName] = useState("Untitled");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [activePanel, setActivePanel] = useState("photos");
  const [dlOpen, setDlOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fc, setFc] = useState(null); // fact check: null | { loading, error, result, phase }
  const [co, setCo] = useState(null); // coherence check: null | { loading, error, result }
  const [genPhase, setGenPhase] = useState(null); // generation progress: null | "searching" | "writing" | "polishing"
  const [textSel, setTextSel] = useState(null); // active text-span selection for per-run styling
  const editApiRef = useRef(null); // imperative style API from the element being edited
  const booted = useRef(false);
  // ---- Cloud (gated by isCloudEnabled; all no-ops when disabled = today's flow).
  const cloud = isCloudEnabled();
  const [user, setUser] = useState(null);          // signed-in Firebase user
  const [role, setRole] = useState(null);          // signed-in user's role claim (admin gate)
  const [projects, setProjects] = useState([]);    // the user's saved decks (list meta)
  const [projectId, setProjectId] = useState(null);// current deck's Firestore id
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"
  const [shareOpen, setShareOpen] = useState(false);  // Share-link popover (Tier A)
  const [sharedView, setSharedView] = useState(null); // opened via a share link: { deck, s, access, name }
  const [adminView, setAdminView] = useState(null);   // admin opened someone's deck read-only: { name, error }
  const [drive, setDrive] = useState(null);           // Drive export status: { phase:"working"|"done"|"error", done, total, folderUrl, count, msg }
  const saveTimer = useRef(null);
  const genAbort = useRef(null); // AbortController for the in-flight generation
  const fcAbort = useRef(null);  // AbortController for the in-flight fact-check
  const coAbort = useRef(null);  // AbortController for the in-flight coherence check
  const dragFrom = useRef(null); // slide index being drag-reordered in the strip
  const slide = state.doc.slides[state.slideIndex];
  const selectedEl = slide && (slide.elements || []).find((e) => e.id === state.selectedId);
  const selectedIsText = !!(selectedEl && selectedEl.type === "text");

  // Optional demo deck for the FLAT-LAYERS image-path proof: ?demo=photos9 jumps
  // straight into the editor. Client-only (avoids SSR mismatch) and runs once.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const params = new URLSearchParams(window.location.search);
    const deck = params.get("deck"), s = params.get("s");
    if (deck && s) {
      // Opened via a share link → resolve it server-side and show the deck
      // read-only + live (Tier A). No sign-in required; the token is the grant.
      setScreen("editor");
      fetch("/api/shared?deck=" + encodeURIComponent(deck) + "&s=" + encodeURIComponent(s))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.doc) {
            dispatch({ type: "loadDoc", doc: data.doc });
            setProjectName(data.name || "Shared carousel");
            setSharedView({ deck, s, access: data.access, name: data.name || "Shared carousel" });
          } else {
            setGenError("This share link is no longer valid.");
          }
        })
        .catch(() => setGenError("Couldn't open the shared link."));
      return;
    }
    if (params.get("demo") === "photos9") {
      dispatch({ type: "loadDoc", doc: photosDemoDoc() });
      setProjectName("Photo demo");
      setScreen("editor");
    } else if (cloud) {
      // Signed-in landing is the Projects screen (the local-only flow opens
      // straight on Create, unchanged).
      setScreen("projects");
    }
  }, [cloud]);

  // Track the signed-in user (cloud only).
  useEffect(() => {
    if (!cloud) return undefined;
    return onAuthChange(setUser);
  }, [cloud]);

  // Resolve the signed-in user's role (drives the admin-console entry). Cleared on
  // sign-out. The admin routes re-check this server-side, so this only gates the UI.
  // First-admin AUTO-BOOTSTRAP: a non-admin sign-in pings the gated
  // /api/admin/bootstrap once — the server promotes only the BOOTSTRAP_ADMIN_UID
  // account (a no-op for everyone else), and on success we force-refresh the token
  // so the ⚙ Admin entry appears without a manual sign-out/in.
  useEffect(() => {
    if (!cloud || !user) { setRole(null); return; }
    let live = true;
    (async () => {
      let r = await getUserRole().catch(() => null);
      if (r !== "admin") {
        const promoted = await bootstrapAdmin().catch(() => false);
        if (promoted) r = (await getUserRole(true).catch(() => null)) || "admin";
      }
      if (live) setRole(r);
    })();
    return () => { live = false; };
  }, [cloud, user]);

  // Live view of a shared deck. REAL-TIME via onSnapshot on the token-less
  // sharePulse/{deckId} doc the owner's save bumps: on each bump we re-fetch the
  // VALIDATED deck through /api/shared (which still checks the token — the pulse
  // itself carries no token or content). A slow interval stays as a fallback for
  // when Firestore/onSnapshot isn't available (cloud off, rules, offline).
  useEffect(() => {
    if (!sharedView) return undefined;
    const refetch = () => {
      fetch("/api/shared?deck=" + encodeURIComponent(sharedView.deck) + "&s=" + encodeURIComponent(sharedView.s))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data && data.doc) dispatch({ type: "loadDoc", doc: data.doc }); })
        .catch(() => {});
    };
    const unsub = watchSharePulse(sharedView.deck, refetch); // instant on owner save
    const id = setInterval(refetch, 20000);                  // fallback safety-net
    return () => { unsub(); clearInterval(id); };
  }, [sharedView]);

  // Load the user's deck list whenever the Projects screen is shown.
  useEffect(() => {
    if (!cloud || !user || screen !== "projects") return;
    let live = true;
    listDecks(user.uid).then((d) => { if (live) setProjects(d || []); });
    return () => { live = false; };
  }, [cloud, user, screen]);

  // Autosave the open deck to Firestore (debounced) while editing. NEVER while
  // viewing a shared link — a watcher must not write the deck into their account.
  useEffect(() => {
    if (!cloud || !user || screen !== "editor" || sharedView) return undefined;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDeck(user.uid, projectId, state.doc, { name: projectName, now: Date.now(), onUploading: () => setSaveState("uploading") })
        .then((id) => { if (id && !projectId) setProjectId(id); setSaveState("saved"); })
        .catch(() => setSaveState("idle"));
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [cloud, user, screen, state.doc, projectName, projectId, sharedView]);

  // Projects-screen handlers (cloud only).
  const openProject = (id) => {
    if (!user) return;
    loadDeck(user.uid, id).then((doc) => {
      if (!doc) return;
      dispatch({ type: "loadDoc", doc });
      setProjectId(id);
      const p = projects.find((x) => x.id === id);
      setProjectName((p && p.name) || "Untitled");
      setScreen("editor");
    });
  };
  const newProject = () => { setProjectId(null); setScreen("create"); };
  const removeProject = (id) => {
    if (!user) return;
    deleteDeck(user.uid, id).then(() => setProjects((ps) => ps.filter((p) => p.id !== id)));
  };
  const backToProjects = () => { setScreen("projects"); setSaveState("idle"); };

  useEffect(() => {
    if (screen !== "editor") return;
    const onKey = (e) => {
      if (state.editingId) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
        return;
      }
      if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        dispatch({ type: "redo" });
        return;
      }
      // Element clipboard: ⌘/Ctrl C copy · X cut · V paste · D duplicate.
      if (meta && (e.key === "c" || e.key === "C") && state.selectedId) {
        e.preventDefault(); dispatch({ type: "copyEl", id: state.selectedId }); return;
      }
      if (meta && (e.key === "x" || e.key === "X") && state.selectedId) {
        e.preventDefault(); dispatch({ type: "cut", id: state.selectedId }); return;
      }
      if (meta && (e.key === "v" || e.key === "V")) {
        e.preventDefault(); dispatch({ type: "paste" }); return;
      }
      if (meta && (e.key === "d" || e.key === "D") && state.selectedId) {
        e.preventDefault(); dispatch({ type: "duplicate", id: state.selectedId }); return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        dispatch({ type: "delete", id: state.selectedId });
      } else if (e.key === "Escape") {
        dispatch({ type: "deselect" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, state.editingId, state.selectedId]);

  // The text-span selection is scoped to one element on one slide — drop it when
  // either changes (clicking away, selecting another element, switching slides).
  useEffect(() => { setTextSel(null); }, [state.selectedId, state.slideIndex]);

  // Per-span styling routes through the editing element's imperative API (which
  // keeps focus + the selection); the optimistic textSel.style update keeps the
  // bar/Inspector toggles in sync before the store round-trips.
  const styleSpan = (patch) => {
    const api = editApiRef.current;
    if (api) {
      // Target the stored selection offsets so styling survives the editor
      // losing focus to a format-bar control (B2 hex field / system picker).
      if (textSel && textSel.end > textSel.start && api.applyStyleAt) api.applyStyleAt(textSel.start, textSel.end, patch);
      else api.applyStyle(patch);
    }
    setTextSel((ts) => (ts ? { ...ts, style: applyPatchToStyle(ts.style, patch) } : ts));
  };
  const clearSpanStyle = () => {
    const api = editApiRef.current;
    if (api) {
      if (textSel && textSel.end > textSel.start && api.clearStyleAt) api.clearStyleAt(textSel.start, textSel.end);
      else api.clearStyle();
    }
    setTextSel((ts) => (ts ? { ...ts, style: null } : ts));
  };
  // The bar's A−/A+ nudges size. With a live span selection it targets JUST that
  // span (a per-run `size`, B3); otherwise the whole element's fontSize.
  const sizeSpan = (delta) => {
    if (!textSel) return;
    const elx = slide && (slide.elements || []).find((e) => e.id === textSel.id);
    if (!elx) return;
    if (textSel.end > textSel.start) {
      // The selection style is the RESOLVED span style, which exposes the effective
      // size as `fontSize` (a raw run uses `size`). Reading `.size` alone always
      // missed it and fell back to the element base, so every nudge jumped from the
      // base instead of accumulating on the span. Prefer the resolved fontSize.
      const cur = (textSel.style && (textSel.style.fontSize || textSel.style.size)) || elx.fontSize || 64;
      styleSpan({ size: Math.max(6, cur + delta) });
    } else {
      dispatch({ type: "update", id: textSel.id, patch: { fontSize: Math.max(6, (elx.fontSize || 0) + delta) } });
    }
  };

  // Register the deck's uploaded fonts with the browser whenever they change (deck
  // load, upload, remove) so the faces render live, in thumbnails, and in export
  // (which awaits document.fonts.ready). Idempotent per family.
  useEffect(() => { registerDocFonts(state.doc.fonts); }, [state.doc.fonts]);

  // Upload a custom font: validate + read the file → register it → embed it in the
  // deck (doc.fonts, so it persists + exports). Returns an error message or null.
  const handleUploadFont = async (file) => {
    try {
      const font = await readFontFile(file, uid("fnt"));
      await registerFont(font);
      dispatch({ type: "addFont", font });
      return null;
    } catch (e) { return (e && e.message) || "Couldn't add that font."; }
  };

  // ✨ Inline AI text — write/replace the SELECTED text box's copy from a preset
  // (Headline/Body/Shorten/…) and/or a free-text instruction, scoped to the deck's
  // topic. Reuses the cheap-utility lane (Haiku, no search). The result lands as a
  // single undoable `update` (⌘Z reverts); throws on failure so the popover can
  // surface it. No-op unless a text element is selected.
  const handleAiWrite = async ({ kind, instruction }) => {
    const elx = selectedEl;
    if (!elx || elx.type !== "text") return;
    const brandShow = (state.doc.brand && state.doc.brand.show) || {};
    const text = await writeElementText({
      kind,
      instruction,
      current: elx.content || "",
      context: {
        topic: projectName && projectName !== "Untitled" ? projectName : "",
        unbranded: !!brandShow.brandless,
      },
    });
    if (!text) throw new Error("The model returned nothing — please try again.");
    dispatch({ type: "update", id: elx.id, patch: { content: text, runs: [] } });
  };

  // Create screen → generate in the chosen style → land in the editor. Capture
  // the current deck before the await so the user's brand kit (custom palette /
  // fonts / wordmark + logo) carries onto the freshly generated deck (§5).
  // The call is cancellable (AbortController) and reports coarse progress
  // (searching → writing); a "quick draft" skips the web search for speed.
  const handleGenerate = async ({ style, category, topic, quickDraft, polish, ground, slides, tone, voice, sourceDoc, route, unbranded }) => {
    if (generating) return;
    const prevDoc = state.doc;
    const ac = new AbortController();
    genAbort.current = ac;
    // Document mode never web-searches (the doc is the source), so it goes straight
    // to "writing"; a topic deck starts on "searching" unless it's a quick draft.
    setGenerating(true); setGenError(""); setGenPhase((quickDraft || sourceDoc) ? "writing" : "searching");
    try {
      const doc = await generateCarousel(topic, {
        style, category, webSearch: !quickDraft, polish, ground, slides, tone, voice, sourceDoc, route, unbranded, signal: ac.signal, onPhase: setGenPhase,
      });
      dispatch({ type: "loadDoc", doc: carryBrandKit(doc, prevDoc) });
      // White-label: strip every LOATHR mark from the freshly generated deck so it
      // renders brand-free from the first frame (the prompt already kept the COPY
      // brand-free; this removes the template chrome marks).
      if (unbranded) dispatch({ type: "setChrome", key: "brandless", on: true });
      setProjectName(topic);
      setScreen("editor");
    } catch (e) {
      // A user-initiated cancel surfaces as an AbortError — stay on the create
      // screen quietly; only real failures show an error.
      if (!(e && (e.name === "AbortError" || /abort/i.test(e.message || "")))) {
        setGenError(e && e.message ? e.message : "Generation failed");
      }
    } finally {
      setGenerating(false);
      setGenPhase(null);
      genAbort.current = null;
    }
  };

  const cancelGenerate = () => { if (genAbort.current) genAbort.current.abort(); };

  const startBlank = () => {
    dispatch({ type: "loadDoc", doc: blankDoc() });
    setProjectName("Untitled");
    setGenError("");
    setScreen("editor");
  };

  const addText = (kind) => {
    const preset = TEXT_PRESETS[kind] || TEXT_PRESETS.heading;
    dispatch({ type: "add", element: makeElement("text", Object.assign({
      x: Math.round((ARTBOARD_W - preset.w) / 2),
      y: Math.round((ARTBOARD_H - preset.h) / 2),
    }, preset)) });
  };
  const addRect = () => dispatch({ type: "add", element: makeElement("rect", {
    x: Math.round((ARTBOARD_W - 300) / 2), y: Math.round((ARTBOARD_H - 200) / 2), w: 300, h: 200,
  }) });
  const addLine = () => dispatch({ type: "add", element: makeElement("line", {
    x: Math.round((ARTBOARD_W - 360) / 2), y: Math.round(ARTBOARD_H / 2), w: 360, h: 6, fill: "#ffffff",
  }) });

  // Tap a shape in the Elements panel: WRAP the selected text element in it, or —
  // when no text is selected — drop a fresh editable text box already wearing it.
  // Either way you get a real, fully-editable text element with a shape backing.
  const wrapOrAddShape = (variantId) => {
    const sel = slide && (slide.elements || []).find((e) => e.id === state.selectedId);
    if (sel && sel.type === "text") { dispatch({ type: "setShape", id: sel.id, shape: variantId }); return; }
    const v = shapeVariant(variantId);
    const accent = (state.doc.brand && state.doc.brand.accent) || "#e23744";
    dispatch({ type: "add", element: makeElement("text", {
      x: Math.round((ARTBOARD_W - v.w) / 2), y: Math.round((ARTBOARD_H - v.h) / 2),
      w: v.w, h: v.h, rotation: v.rotation || 0,
      content: v.text, align: "center", lineHeight: 1.12,
      color: v.paper ? SHAPE_PAPER_INK : (v.knockout ? "#0c0c0c" : "#ffffff"),
      fontFamily: v.font, fontSize: v.size, fontWeight: 700, letterSpacing: v.spacing || 0,
      shape: v.id, shapeFill: v.paper ? SHAPE_PAPER : accent, tailSide: "left",
    }) });
  };

  // Photos panel actions. "Pick, never paste" — no URL entry anywhere.
  const setPhotoBackground = (img) => dispatch({ type: "setBg", patch: imageBackground(img, 0.4) });
  const addPhotoElement = (img) => dispatch({ type: "add", element: makeElement("image", {
    x: Math.round((ARTBOARD_W - 560) / 2), y: Math.round((ARTBOARD_H - 700) / 2),
    w: 560, h: 700, src: img.url, thumb: img.thumb || img.url, fit: "cover",
  }) });

  const exportCurrent = async () => {
    setDlOpen(false); setExporting(true);
    try { await exportSlide(slide, projectName, state.slideIndex); } finally { setExporting(false); }
  };
  const exportDeck = async () => {
    setDlOpen(false); setExporting(true);
    try { await exportSlides(state.doc.slides, projectName, state.doc.caption); } finally { setExporting(false); }
  };
  // Export the deck to the signed-in user's Google Drive (deploy-only: needs the
  // Drive API enabled + the drive.file scope on the OAuth consent screen). Renders
  // each slide to PNG and uploads into a deck-named folder; reports progress and a
  // folder link. Gated on cloud + a signed-in user in the menu below.
  const exportToDrive = async () => {
    setDlOpen(false);
    setDrive({ phase: "working", done: 0, total: state.doc.slides.length });
    try {
      const res = await exportDeckToDrive(state.doc.slides, projectName, state.doc.caption, {
        onProgress: (done, total) => setDrive({ phase: "working", done, total }),
      });
      setDrive({ phase: "done", folderUrl: res.folderUrl, count: res.count });
    } catch (e) {
      setDrive({ phase: "error", msg: (e && e.message) || "Google Drive export failed" });
    }
  };

  // Fact-check: send the deck's claims through a live web-search verify pass and
  // show the per-claim verdict + score in the side panel. Cancellable, and it
  // reports the same searching → writing progress generation does.
  const runFactCheck = async () => {
    setCo(null);
    const ac = new AbortController();
    fcAbort.current = ac;
    setFc({ loading: true, error: "", result: null, phase: "searching" });
    try {
      const result = await verifyDeck(state.doc, {
        category: state.doc.category,
        signal: ac.signal,
        onPhase: (p) => setFc((f) => (f && f.loading ? { ...f, phase: p } : f)),
      });
      setFc({ loading: false, error: "", result, phase: null });
    } catch (e) {
      if (e && (e.name === "AbortError" || /abort/i.test(e.message || ""))) {
        setFc(null); // user cancelled — close the panel
      } else {
        setFc({ loading: false, error: (e && e.message) || "Fact check failed", result: null, phase: null });
      }
    } finally {
      fcAbort.current = null;
    }
  };

  const cancelFactCheck = () => { if (fcAbort.current) fcAbort.current.abort(); };

  // Coherence check: judge the deck's spine / arc / flow (structure, no web search)
  // and show the score + detected spine + per-slide issues. Mutually exclusive with
  // the fact-check panel so the right side never stacks two panels.
  const runCoherence = async () => {
    setFc(null);
    const ac = new AbortController();
    coAbort.current = ac;
    setCo({ loading: true, error: "", result: null });
    try {
      const result = await checkCoherence(state.doc, { signal: ac.signal });
      setCo({ loading: false, error: "", result });
    } catch (e) {
      if (e && (e.name === "AbortError" || /abort/i.test(e.message || ""))) setCo(null);
      else setCo({ loading: false, error: (e && e.message) || "Coherence check failed", result: null });
    } finally {
      coAbort.current = null;
    }
  };
  const cancelCoherence = () => { if (coAbort.current) coAbort.current.abort(); };

  // Apply a coherence fix (rewrite / cut / merge): patch the deck (undoable) and
  // mark the issue resolved, nudging the estimated score up (Re-check re-scores).
  const applyFlowFix = (issue) => {
    dispatch({ type: "applyCoherenceFix", fix: issue.fix });
    setCo((c) => {
      if (!c || !c.result) return c;
      const same = (x) => x.slide === issue.slide && x.kind === issue.kind && x.note === issue.note;
      const issues = c.result.issues.map((x) => (same(x) ? Object.assign({}, x, { applied: true }) : x));
      const score = c.result.score == null ? null : Math.min(10, c.result.score + 1);
      return Object.assign({}, c, { result: Object.assign({}, c.result, { issues, score }) });
    });
  };
  // Apply-all: run cut/merge deletions HIGH-index-first so earlier indices stay
  // valid as slides are removed across the batch.
  const applyAllFlowFixes = (list) => {
    (list || []).slice().sort((a, b) => ((b.fix && b.fix.slide) || 0) - ((a.fix && a.fix.slide) || 0)).forEach(applyFlowFix);
  };

  // Apply a verified fact-check correction: patch the deck (undoable) and mark the
  // claim resolved, nudging the estimated score up (a real re-score needs Re-check).
  const applyCorrection = (claim) => {
    dispatch({ type: "applyCorrection", slide: claim.slide, wrong: claim.wrong, correction: claim.correction });
    setFc((f) => {
      if (!f || !f.result) return f;
      const same = (c) => c.slide === claim.slide && c.wrong === claim.wrong && c.claim === claim.claim;
      const claims = f.result.claims.map((c) => (same(c) ? Object.assign({}, c, { applied: true }) : c));
      const score = f.result.score == null ? null : Math.min(10, f.result.score + 1);
      return Object.assign({}, f, { result: Object.assign({}, f.result, { claims, score }) });
    });
  };
  const applyAllCorrections = (claims) => { (claims || []).forEach(applyCorrection); };

  // Admin: open ANY user's deck read-only. Fetches it through the admin-gated
  // /api/admin/deck (Admin SDK bypasses rules), loads it into the shared read-only
  // viewer. We never persist — screen stays "admin", so autosave (screen==="editor")
  // can't fire and mirror the viewed deck into the admin's own projects.
  const openAdminDeck = async (ownerUid, deckId, fallbackName) => {
    setAdminView({ name: fallbackName || "Carousel", error: null });
    try {
      const token = cloud ? await getIdToken() : null;
      const res = await fetch("/api/admin/deck?uid=" + encodeURIComponent(ownerUid) + "&deck=" + encodeURIComponent(deckId),
        token ? { headers: { Authorization: "Bearer " + token } } : undefined);
      const data = res.ok ? await res.json() : null;
      if (data && data.doc) {
        dispatch({ type: "loadDoc", doc: data.doc });
        setProjectName(data.name || fallbackName || "Carousel");
        setAdminView({ name: data.name || fallbackName || "Carousel", error: null });
      } else {
        setAdminView({ name: fallbackName || "Carousel", error: "Couldn't open that deck — it may have been deleted." });
      }
    } catch (e) {
      setAdminView({ name: fallbackName || "Carousel", error: "Couldn't open that deck." });
    }
  };

  const toggle = (key) => setActivePanel((p) => (p === key ? null : key));

  // Opened via a share link → a read-only, live viewer (no editing surface at
  // all — it renders StaticSlide, the same non-interactive renderer as the strip).
  if (sharedView) {
    return <SharedViewer doc={state.doc} slideIndex={state.slideIndex} name={projectName}
      onNav={(i) => dispatch({ type: "setSlide", index: i })} error={genError} />;
  }

  if (cloud && screen === "admin") {
    // Admin opened another user's deck → the SAME read-only viewer used for share
    // links (StaticSlide, no editing surface), with a Back-to-admin control. We
    // stay on screen "admin" so the editor autosave (gated on screen==="editor")
    // never fires and writes the viewed deck into the admin's own account.
    if (adminView) {
      return <SharedViewer doc={state.doc} slideIndex={state.slideIndex} name={projectName}
        onNav={(i) => dispatch({ type: "setSlide", index: i })} error={adminView.error}
        onBack={() => setAdminView(null)} admin />;
    }
    return <AdminConsole onBack={() => setScreen("projects")} selfUid={user && user.uid}
      nowMs={Date.now()} onOpenDeck={openAdminDeck} />;
  }

  if (cloud && screen === "projects") {
    return (
      <ProjectsScreen
        projects={projects}
        onOpen={openProject}
        onNew={newProject}
        onDelete={removeProject}
        email={(user && (user.email || user.displayName)) || ""}
        onSignOut={() => signOutCloud()}
        isAdmin={role === "admin"}
        onAdmin={() => setScreen("admin")}
        nowMs={Date.now()}
      />
    );
  }

  if (screen === "create") {
    return <CreateScreen onGenerate={handleGenerate} onBlank={startBlank} generating={generating} phase={genPhase} onCancel={cancelGenerate} error={genError} onBack={cloud && user ? backToProjects : null} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: UI.bg, color: UI.text, fontFamily: "Helvetica, Arial, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: UI.surface, borderBottom: "1px solid " + UI.border, flexShrink: 0 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 5, marginRight: 2 }}>
          <span style={{ fontFamily: "'Courier Prime', 'Courier New', monospace", fontWeight: 700, fontSize: 17, letterSpacing: 0.5, color: "#fff" }}>
            L<span style={{ color: UI.brand }}>O</span>ATHR
          </span>
          <span style={{ fontSize: 9, letterSpacing: 2, color: UI.muted, textTransform: "uppercase" }}>studio</span>
        </span>
        <span style={{ width: 1, height: 22, background: UI.border, margin: "0 3px" }} />
        {cloud ? (
          <button style={hbtn} onClick={backToProjects} title="Back to your projects">‹ Projects</button>
        ) : (
          <button style={hbtn} onClick={() => setScreen("create")} title="Back to start">‹ New</button>
        )}
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          title="Project name"
          style={{ width: 230, height: 32, padding: "0 10px", background: "transparent", color: "#fff", border: "1px solid transparent", borderRadius: 6, fontSize: 14, fontWeight: 600 }}
          onFocus={(e) => { e.target.style.border = "1px solid " + UI.border; e.target.style.background = UI.surface2; }}
          onBlur={(e) => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}
        />
        <button style={iconBtn(state.past.length > 0)} disabled={state.past.length === 0} onClick={() => dispatch({ type: "undo" })} title="Undo (Ctrl/Cmd+Z)"><Undo2 size={16} /></button>
        <button style={iconBtn(state.future.length > 0)} disabled={state.future.length === 0} onClick={() => dispatch({ type: "redo" })} title="Redo (Ctrl/Cmd+Shift+Z)"><Redo2 size={16} /></button>
        <button style={iconBtn(true)} onClick={() => dispatch({ type: "resetSlideToBrand" })} title="Reset this slide to the brand look (undoable)"><RotateCcw size={16} /></button>
        <div style={{ flex: 1 }} />
        {cloud ? (
          <span style={{ fontSize: 11, color: saveState === "saved" ? "#7ed09a" : UI.muted, marginRight: 8, display: "inline-flex", alignItems: "center", gap: 5 }}
            title={saveState === "saved" ? "Saved to your account" : "Saving…"}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: saveState === "saved" ? "#7ed09a" : UI.muted }} />
            {saveState === "uploading" ? "Uploading images…" : saveState === "saving" ? "Saving…" : "Saved to cloud"}
          </span>
        ) : null}
        <span style={{ fontSize: 11, color: UI.muted, marginRight: 4 }}>
          {state.doc.slides.length} slide{state.doc.slides.length === 1 ? "" : "s"}
        </span>
        <button
          style={{ ...hbtn, opacity: fc && fc.loading ? 0.6 : 1 }}
          disabled={!!(fc && fc.loading)}
          onClick={runFactCheck}
          title="Fact-check the deck against a live web search"
        >
          {fc && fc.loading ? "Checking…" : <><ShieldCheck size={14} /> Check facts</>}
        </button>
        <button
          style={{ ...hbtn, opacity: co && co.loading ? 0.6 : 1 }}
          disabled={!!(co && co.loading)}
          onClick={runCoherence}
          title="Check the deck's spine, arc, and flow"
        >
          {co && co.loading ? "Reading…" : <><Workflow size={14} /> Check flow</>}
        </button>
        {cloud && user && (
          <div style={{ position: "relative" }}>
            <button style={hbtn} onClick={() => setShareOpen((o) => !o)} title="Share a live link"><Share2 size={14} /> Share</button>
            {shareOpen && (() => {
              const sh = state.doc.share || { link: "none", token: null };
              const url = typeof window !== "undefined" ? shareUrl(window.location.origin, projectId, sh) : null;
              const newToken = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
              const setLevel = (level) => dispatch({ type: "setShare", share: buildShare(sh, level, sh.token ? undefined : newToken()) });
              const rotate = () => dispatch({ type: "setShare", share: buildShare(sh, sh.link === "none" ? "view" : sh.link, newToken()) });
              return (
                <>
                  <div onClick={() => setShareOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{ position: "absolute", right: 0, top: 38, width: 268, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 8, padding: 11, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
                    <div style={{ fontSize: 11, color: UI.muted, marginBottom: 7 }}>Live link sharing</div>
                    {[["none", "Off (only you / your team)"], ["view", "Anyone with the link can view, live"], ["edit", "Anyone with the link can edit"]].map(([lvl, label]) => (
                      <label key={lvl} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "5px 2px", cursor: "pointer" }}>
                        <input type="radio" name="sharelvl" checked={(sh.link || "none") === lvl} onChange={() => setLevel(lvl)} /> {label}
                      </label>
                    ))}
                    {!projectId && <div style={{ fontSize: 11, color: UI.muted, marginTop: 6 }}>Edit anything to save the deck first — then a link appears.</div>}
                    {url && (
                      <>
                        <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                          <input readOnly value={url} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0, height: 30, background: "#1d1d20", border: "1px solid " + UI.border, borderRadius: 6, color: "#ddd", fontSize: 11, padding: "0 8px" }} />
                          <ShareCopyButton url={url} />
                        </div>
                        <button style={{ ...hbtn, marginTop: 7, fontSize: 11 }} onClick={rotate} title="Invalidate the old link and make a new one"><RotateCw size={13} /> Reset link</button>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
        <div style={{ position: "relative" }}>
          <button
            style={{ ...hbtn, background: UI.brand, color: UI.onBrand, border: "none", fontWeight: 700, boxShadow: "0 2px 10px " + UI.brand + "30" }}
            disabled={exporting}
            onClick={() => setDlOpen((o) => !o)}
            title="Download as PNG"
          >
            {exporting ? "Exporting…" : <><Download size={14} /> Download <ChevronDown size={13} style={{ opacity: 0.8, marginLeft: -2 }} /></>}
          </button>
          {dlOpen && (
            <>
              <div onClick={() => setDlOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", right: 0, top: 38, minWidth: 176, background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 8, padding: 4, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
                <button style={menuItem} onClick={exportCurrent}>This slide (PNG)</button>
                <button style={menuItem} onClick={exportDeck}>All {state.doc.slides.length} slides (.zip)</button>
                {cloud && user && (
                  <>
                    <div style={{ height: 1, background: UI.border, margin: "4px 2px" }} />
                    <button style={menuItem} onClick={exportToDrive}>Save all to Google Drive</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left tool rail */}
        <nav style={{ width: 72, flexShrink: 0, display: "flex", flexDirection: "column", gap: 3, padding: "8px 7px", background: UI.rail, borderRight: "1px solid " + UI.border }}>
          {TOOLS.map((t) => {
            const active = activePanel === t.key;
            return (
              <button key={t.key} onClick={() => toggle(t.key)} title={t.label}
                style={{
                  position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  height: 58, borderRadius: 9, cursor: "pointer", fontSize: 10,
                  background: active ? UI.surface2 : "transparent",
                  color: active ? "#fff" : UI.muted,
                  border: "1px solid " + (active ? UI.border : "transparent"),
                }}>
                {active && <span style={{ position: "absolute", left: -7, top: 14, bottom: 14, width: 3, borderRadius: "0 3px 3px 0", background: UI.brand }} />}
                <t.Icon size={20} strokeWidth={1.75} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active panel beside the rail */}
        {activePanel === "photos" && (
          <PhotosPanel onSetBackground={setPhotoBackground} onAddImage={addPhotoElement} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === "text" && (
          <SidePanel title="Text" onClose={() => setActivePanel(null)}>
            <PanelButton onClick={() => addText("heading")}>Add heading</PanelButton>
            <PanelButton onClick={() => addText("subheading")}>Add subheading</PanelButton>
            <PanelButton onClick={() => addText("body")}>Add body text</PanelButton>
          </SidePanel>
        )}
        {activePanel === "elements" && (
          <SidePanel title="Elements" onClose={() => setActivePanel(null)}>
            <Collapsible title="Shapes">
              <PanelButton onClick={addRect}>Rectangle</PanelButton>
              <PanelButton onClick={addLine}>Line / divider</PanelButton>
            </Collapsible>
            <Collapsible title="Bubbles &amp; notes" defaultOpen={false}>
              <div style={{ fontSize: 11, color: selectedIsText ? UI.brand : UI.muted, lineHeight: 1.45, marginBottom: 4 }}>
                {selectedIsText ? <><CornerDownLeft size={12} style={{ verticalAlign: "-2px" }} /> Wraps the selected text.</> : "Tap to drop editable text, or select text first to wrap it."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {SHAPE_VARIANTS.map((v) => (
                  <ShapeTile key={v.id} v={v} accent={(state.doc.brand && state.doc.brand.accent) || UI.brand} wrap={selectedIsText} onPick={wrapOrAddShape} />
                ))}
              </div>
            </Collapsible>
          </SidePanel>
        )}
        {activePanel === "templates" && (
          <TemplatesPanel
            slide={slide}
            brand={state.doc.brand}
            onApply={(layout) => dispatch({ type: "setLayout", layout })}
            onApplyAll={(layout) => dispatch({ type: "setLayout", layout, all: true })}
            onReset={() => dispatch({ type: "resetSlideToBrand" })}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "brand" && (
          <BrandPanel
            brand={state.doc.brand}
            category={state.doc.category}
            family={(state.doc.slides[0] && state.doc.slides[0].style) || "editorial"}
            slideFrame={(slide && slide.frame) || "off"}
            onFamily={(key) => dispatch({ type: "setFamily", family: key })}
            onApply={(prev, next) => dispatch({ type: "applyBrand", prev, brand: next })}
            onLogo={(logo) => dispatch({ type: "setLogo", logo })}
            onCaution={(text) => dispatch({ type: "setCaution", text })}
            onFrame={(frame, all) => dispatch({ type: "setFrame", frame, all })}
            fonts={state.doc.fonts}
            onUploadFont={handleUploadFont}
            onRemoveFont={(id) => dispatch({ type: "removeFont", id })}
            onChrome={(key, on) => dispatch({ type: "setChrome", key, on })}
            onResetAll={() => dispatch({ type: "resetSlideToBrand", all: true })}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "caption" && (
          <CaptionPanel
            caption={state.doc.caption || ""}
            onChange={(text) => dispatch({ type: "setCaption", text })}
            onRegenerate={async () => { const t = await regenerateCaption(state.doc); if (t) dispatch({ type: "setCaption", text: t }); }}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* Canvas column: the contextual toolbar sits directly above the
            artboard/carousel, not across the rail + add-panels (Canva-style). */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Toolbar
            el={selectedEl}
            dispatch={dispatch}
            textSel={textSel}
            spanStyle={textSel ? textSel.style : null}
            onStyleSpan={styleSpan}
            onClearSpan={clearSpanStyle}
            cropping={!!selectedEl && state.croppingId === selectedEl.id}
            siblings={selectedEl && slide ? (slide.elements || []).filter((e) => e.id !== selectedEl.id && !e.locked && e.tetherTo !== selectedEl.id) : []}
            onAiWrite={handleAiWrite}
            canPaste={!!state.clipboard}
          />
          <Artboard
            slide={slide}
            selectedId={state.selectedId}
            editingId={state.editingId}
            croppingId={state.croppingId}
            dispatch={dispatch}
            onTextSelect={setTextSel}
            onEditApi={(api) => { editApiRef.current = api; }}
            canPaste={!!state.clipboard}
          />

          {/* Slide strip — under the canvas only, so the rail + panels run full
              height beside it (FLAT-LAYERS §3 lightweight thumbnails). */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: UI.surface, borderTop: "1px solid " + UI.border, overflowX: "auto", flexShrink: 0 }}>
            {state.doc.slides.map((s, i) => (
              <SlideStripItem
                key={s.id}
                slide={s}
                index={i}
                active={i === state.slideIndex}
                canDelete={state.doc.slides.length > 1}
                dragFrom={dragFrom}
                onSelect={() => dispatch({ type: "setSlide", index: i })}
                onReorder={(from, to) => dispatch({ type: "moveSlide", from, to })}
                onDuplicate={() => dispatch({ type: "duplicateSlide", index: i })}
                onDelete={() => dispatch({ type: "deleteSlide", index: i })}
              />
            ))}
            <button onClick={() => dispatch({ type: "addSlide" })} title="Add slide"
              style={{ width: 60, height: 75, flexShrink: 0, borderRadius: 6, border: "1.5px dashed " + UI.border, background: "transparent", color: UI.muted, cursor: "pointer", fontSize: 22 }}>
              +
            </button>
            <span style={{ marginLeft: 6, fontSize: 11, color: UI.muted, whiteSpace: "nowrap" }}>
              drag thumbnails to reorder · hover a thumbnail to duplicate or delete · ⌘/Ctrl+Z undo
            </span>
          </div>
        </div>

        {fc && (
          <FactCheckPanel
            loading={fc.loading}
            error={fc.error}
            result={fc.result}
            phase={fc.phase}
            doc={state.doc}
            onJump={(i) => dispatch({ type: "setSlide", index: i })}
            onClose={() => setFc(null)}
            onCancel={cancelFactCheck}
            onRetry={runFactCheck}
            onApply={applyCorrection}
            onApplyAll={applyAllCorrections}
          />
        )}

        {co && (
          <CoherencePanel
            loading={co.loading}
            error={co.error}
            result={co.result}
            doc={state.doc}
            onJump={(i) => dispatch({ type: "setSlide", index: i })}
            onClose={() => setCo(null)}
            onCancel={cancelCoherence}
            onRetry={runCoherence}
            onApplyFix={applyFlowFix}
            onApplyAllFixes={applyAllFlowFixes}
          />
        )}

      </div>

      {/* Floating format bar above a live text selection (per-span styling). */}
      {textSel && textSel.rect && textSel.end > textSel.start && (
        <FormatBar
          style={textSel.style}
          accent={(state.doc.brand && state.doc.brand.accent) || UI.brand}
          rect={textSel.rect}
          onStyle={styleSpan}
          onClear={clearSpanStyle}
          onSize={sizeSpan}
        />
      )}

      {/* Google Drive export status toast (deploy-only feature). */}
      {drive && (
        <div style={driveToast}>
          {drive.phase === "working" && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>Saving to Google Drive…</div>
              <div style={{ height: 6, borderRadius: 3, background: "#26262b", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (drive.total ? Math.round((drive.done / drive.total) * 100) : 0) + "%", background: "linear-gradient(90deg,#2684fc,#00ac47)", transition: "width .2s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#9a9aa4", marginTop: 6 }}>Slide {Math.min(drive.done + 1, drive.total)} / {drive.total}</div>
            </>
          )}
          {drive.phase === "done" && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 650, color: "#8fd3a8", marginBottom: 6 }}>✓ Saved {drive.count} slide{drive.count === 1 ? "" : "s"} to Drive</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {drive.folderUrl && <a href={drive.folderUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#9fd0ea", textDecoration: "none" }}>↗ Open Drive folder</a>}
                <button onClick={() => setDrive(null)} style={{ marginLeft: "auto", ...toastX }}>Dismiss</button>
              </div>
            </>
          )}
          {drive.phase === "error" && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 650, color: "#ff9a9a", marginBottom: 4 }}>Drive export failed</div>
              <div style={{ fontSize: 11, color: "#cbb", lineHeight: 1.4 }}>{drive.msg}</div>
              <button onClick={() => setDrive(null)} style={{ marginTop: 8, ...toastX }}>Dismiss</button>
            </>
          )}
        </div>
      )}

    </div>
  );
}

// Fold a style patch into the selection's resolved style, so the bar/Inspector
// reflect a toggle/colour immediately (bold → fontWeight; null clears a key).
function applyPatchToStyle(style, patch) {
  const s = Object.assign({}, style || {});
  for (const k of Object.keys(patch || {})) {
    const v = patch[k];
    if (k === "bold") s.fontWeight = v ? 700 : 400;
    else if (v == null) delete s[k];
    else s[k] = v;
  }
  return s;
}

const panelNote = { color: UI.muted, fontSize: 12, lineHeight: 1.5, margin: 0 };
const menuItem = {
  display: "block", width: "100%", textAlign: "left", height: 32, padding: "0 10px",
  background: "transparent", color: UI.text, border: "none", borderRadius: 6,
  cursor: "pointer", fontSize: 13,
};
const driveToast = {
  position: "fixed", right: 18, bottom: 18, zIndex: 70, width: 260,
  background: "#161619", border: "1px solid #2f2f37", borderRadius: 11, padding: "12px 14px",
  boxShadow: "0 14px 32px rgba(0,0,0,0.55)", fontFamily: "Helvetica, Arial, sans-serif",
};
const toastX = {
  height: 26, padding: "0 10px", background: "#26262b", color: "#cfcfcf",
  border: "1px solid #36363c", borderRadius: 6, fontSize: 11.5, cursor: "pointer",
};

// The read-only, live viewer shown when a deck is opened via a share link. Zero
// editing surface: a banner + a large StaticSlide of the current slide + the
// strip for navigation. The parent re-pulls the doc on a poll, so this updates
// live as the owner edits.
function SharedViewer({ doc, slideIndex, name, onNav, error, onBack, admin }) {
  const slides = (doc && doc.slides) || [];
  const cur = slides[slideIndex] || slides[0];
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: UI.bg, color: UI.text, fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px", borderBottom: "1px solid " + UI.border, flexShrink: 0 }}>
        {onBack ? <button style={hbtn} onClick={onBack} title="Back to the admin console">‹ Admin</button> : null}
        <strong style={{ fontSize: 13 }}>{name || "Shared carousel"}</strong>
        {admin ? (
          <span style={{ fontSize: 11, color: "#ffd36b", background: "#241d0e", border: "1px solid #4a3c16", borderRadius: 12, padding: "2px 9px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Eye size={12} /> Admin view · read-only
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "#8fd3a8", background: "#142019", border: "1px solid #264a36", borderRadius: 12, padding: "2px 9px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <style>{"@keyframes lv-pulse{0%{box-shadow:0 0 0 0 rgba(62,196,109,.5)}70%{box-shadow:0 0 0 5px rgba(62,196,109,0)}100%{box-shadow:0 0 0 0 rgba(62,196,109,0)}}"}</style>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3ec46d", animation: "lv-pulse 1.6s infinite" }} />
            <Eye size={12} /> View only · live
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: UI.muted }}>{slides.length} slide{slides.length === 1 ? "" : "s"}</span>
      </div>
      {error ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: UI.muted }}>{error}</div>
      ) : (
        <>
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            {cur ? <div style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}><StaticSlide slide={cur} width={Math.min(520, typeof window !== "undefined" ? window.innerWidth - 60 : 520)} /></div> : null}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid " + UI.border, overflowX: "auto", flexShrink: 0 }}>
            {slides.map((s, i) => (
              <div key={s.id || i} onClick={() => onNav(i)} style={{ flexShrink: 0, cursor: "pointer", borderRadius: 6, outline: i === slideIndex ? "2px solid " + UI.brand : "1px solid " + UI.border, outlineOffset: -1 }}>
                <StaticSlide slide={s} width={64} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SidePanel({ title, onClose, children }) {
  return (
    <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, padding: 12, background: UI.surface, borderRight: "1px solid " + UI.border, fontFamily: "Helvetica, Arial, sans-serif", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>{title}</strong>
        <button onClick={onClose} title="Close panel"
          style={{ width: 24, height: 24, background: "transparent", color: UI.muted, border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5 }}>×</button>
      </div>
      {children}
    </div>
  );
}

function PanelButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ height: 36, padding: "0 12px", textAlign: "left", background: UI.surface2, color: UI.text, border: "1px solid " + UI.border, borderRadius: 7, cursor: "pointer", fontSize: 13 }}>
      {children}
    </button>
  );
}

// A collapsible panel section: an uppercase header with a ▾/▸ chevron that hides
// its children when collapsed. Defaults to open; remembers its own state.
function Collapsible({ title, defaultOpen = true, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button onClick={() => setOpen((o) => !o)} title={open ? "Collapse" : "Expand"}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", borderTop: "1px solid " + UI.soft, color: UI.muted, cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", padding: "11px 0 4px" }}>
        <span>{title}</span>{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && children}
    </div>
  );
}

// A grid swatch for a shape — a uniform tile with a small, consistently-scaled
// preview of the real ShapeBacking (so it shows exactly what drops) above a
// label. The shape is scaled to a fixed inner box with margin so tails / ears
// aren't clipped, keeping the grid tidy regardless of the shape's aspect.
function ShapeTile({ v, accent, wrap, onPick }) {
  const PW = 70, PH = 30; // preview box the shape is fit into (leaves margin)
  const s = Math.min(PW / v.w, PH / v.h);
  const el = {
    type: "text", shape: v.id, content: shapeSample(v), w: v.w, h: v.h, rotation: v.rotation || 0,
    shapeFill: v.paper ? SHAPE_PAPER : accent,
    color: v.paper ? SHAPE_PAPER_INK : (v.knockout ? "#0c0c0c" : "#ffffff"),
    fontFamily: v.font, fontSize: v.size, fontWeight: 700, letterSpacing: v.spacing || 0, align: "center",
    tailSide: "left", opacity: 1,
  };
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={() => onPick(v.id)} title={(wrap ? "Wrap selection in " : "Add ") + v.label}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: 66,
        background: hover ? UI.hover : UI.surface2, border: "1px solid " + (hover ? UI.brand : UI.border),
        borderRadius: 8, cursor: "pointer", overflow: "hidden", transition: "border-color .12s, background .12s" }}>
      <div style={{ position: "relative", width: v.w * s, height: v.h * s }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: v.w, height: v.h, transform: "scale(" + s + ")", transformOrigin: "top left" }}>
          <ShapeBacking el={el} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <span style={{ fontFamily: v.font, fontSize: v.size, fontWeight: 700, letterSpacing: (v.spacing || 0) + "px", color: el.color, lineHeight: 1.05, padding: "0 10%", whiteSpace: "nowrap" }}>{shapeSample(v)}</span>
          </div>
        </div>
      </div>
      <span style={{ fontSize: 10, color: UI.muted, letterSpacing: 0.2 }}>{v.label}</span>
    </button>
  );
}

// Short, uniform preview text per shape so the swatches stay tidy (the dropped
// element still uses the variant's full sample text).
function shapeSample(v) {
  return ({ speech: "Aa", cloud: "Aa", stamp: "OK", banner: "Aa", burst: "NEW", tag: "#1", pill: "SAVE", note: "Aa" })[v.id] || "Aa";
}

const miniBtn = {
  width: 18, height: 18, lineHeight: "15px", textAlign: "center", fontSize: 12, padding: 0,
  background: "rgba(18,18,20,0.9)", color: "#fff", border: "1px solid #444", borderRadius: 4,
  cursor: "pointer", pointerEvents: "auto",
};

// A slide thumbnail in the strip, wrapped with drag-to-reorder + hover
// duplicate/delete controls (spec §5). Keeps SlideThumb itself presentational.
function SlideStripItem({ slide, index, active, canDelete, dragFrom, onSelect, onReorder, onDuplicate, onDelete }) {
  const [hover, setHover] = useState(false);
  const [over, setOver] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => { dragFrom.current = index; e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const from = dragFrom.current;
        dragFrom.current = null;
        if (from != null && from !== index) onReorder(from, index);
      }}
      onDragEnd={() => { dragFrom.current = null; setOver(false); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", flexShrink: 0, borderRadius: 6, outline: over ? "2px solid " + UI.brand : "none", outlineOffset: 1 }}
    >
      <SlideThumb slide={slide} index={index} active={active} onClick={onSelect} />
      {hover && (
        <div style={{ position: "absolute", top: 2, left: 2, right: 2, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
          <button title="Duplicate slide" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} style={miniBtn}>⧉</button>
          {canDelete && (
            <button title="Delete slide" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ ...miniBtn, color: "#ff8a8a" }}>×</button>
          )}
        </div>
      )}
    </div>
  );
}
