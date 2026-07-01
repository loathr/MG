"use client";
import React from "react";
import { UI } from "./theme";
import { relativeTime } from "./cloud";

// "Your projects" — the signed-in landing screen (cloud only). A grid of the
// user's saved decks (metadata only, from listDecks) + a New card. Opening one
// loads it into the editor; New goes to the Create screen. Shown only when the
// cloud layer is enabled — the local-only flow never reaches here.
export default function ProjectsScreen({ projects, onOpen, onNew, onDelete, email, onSignOut, isAdmin, onAdmin, nowMs }) {
  return (
    <div style={screen}>
      <div style={col}>
        <div style={ph}>
          <span style={h}>Your projects</span>
          <span style={acct}>
            {isAdmin ? <button type="button" onClick={onAdmin} style={adminBtn} title="Workspace admin console">⚙ Admin</button> : null}
            <span style={avatar}>{(email || "?").slice(0, 1).toUpperCase()}</span>
            <span style={{ color: "#b6b6be" }}>{email}</span>
            <button type="button" onClick={onSignOut} style={signout} title="Sign out">Sign out</button>
          </span>
        </div>
        <div style={grid}>
          <button type="button" onClick={onNew} style={newCard} title="Start a new carousel">
            <span style={{ fontSize: 28 }}>+</span>
            <span style={{ fontSize: 12.5 }}>New carousel</span>
          </button>
          {projects.map((p) => (
            <div key={p.id} style={card}>
              <button type="button" onClick={() => onOpen(p.id)} style={cardBtn} title={"Open “" + p.name + "”"}>
                <div style={thumb}><span style={thumbName}>{p.name}</span></div>
                <div style={meta}>
                  <div style={nm}>{p.name}</div>
                  <div style={dt}>{relativeTime(p.updatedAt, nowMs)} · {p.slideCount} slide{p.slideCount === 1 ? "" : "s"}</div>
                </div>
              </button>
              <button type="button" onClick={() => onDelete(p.id)} style={del} title="Delete">✕</button>
            </div>
          ))}
        </div>
        {projects.length === 0 ? <div style={empty}>No saved carousels yet — start one with New.</div> : null}
      </div>
    </div>
  );
}

const screen = {
  position: "absolute", inset: 0, overflow: "auto", padding: "44px 28px",
  background: "radial-gradient(1200px 700px at 50% -8%, #101010 0%, #070707 55%, #000 100%)",
  fontFamily: "Helvetica, Arial, sans-serif", color: "#fff",
};
const col = { maxWidth: 880, margin: "0 auto" };
const ph = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 };
const h = { fontSize: 16, fontWeight: 700 };
const acct = { display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#b6b6be" };
const avatar = { width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#6ea8ff,#9b59b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" };
const signout = { background: "transparent", border: "1px solid " + UI.border, color: "#b6b6be", borderRadius: 7, padding: "5px 10px", fontSize: 11.5, cursor: "pointer" };
const adminBtn = { background: "#1b1b1f", border: "1px solid #2a2a30", color: "#ffd36b", borderRadius: 7, padding: "5px 11px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 };
const newCard = { border: "1.5px dashed #34343c", borderRadius: 12, background: "transparent", color: "#8a8a92", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 176, cursor: "pointer" };
const card = { position: "relative", border: "1px solid #20202a", borderRadius: 12, overflow: "hidden", background: "#0d0d10" };
const cardBtn = { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: 0, cursor: "pointer" };
const thumb = { height: 130, background: "#0c0c0c", display: "flex", alignItems: "flex-end", padding: 12, borderBottom: "1px solid #18181c" };
const thumbName = { fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const meta = { padding: "9px 11px" };
const nm = { fontSize: 12.5, color: "#e6e6ea", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const dt = { fontSize: 10.5, color: "#6f6f78", marginTop: 2 };
const del = { position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: 6, background: "rgba(10,10,12,0.7)", color: "#cfcfcf", border: "1px solid " + UI.border, cursor: "pointer", fontSize: 12 };
const empty = { textAlign: "center", color: "#6f6f78", fontSize: 13, marginTop: 30 };
