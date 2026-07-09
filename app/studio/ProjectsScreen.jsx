"use client";
import React, { useState, useEffect, useMemo } from "react";
import { UI } from "./theme";
import { relativeTime, groupDecks, groupCollapsedByDefault, partitionDecks, deleteTimeLeft, formatTimeLeft } from "./cloud";
import { Settings, LogOut, Plus, Search, Trash2, MoreHorizontal, FolderOpen, ChevronDown, ChevronRight, RotateCcw, Clock, Eye } from "lucide-react";

// "Your carousels" — the signed-in landing screen (cloud only). A grid of the
// user's saved decks (metadata only, from listDecks) grouped by recency (or by
// calendar month), each group collapsible with the choice remembered per browser.
// Opening a card loads it into the editor; the hover ⋯ menu holds Open + Delete
// so the card face stays clean; New goes to the Create screen. Account actions
// (email · admin · sign out) fold into the avatar menu. Faux-slide previews are
// VECTOR chrome only — no stacked background rasters (FLAT-LAYERS crash rule).
// Shown only when the cloud layer is enabled.
const COLLAPSE_KEY = "loathr:deckGroups:collapsed";

export default function ProjectsScreen({ projects, onOpen, onNew, onDelete, onRestore, onPurge, email, onSignOut, isAdmin, onAdmin, viewAsGuest, onViewAsGuest, nowMs, delNote, onUndoDelete }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("recency");     // "recency" | "month"
  const [acctOpen, setAcctOpen] = useState(false);
  const [cardMenu, setCardMenu] = useState(null);   // deck id whose ⋯ menu is open
  const [collapsed, setCollapsed] = useState({});   // { [groupKey]: bool } overrides
  const [binOpen, setBinOpen] = useState(false);    // Recently-deleted section expanded?

  // Restore remembered collapse choices (client only).
  useEffect(() => {
    try { const raw = localStorage.getItem(COLLAPSE_KEY); if (raw) setCollapsed(JSON.parse(raw) || {}); } catch (e) { /* ignore */ }
  }, []);
  const persist = (next) => { setCollapsed(next); try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ } };

  // Split live decks from the Recently-deleted bin (soft-deleted within 24h).
  const { active, deleted } = useMemo(() => partitionDecks(projects || [], nowMs || 0), [projects, nowMs]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => active.filter((p) => !q || (p.name || "").toLowerCase().includes(q)),
    [active, q]
  );
  const groups = useMemo(() => groupDecks(filtered, nowMs || 0, mode), [filtered, nowMs, mode]);

  // A group is collapsed if the user set it, else its default (older months). When
  // searching, everything expands so no match hides behind a collapsed header.
  const isCollapsed = (g) => (q ? false : (g.key in collapsed ? collapsed[g.key] : groupCollapsedByDefault(g)));
  const toggle = (g) => persist(Object.assign({}, collapsed, { [g.key]: !isCollapsed(g) }));

  const total = active.length;
  const totalSlides = active.reduce((n, p) => n + (p.slideCount || 0), 0);

  return (
    <div style={screen} onClick={() => { setAcctOpen(false); setCardMenu(null); }}>
      <div style={col}>
        {/* top bar: wordmark · search · avatar menu */}
        <div style={topbar}>
          <span style={wordmark}>loathrdotcom</span>
          <span style={{ flex: 1 }} />
          <div style={searchBox}>
            <Search size={14} style={{ color: UI.muted, flexShrink: 0 }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your carousels…" style={searchInput} />
          </div>
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setAcctOpen((o) => !o)} style={avatar} title={email || "Account"}>
              {(email || "?").slice(0, 1).toUpperCase()}
            </button>
            {acctOpen && (
              <div style={acctMenu}>
                <div style={acctWho}>
                  <div style={acctEmail}>{email}</div>
                  <div style={acctRole}>{isAdmin ? "Admin · workspace owner" : "Member"}</div>
                </div>
                {isAdmin && <button type="button" onClick={() => { setAcctOpen(false); onAdmin && onAdmin(); }} style={mi(true)}><Settings size={14} /> Admin console</button>}
                {isAdmin && onViewAsGuest && <button type="button" onClick={() => { setAcctOpen(false); const next = !viewAsGuest; onViewAsGuest(next); if (next && onNew) onNew(); }} style={mi(false)}><Eye size={14} /> {viewAsGuest ? "Exit guest preview" : "View as guest"}</button>}
                <button type="button" onClick={() => { setAcctOpen(false); onSignOut && onSignOut(); }} style={mi(false, true)}><LogOut size={14} /> Sign out</button>
              </div>
            )}
          </div>
        </div>

        {/* toolbar: title + count · mode toggle · New */}
        <div style={toolbar}>
          <span style={h1}>Your carousels</span>
          <span style={count}>· {total} deck{total === 1 ? "" : "s"}{totalSlides ? " · " + totalSlides + " slides" : ""}</span>
          <span style={{ flex: 1 }} />
          {total > 0 && (
            <div style={seg}>
              <button type="button" onClick={() => setMode("recency")} style={segBtn(mode === "recency")}>Recency</button>
              <button type="button" onClick={() => setMode("month")} style={segBtn(mode === "month")}>Month</button>
            </div>
          )}
          <button type="button" onClick={onNew} style={newBtn}><Plus size={15} /> New carousel</button>
        </div>

        {total === 0 ? (
          <div style={empty}>
            <div style={emptyBig}>No carousels yet</div>
            <div style={emptySmall}>Your saved decks live here. Make your first one.</div>
            <button type="button" onClick={onNew} style={{ ...newBtn, margin: "16px auto 0" }}><Plus size={15} /> New carousel</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={empty}><div style={emptyBig}>No matches</div><div style={emptySmall}>Nothing named &ldquo;{query}&rdquo;.</div></div>
        ) : (
          groups.map((g) => {
            const shut = isCollapsed(g);
            return (
              <div key={g.key} style={{ marginBottom: 8 }}>
                <button type="button" onClick={() => toggle(g)} style={ghead} title={shut ? "Expand" : "Collapse"}>
                  {shut ? <ChevronRight size={14} style={chev} /> : <ChevronDown size={14} style={chev} />}
                  <span style={gtitle}>{g.label}</span>
                  <span style={gcount}>{g.items.length}</span>
                  <span style={grule} />
                </button>
                {!shut && (
                  <div style={grid}>
                    {g.items.map((p) => (
                      <div key={p.id} style={card} onClick={() => onOpen(p.id)}>
                        <div style={prev}>
                          <span style={prevEyebrow} />
                          <span style={prevTitle}>{p.name}</span>
                          <span style={prevMark}>loathrdotcom</span>
                          <span style={prevCount}>{p.slideCount}</span>
                        </div>
                        <div style={cardBody}>
                          <div style={cardName}>{p.name}</div>
                          <div style={cardDate}>{relativeTime(p.updatedAt, nowMs)}</div>
                        </div>
                        {/* hover ⋯ menu — Open + Delete */}
                        <button type="button" style={moreBtn} title="More" onClick={(e) => { e.stopPropagation(); setCardMenu(cardMenu === p.id ? null : p.id); }}>
                          <MoreHorizontal size={15} />
                        </button>
                        {cardMenu === p.id && (
                          <div style={cardMenuBox} onClick={(e) => e.stopPropagation()}>
                            <button type="button" style={mi(false)} onClick={() => { setCardMenu(null); onOpen(p.id); }}><FolderOpen size={14} /> Open</button>
                            <button type="button" style={mi(false, true)} onClick={() => { setCardMenu(null); onDelete(p.id); }}><Trash2 size={14} /> Delete</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Recently deleted — soft-deleted decks, kept 24h then auto-cleared. */}
        {deleted.length > 0 && (
          <div style={binSec}>
            <button type="button" onClick={() => setBinOpen((o) => !o)} style={binHead} title={binOpen ? "Collapse" : "Expand"}>
              <Trash2 size={14} style={{ color: UI.muted }} />
              <span style={{ color: "#cfcfd6" }}>Recently deleted</span>
              <span style={gcount}>{deleted.length}</span>
              {binOpen ? <ChevronDown size={14} style={chev} /> : <ChevronRight size={14} style={chev} />}
              <span style={grule} />
            </button>
            {binOpen && (
              <>
                <p style={binSub}>Removed in the last 24 hours — restore anytime before they clear automatically.</p>
                <div style={grid}>
                  {deleted.map((p) => {
                    const left = deleteTimeLeft(p.deletedAt, nowMs || 0);
                    const soon = left < 60 * 60 * 1000; // under an hour → red
                    return (
                      <div key={p.id} style={binCard}>
                        <div style={binPrev}>
                          <span style={prevTitle}>{p.name}</span>
                          <span style={Object.assign({}, ttlChip, soon ? ttlChipSoon : null)}>
                            <Clock size={11} /> {formatTimeLeft(left)}
                          </span>
                        </div>
                        <div style={cardBody}>
                          <div style={cardName}>{p.name}</div>
                          <div style={binActs}>
                            <button type="button" style={restoreBtn} onClick={() => onRestore && onRestore(p.id)}><RotateCcw size={13} /> Restore</button>
                            <button type="button" style={foreverBtn} title="Delete permanently now" onClick={() => onPurge && onPurge(p.id)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Undo toast right after a delete. */}
      {delNote && (
        <div style={toast} onClick={(e) => e.stopPropagation()}>
          <span>Moved &ldquo;{delNote.name}&rdquo; to Recently deleted</span>
          <button type="button" style={undoBtn} onClick={() => onUndoDelete && onUndoDelete()}>Undo</button>
        </div>
      )}
    </div>
  );
}

const screen = {
  position: "absolute", inset: 0, overflow: "auto", padding: "34px 28px 60px",
  background: "radial-gradient(1200px 700px at 50% -8%, #101010 0%, #070707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif", color: "#fff",
};
const col = { maxWidth: 1040, margin: "0 auto" };
const topbar = { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 };
const wordmark = { fontSize: 12, letterSpacing: 4, fontWeight: 700, color: "#cfcfcf" };
const searchBox = { display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 13px", borderRadius: 9, background: UI.surface2, border: "1px solid " + UI.border, minWidth: 230 };
const searchInput = { flex: 1, background: "transparent", border: "none", outline: "none", color: "#e6e6ea", fontSize: 12.5 };
const avatar = { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#3a3a44,#22222a)", border: "1px solid #33333c", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#e6e6ea", cursor: "pointer" };
const acctMenu = { position: "absolute", top: 42, right: 0, width: 216, background: "#0e0e12", border: "1px solid #2a2a30", borderRadius: 12, padding: 6, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", zIndex: 60 };
const acctWho = { padding: "9px 10px 10px", borderBottom: "1px solid " + UI.soft, marginBottom: 5 };
const acctEmail = { fontSize: 12, color: "#e6e6ea", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const acctRole = { fontSize: 10, color: "#6f6f78", marginTop: 2 };
function mi(gold, warn) {
  return { display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 7, fontSize: 12.5, cursor: "pointer", border: "none", background: "transparent", color: warn ? "#ff9a9a" : gold ? "#ffd36b" : "#d8d8d8" };
}
const toolbar = { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 };
const h1 = { fontSize: 22, fontWeight: 800, letterSpacing: -0.2 };
const count = { fontSize: 12, color: "#6f6f78" };
const seg = { display: "flex", background: UI.surface2, border: "1px solid " + UI.border, borderRadius: 9, padding: 3 };
const segBtn = (on) => ({ fontSize: 11.5, padding: "5px 11px", borderRadius: 6, cursor: "pointer", border: "none", background: on ? "#26262e" : "transparent", color: on ? "#fff" : "#8a8a92", fontWeight: on ? 600 : 400 });
const newBtn = { height: 36, padding: "0 16px", borderRadius: 9, background: UI.brand, color: UI.onBrand, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", border: "none", boxShadow: "0 6px 18px rgba(255,255,255,0.1)" };

const ghead = { display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "10px 0 12px", textAlign: "left" };
const chev = { color: "#7c7c84", flexShrink: 0 };
const gtitle = { fontSize: 13, fontWeight: 700, color: "#e6e6ea", letterSpacing: 0.2 };
const gcount = { fontSize: 11, color: "#5f5f68" };
const grule = { flex: 1, height: 1, background: UI.soft };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16, marginBottom: 22 };
const card = { border: "1px solid #1e1e26", borderRadius: 14, overflow: "hidden", background: "#0b0b0e", cursor: "pointer", position: "relative" };
const prev = { height: 146, position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#191920,#0c0c10)", borderBottom: "1px solid #17171c" };
const prevEyebrow = { position: "absolute", left: 14, top: 16, width: "34%", height: 6, borderRadius: 2, background: "#e2433f" };
const prevTitle = { position: "absolute", left: 14, right: 16, top: 30, fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 800, color: "#e8e8ee", lineHeight: 1.18, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" };
const prevMark = { position: "absolute", left: 14, bottom: 11, fontFamily: "Georgia, serif", fontSize: 9, letterSpacing: 1, color: "#5a5a64" };
const prevCount = { position: "absolute", right: 10, bottom: 10, fontSize: 9.5, fontWeight: 700, color: "#c8c8ce", background: "rgba(10,10,12,0.72)", border: "1px solid #2a2a32", borderRadius: 6, padding: "2px 7px" };
const cardBody = { padding: "11px 13px" };
const cardName = { fontSize: 13, fontWeight: 600, color: "#ececf0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const cardDate = { fontSize: 10.5, color: "#6f6f78", marginTop: 3 };
const moreBtn = { position: "absolute", top: 9, right: 9, width: 26, height: 26, borderRadius: 7, background: "rgba(10,10,12,0.72)", border: "1px solid #2a2a32", color: "#cfcfcf", display: "grid", placeItems: "center", cursor: "pointer" };
const cardMenuBox = { position: "absolute", top: 40, right: 9, width: 150, background: "#0e0e12", border: "1px solid #2a2a30", borderRadius: 10, padding: 5, boxShadow: "0 16px 40px rgba(0,0,0,0.6)", zIndex: 30 };
const empty = { textAlign: "center", color: "#6f6f78", border: "1px dashed #2a2a32", borderRadius: 14, padding: 34, marginTop: 8 };
const emptyBig = { fontSize: 15, color: "#d8d8d8", fontWeight: 600 };
const emptySmall = { fontSize: 12, color: "#6f6f78", marginTop: 6 };

// Recently deleted (soft-delete bin)
const binSec = { marginTop: 30, borderTop: "1px solid " + UI.border, paddingTop: 6 };
const binHead = { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "12px 0 10px", fontSize: 13, fontWeight: 600, textAlign: "left" };
const binSub = { fontSize: 11.5, color: "#6f6f78", margin: "0 0 14px 22px" };
const binCard = { position: "relative", background: UI.surface, border: "1px dashed #3a3a3f", borderRadius: 12, overflow: "hidden", opacity: 0.9 };
const binPrev = { position: "relative", aspectRatio: "4 / 5", background: "#141418", filter: "grayscale(0.4) brightness(0.72)" };
const ttlChip = { position: "absolute", top: 9, left: 9, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#cbb26a", background: "rgba(203,178,106,0.16)", border: "1px solid rgba(203,178,106,0.4)", padding: "2px 7px", borderRadius: 10 };
const ttlChipSoon = { color: "#e2a1a1", background: "rgba(217,138,138,0.16)", borderColor: "rgba(217,138,138,0.4)" };
const binActs = { display: "flex", gap: 6, marginTop: 9 };
const restoreBtn = { flex: 1, height: 28, borderRadius: 6, background: "#1f2a24", border: "1px solid #2f5a44", color: "#8ff0c4", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 };
const foreverBtn = { height: 28, width: 34, borderRadius: 6, background: "transparent", border: "1px solid #3a3a3f", color: "#d98a8a", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const toast = { position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", background: "rgba(20,20,24,0.96)", border: "1px solid #34343c", borderRadius: 20, padding: "9px 12px 9px 16px", fontSize: 12.5, color: "#e6e6ea", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 12px 34px rgba(0,0,0,0.5)", zIndex: 80 };
const undoBtn = { background: "rgba(56,211,159,0.14)", border: "1px solid #2f5a44", color: "#8ff0c4", fontSize: 12, fontWeight: 600, borderRadius: 12, padding: "4px 12px", cursor: "pointer" };
