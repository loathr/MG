"use client";
import React, { useEffect, useState, useCallback } from "react";
import { UI } from "./theme";
import { getIdToken } from "./firebaseClient";
import { relativeTime } from "./cloud";
import { ROLES } from "./authority";
import { workspaceTotals, accountUsageState, sortAccounts } from "./adminModel";

// Admin-only workspace console: manage the account hierarchy (role + monthly
// generation cap per account), see per-account usage, and browse every account's
// decks. Admin-gated in the UI (Studio only mounts it for an admin) AND on the
// server (every /api/admin/* route re-checks the role), so it's never the only
// line of defence. All reads/writes carry the Firebase ID token.
export default function AdminConsole({ onBack, selfUid, nowMs }) {
  const [data, setData] = useState(null); // { accounts, decks, period, totals }
  const [tab, setTab] = useState("accounts");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({}); // uid -> saving

  const authFetch = useCallback(async (url, opts) => {
    const token = await getIdToken();
    const headers = Object.assign({ "Content-Type": "application/json" }, (opts && opts.headers) || {});
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(url, Object.assign({}, opts || {}, { headers }));
  }, []);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    authFetch("/api/admin/accounts")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 403 ? "Admins only." : "Couldn't load accounts (" + r.status + ")."))))
      .then((d) => setData(d))
      .catch((e) => setErr(e.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, [authFetch]);
  useEffect(() => { load(); }, [load]);

  const patchAccount = (uid, patch) =>
    setData((d) => (d ? { ...d, accounts: d.accounts.map((a) => (a.uid === uid ? { ...a, ...patch } : a)) } : d));

  const changeRole = async (uid, role) => {
    setBusy((b) => ({ ...b, [uid]: true }));
    try {
      const r = await authFetch("/api/admin/role", { method: "POST", body: JSON.stringify({ uid, role }) });
      if (r.ok) patchAccount(uid, { role });
      else setErr("Couldn't change role.");
    } catch (e) { setErr("Couldn't change role."); }
    finally { setBusy((b) => ({ ...b, [uid]: false })); }
  };
  const changeLimit = async (uid, monthly) => {
    const n = Math.max(0, Math.floor(Number(monthly) || 0));
    setBusy((b) => ({ ...b, [uid]: true }));
    try {
      const r = await authFetch("/api/admin/limit", { method: "POST", body: JSON.stringify({ uid, monthly: n }) });
      if (r.ok) patchAccount(uid, { limit: n });
      else setErr("Couldn't set limit.");
    } catch (e) { setErr("Couldn't set limit."); }
    finally { setBusy((b) => ({ ...b, [uid]: false })); }
  };

  const accounts = data ? sortAccounts(data.accounts) : [];
  const totals = data ? workspaceTotals(data.accounts) : { accounts: 0, admins: 0, generationsThisMonth: 0, overLimit: 0 };
  const nameByUid = {};
  for (const a of (data ? data.accounts : [])) nameByUid[a.uid] = a.name || a.email || a.uid;

  return (
    <div style={screen}>
      <div style={col}>
        <div style={top}>
          <span style={h}>Admin</span>
          <span style={crumb}>· Workspace</span>
          <span style={{ flex: 1 }} />
          <button type="button" onClick={onBack} style={back}>‹ Back to projects</button>
        </div>

        <div style={cards}>
          <Stat n={totals.accounts} label="Accounts" />
          <Stat n={totals.admins} label="Admins" />
          <Stat n={totals.generationsThisMonth} label={"Generations · " + (data ? data.period : "")} />
          <Stat n={totals.overLimit} label="Over limit" warn={totals.overLimit > 0} />
        </div>

        <div style={tabs}>
          {[["accounts", "Accounts"], ["usage", "Usage"], ["decks", "All decks"]].map(([k, lab]) => (
            <button key={k} type="button" onClick={() => setTab(k)} style={{ ...tabBtn, ...(tab === k ? tabOn : null) }}>{lab}</button>
          ))}
        </div>

        {err ? <div style={errBox}>{err} <button type="button" onClick={load} style={retry}>Retry</button></div> : null}
        {loading && !data ? <div style={hintBox}>Loading accounts…</div> : null}

        {data && tab === "accounts" && (
          <div style={panel}>
            <div style={{ ...row, ...headRow }}>
              <span style={cAcct}>Account</span><span style={cRole}>Role</span><span style={cLim}>Monthly limit</span><span style={cUse}>Used this month</span><span style={cLast}>Last active</span>
            </div>
            {accounts.map((a) => {
              const st = accountUsageState(a.used, a.limit);
              return (
                <div key={a.uid} style={row}>
                  <span style={cAcct}>
                    <span style={{ ...av, background: avColor(a.uid) }}>{(a.name || a.email || "?").slice(0, 1).toUpperCase()}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={nm}>{a.name}{a.uid === selfUid ? <span style={youTag}>you</span> : null}</span>
                      <span style={em}>{a.email}</span>
                    </span>
                  </span>
                  <span style={cRole}>
                    <select value={a.role} disabled={!!busy[a.uid]} onChange={(e) => changeRole(a.uid, e.target.value)} style={{ ...roleSel, color: roleColor(a.role) }}>
                      {ROLES.map((r) => <option key={r} value={r} style={{ color: "#111" }}>{cap(r)}</option>)}
                    </select>
                  </span>
                  <span style={cLim}>
                    <input type="number" min={0} defaultValue={a.limit || 0} disabled={!!busy[a.uid]}
                      onBlur={(e) => { const v = Math.max(0, Math.floor(Number(e.target.value) || 0)); if (v !== (a.limit || 0)) changeLimit(a.uid, v); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                      style={limInput} />
                    <span style={infl}>{a.limit ? "/mo" : "∞"}</span>
                  </span>
                  <span style={cUse}>
                    <span style={{ ...useTxt, ...(st.over ? { color: "#ff7a6b" } : null) }}>
                      <b>{st.used}</b>{st.unlimited ? " generations" : " / " + st.limit}{st.over ? " · over" : ""}
                    </span>
                    <span style={bar}><span style={{ display: "block", height: "100%", borderRadius: 4, width: (st.unlimited ? Math.min(100, st.used) : Math.round(st.ratio * 100)) + "%", background: st.over ? "#ff7a6b" : barColor(a.role) }} /></span>
                  </span>
                  <span style={cLast}>{a.lastActive ? relativeTime(new Date(a.lastActive).getTime(), nowMs) : "—"}</span>
                </div>
              );
            })}
            <div style={foot}>{accounts.length} account{accounts.length === 1 ? "" : "s"} · role &amp; limit changes apply on the member&rsquo;s next sign-in / token refresh</div>
          </div>
        )}

        {data && tab === "usage" && (
          <div style={panel}>
            <div style={{ padding: "14px 16px" }}>
              {accounts.slice().sort((a, b) => (b.used | 0) - (a.used | 0)).map((a) => {
                const st = accountUsageState(a.used, a.limit);
                const maxUsed = Math.max(1, ...accounts.map((x) => x.used | 0));
                return (
                  <div key={a.uid} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ color: "#dcdce2" }}>{a.name}</span>
                      <span style={{ color: st.over ? "#ff7a6b" : "#8a8a90" }}>{st.used}{st.unlimited ? "" : " / " + st.limit}</span>
                    </div>
                    <span style={{ ...bar, height: 8 }}><span style={{ display: "block", height: "100%", borderRadius: 4, width: Math.round(((a.used | 0) / maxUsed) * 100) + "%", background: st.over ? "#ff7a6b" : barColor(a.role) }} /></span>
                  </div>
                );
              })}
              {accounts.length === 0 ? <div style={{ color: "#6f6f78", fontSize: 13 }}>No accounts yet.</div> : null}
            </div>
          </div>
        )}

        {data && tab === "decks" && (
          <div style={panel}>
            <div style={{ ...row, ...headRow }}>
              <span style={{ flex: 2 }}>Carousel</span><span style={{ flex: 1.4 }}>Owner</span><span style={{ width: 90 }}>Slides</span><span style={{ width: 120 }}>Updated</span>
            </div>
            {data.decks.map((dk) => (
              <div key={dk.ownerUid + "/" + dk.id} style={row}>
                <span style={{ flex: 2, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dk.name}</span>
                <span style={{ flex: 1.4, fontSize: 12.5, color: "#b6b6be" }}>{nameByUid[dk.ownerUid] || dk.ownerUid.slice(0, 8)}</span>
                <span style={{ width: 90, fontSize: 12.5, color: "#8a8a90" }}>{dk.slideCount}</span>
                <span style={{ width: 120, fontSize: 12, color: "#8a8a90" }}>{dk.updatedAt ? relativeTime(dk.updatedAt, nowMs) : "—"}</span>
              </div>
            ))}
            {data.decks.length === 0 ? <div style={foot}>No decks saved yet.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ n, label, warn }) {
  return <div style={card}><div style={{ ...statN, ...(warn ? { color: "#ff9a6b" } : null) }}>{n}</div><div style={statL}>{label}</div></div>;
}

const cap = (s) => (s ? s.slice(0, 1).toUpperCase() + s.slice(1) : s);
const roleColor = (r) => ({ admin: "#ffd36b", editor: "#8fd0ff", viewer: "#b7b7be" }[r] || "#eaeaea");
const barColor = (r) => ({ admin: "#6d3bd1", editor: "#8fd0ff", viewer: "#5a5a62" }[r] || "#8fd0ff");
// A stable per-account avatar colour from the uid (no randomness → SSR-safe).
function avColor(uid) {
  const palette = ["#6d3bd1", "#2d8cff", "#e0603a", "#3aa76d", "#b07a2d", "#c0508a", "#3a9db0"];
  let h = 0; for (let i = 0; i < String(uid).length; i++) h = (h * 31 + String(uid).charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ---- styles ----
const screen = { position: "absolute", inset: 0, overflow: "auto", padding: "40px 28px", background: "radial-gradient(1200px 700px at 50% -8%, #101010 0%, #070707 55%, #000 100%)", fontFamily: "Helvetica, Arial, sans-serif", color: "#eaeaea" };
const col = { maxWidth: 1080, margin: "0 auto" };
const top = { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 };
const h = { fontSize: 19, fontWeight: 700 };
const crumb = { fontSize: 12, color: "#6f6f77" };
const back = { fontSize: 12.5, color: "#bdbdc4", background: "#1b1b1f", border: "1px solid " + UI.border, borderRadius: 8, padding: "8px 13px", cursor: "pointer" };
const cards = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 };
const card = { background: "#141417", border: "1px solid #232327", borderRadius: 12, padding: "15px 17px" };
const statN = { fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" };
const statL = { fontSize: 11.5, color: "#7d7d85", marginTop: 3 };
const tabs = { display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #232327" };
const tabBtn = { fontSize: 13, padding: "9px 14px", color: "#8a8a90", background: "transparent", border: "none", borderBottom: "2px solid transparent", marginBottom: -1, cursor: "pointer" };
const tabOn = { color: "#fff", borderBottomColor: "#fff", fontWeight: 600 };
const panel = { background: "#141417", border: "1px solid #232327", borderRadius: 12, overflow: "hidden" };
const row = { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid #1c1c20", fontSize: 13 };
const headRow = { fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6f6f77", fontWeight: 600 };
const cAcct = { flex: 2, display: "flex", alignItems: "center", gap: 11, minWidth: 0 };
const cRole = { width: 128 };
const cLim = { width: 130, display: "flex", alignItems: "center", gap: 7 };
const cUse = { flex: 1.3, minWidth: 150 };
const cLast = { width: 96, fontSize: 12, color: "#8a8a90" };
const av = { width: 32, height: 32, borderRadius: "50%", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff" };
const nm = { fontWeight: 600, fontSize: 13, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const em = { fontSize: 11.5, color: "#7d7d85", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const youTag = { fontSize: 10, background: "#243247", color: "#8fd0ff", borderRadius: 5, padding: "1px 6px", marginLeft: 6, fontWeight: 600 };
const roleSel = { background: "#1c1c20", border: "1px solid #2c2c32", borderRadius: 7, padding: "6px 8px", fontSize: 12.5, width: "100%", cursor: "pointer", outline: "none" };
const limInput = { width: 66, background: "#111114", border: "1px solid #2c2c32", borderRadius: 7, padding: "6px 8px", fontSize: 12.5, color: "#eaeaea", textAlign: "right", outline: "none" };
const infl = { fontSize: 11, color: "#6f6f77" };
const useTxt = { fontSize: 12, color: "#cfcfd4", display: "block", marginBottom: 5 };
const bar = { height: 6, background: "#1c1c20", borderRadius: 4, overflow: "hidden", display: "block" };
const foot = { padding: "12px 16px", background: "#111114", fontSize: 12, color: "#7d7d85" };
const errBox = { background: "#3a1f1f", border: "1px solid #6a3030", color: "#ffb3a6", borderRadius: 9, padding: "10px 13px", fontSize: 12.5, marginBottom: 14 };
const retry = { marginLeft: 8, background: "transparent", border: "1px solid #6a3030", color: "#ffb3a6", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" };
const hintBox = { color: "#7d7d85", fontSize: 13, padding: "18px 4px" };
