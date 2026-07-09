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
export default function AdminConsole({ onBack, selfUid, nowMs, onOpenDeck }) {
  const [data, setData] = useState(null); // { accounts, decks, period, totals }
  const [requests, setRequests] = useState([]); // access-request queue
  const [reqRole, setReqRole] = useState({}); // uid -> role to grant on approve
  const [audit, setAudit] = useState([]); // per-generation audit log
  const [auditFilter, setAuditFilter] = useState("all"); // all | topic | document | restyle
  const [auditQuery, setAuditQuery] = useState("");
  const [tab, setTab] = useState("accounts");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({}); // uid -> saving
  const [confirm, setConfirm] = useState(null); // account pending permanent removal
  const [confirmText, setConfirmText] = useState(""); // typed email to confirm
  const [confirmDecks, setConfirmDecks] = useState(true); // also delete their data

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
    // The access-request queue loads alongside (best-effort — it only feeds a tab).
    authFetch("/api/admin/requests")
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => setRequests((d && d.requests) || []))
      .catch(() => {});
    // The per-generation audit log (best-effort — feeds the Audit tab).
    authFetch("/api/admin/audit")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setAudit((d && d.rows) || []))
      .catch(() => {});
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

  // Approve / deny an access request. Approve adds the email to the allow-list +
  // sets the chosen role (server-side); the row flips to the decided state in place.
  const decideRequest = async (uid, decision) => {
    const key = "req:" + uid;
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const role = reqRole[uid] || "editor";
      const r = await authFetch("/api/admin/requests", { method: "POST", body: JSON.stringify({ uid, decision, role }) });
      if (r.ok) {
        const j = await r.json();
        const status = (j && j.status) || (decision === "approve" ? "approved" : "denied");
        setRequests((rs) => rs.map((x) => (x.uid === uid ? { ...x, status, role: decision === "approve" ? role : x.role, decidedAt: nowMs } : x)));
        if (decision === "approve") load(); // refresh accounts so the newly-allowed account shows
      } else setErr("Couldn't update the request.");
    } catch (e) { setErr("Couldn't update the request."); }
    finally { setBusy((b) => ({ ...b, [key]: false })); }
  };

  // Suspend / reactivate (reversible) an account.
  const setDisabled = async (uid, disabled) => {
    setBusy((b) => ({ ...b, [uid]: true }));
    try {
      const r = await authFetch("/api/admin/account", { method: "POST", body: JSON.stringify({ uid, action: disabled ? "disable" : "enable" }) });
      if (r.ok) patchAccount(uid, { disabled });
      else setErr("Couldn't update the account.");
    } catch (e) { setErr("Couldn't update the account."); }
    finally { setBusy((b) => ({ ...b, [uid]: false })); }
  };
  // Permanently remove an account (+ optionally its data). Drops it from the list.
  const removeAccount = async (uid, deleteDecks) => {
    setBusy((b) => ({ ...b, [uid]: true }));
    try {
      const r = await authFetch("/api/admin/account", { method: "POST", body: JSON.stringify({ uid, action: "delete", deleteDecks }) });
      if (r.ok) setData((d) => (d ? { ...d, accounts: d.accounts.filter((a) => a.uid !== uid) } : d));
      else setErr("Couldn't remove the account.");
    } catch (e) { setErr("Couldn't remove the account."); }
    finally { setBusy((b) => ({ ...b, [uid]: false })); setConfirm(null); }
  };
  const confirmReady = !!(confirm && confirmText.trim().toLowerCase() === (confirm.email || "").toLowerCase());

  const accounts = data ? sortAccounts(data.accounts) : [];
  const totals = data ? workspaceTotals(data.accounts) : { accounts: 0, admins: 0, generationsThisMonth: 0, overLimit: 0 };
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const auditRows = audit.filter((a) => {
    if (auditFilter !== "all" && (a.mode || "topic") !== auditFilter) return false;
    const q = auditQuery.trim().toLowerCase();
    if (!q) return true;
    return (a.email || "").toLowerCase().includes(q) || (a.topic || "").toLowerCase().includes(q);
  });
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
          {[["accounts", "Accounts"], ["requests", "Requests"], ["audit", "Audit"], ["usage", "Usage"], ["decks", "All decks"]].map(([k, lab]) => (
            <button key={k} type="button" onClick={() => setTab(k)} style={{ ...tabBtn, ...(tab === k ? tabOn : null) }}>
              {lab}{k === "requests" && pendingCount > 0 ? <span style={tabBadge}>{pendingCount}</span> : null}
            </button>
          ))}
        </div>

        {err ? <div style={errBox}>{err} <button type="button" onClick={load} style={retry}>Retry</button></div> : null}
        {loading && !data ? <div style={hintBox}>Loading accounts…</div> : null}

        {data && tab === "accounts" && (
          <div style={panel}>
            <div style={{ ...row, ...headRow }}>
              <span style={cAcct}>Account</span><span style={cRole}>Role</span><span style={cLim}>Monthly limit</span><span style={cUse}>Used this month</span><span style={cLast}>Last active</span><span style={cAct}>Actions</span>
            </div>
            {accounts.map((a) => {
              const st = accountUsageState(a.used, a.limit);
              return (
                <div key={a.uid} style={row}>
                  <span style={cAcct}>
                    <span style={{ ...av, background: avColor(a.uid) }}>{(a.name || a.email || "?").slice(0, 1).toUpperCase()}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={nm}>{a.name}{a.uid === selfUid ? <span style={youTag}>you</span> : null}{a.disabled ? <span style={suspTag}>suspended</span> : null}</span>
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
                  <span style={cAct}>
                    {a.uid === selfUid ? (
                      <span style={{ fontSize: 11, color: "#6f6f77" }}>—</span>
                    ) : (
                      <>
                        <button type="button" disabled={!!busy[a.uid]} onClick={() => setDisabled(a.uid, !a.disabled)}
                          style={actBtn} title={a.disabled ? "Reactivate — allow sign-in again" : "Suspend — block sign-in (reversible)"}>
                          {a.disabled ? "Reactivate" : "Suspend"}
                        </button>
                        <button type="button" disabled={!!busy[a.uid]} onClick={() => { setConfirm(a); setConfirmText(""); setConfirmDecks(true); }}
                          style={{ ...actBtn, ...actDanger }} title="Remove permanently">Remove</button>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
            <div style={foot}>{accounts.length} account{accounts.length === 1 ? "" : "s"} · role &amp; limit changes apply on the member&rsquo;s next sign-in / token refresh</div>
          </div>
        )}

        {tab === "requests" && (
          <div style={panel}>
            <div style={{ ...row, ...headRow }}>
              <span style={rReq}>Requester</span><span style={rNote}>Note</span><span style={rWhen}>Requested</span><span style={rAct}>Grant as / decision</span>
            </div>
            {requests.map((rq) => {
              const pend = rq.status === "pending";
              return (
                <div key={rq.uid} style={{ ...row, ...(pend ? null : { opacity: 0.6 }) }}>
                  <span style={rReq}>
                    <span style={{ ...av, background: avColor(rq.uid) }}>{(rq.name || rq.email || "?").slice(0, 1).toUpperCase()}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={nm}>
                        {rq.email || rq.name || rq.uid.slice(0, 8)}
                        {pend ? <span style={guestTag}>guest</span> : <span style={{ ...stTag, ...(rq.status === "approved" ? stApproved : stDenied) }}>{rq.status}</span>}
                      </span>
                      <span style={em}>{pend ? "Google account" : (rq.status === "approved" ? "granted as " + cap(rq.role || "editor") : "denied") + (rq.decidedAt ? " · " + relativeTime(rq.decidedAt, nowMs) : "")}</span>
                    </span>
                  </span>
                  <span style={rNote}>{rq.note ? <span style={{ fontStyle: "italic" }}>&ldquo;{rq.note}&rdquo;</span> : <span style={{ color: "#6f6f77" }}>— no note —</span>}</span>
                  <span style={rWhen}>{rq.requestedAt ? relativeTime(rq.requestedAt, nowMs) : "—"}</span>
                  <span style={rAct}>
                    {pend ? (
                      <>
                        <select value={reqRole[rq.uid] || "editor"} disabled={!!busy["req:" + rq.uid]} onChange={(e) => setReqRole((m) => ({ ...m, [rq.uid]: e.target.value }))} style={{ ...roleSel, width: 82 }}>
                          {ROLES.map((r) => <option key={r} value={r} style={{ color: "#111" }}>{cap(r)}</option>)}
                        </select>
                        <button type="button" disabled={!!busy["req:" + rq.uid]} onClick={() => decideRequest(rq.uid, "approve")} style={approveBtn}>Approve</button>
                        <button type="button" disabled={!!busy["req:" + rq.uid]} onClick={() => decideRequest(rq.uid, "deny")} style={{ ...actBtn, ...actDanger }}>Deny</button>
                      </>
                    ) : rq.status === "denied" ? (
                      <button type="button" disabled={!!busy["req:" + rq.uid]} onClick={() => decideRequest(rq.uid, "approve")} style={actBtn}>Approve now</button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#6f6f77" }}>account added</span>
                    )}
                  </span>
                </div>
              );
            })}
            {requests.length === 0 ? <div style={foot}>No access requests. External accounts that sign in will appear here to approve or deny.</div>
              : <div style={foot}>{pendingCount} pending · approving adds the address to the allow-list and sets the role · decided requests are kept for audit</div>}
          </div>
        )}

        {tab === "audit" && (
          <>
            <div style={auditBar}>
              {[["all", "All"], ["topic", "Topic"], ["document", "Document"], ["restyle", "Restyle"]].map(([k, lab]) => (
                <button key={k} type="button" onClick={() => setAuditFilter(k)} style={{ ...fbtn, ...(auditFilter === k ? fbtnOn : null) }}>{lab}</button>
              ))}
              <input value={auditQuery} onChange={(e) => setAuditQuery(e.target.value)} placeholder="Search account or topic…" style={auditSearch} />
            </div>
            <div style={panel}>
              <div style={{ ...row, ...headRow }}>
                <span style={aWho}>Account</span><span style={aTopic}>Topic / label</span><span style={aMeta}>Style · slides · model</span><span style={aWhen}>When</span>
              </div>
              {auditRows.map((a) => (
                <div key={a.id} style={row}>
                  <span style={aWho}>
                    <span style={{ ...av, width: 28, height: 28, background: avColor(a.uid || a.email) }}>{(a.email || "?").slice(0, 1).toUpperCase()}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={nm}>{(a.email || "account").split("@")[0]}</span>
                      <span style={em}>{a.email}</span>
                    </span>
                  </span>
                  <span style={aTopic} title={a.topic}>
                    {a.topic || <span style={{ color: "#6f6f77" }}>—</span>}
                    {a.guest ? <span style={{ ...auditPill, ...apGuest }}>guest</span> : null}
                    {a.mode && a.mode !== "topic" ? <span style={{ ...auditPill, ...(a.mode === "document" ? apDoc : apRestyle) }}>{a.mode}</span> : null}
                  </span>
                  <span style={aMeta}>{[cap(a.style || ""), a.slides != null ? a.slides : "—", shortModel(a.model)].filter((x) => x !== "").join(" · ")}</span>
                  <span style={aWhen}>{a.ts ? relativeTime(a.ts, nowMs) : "—"}</span>
                </div>
              ))}
              {auditRows.length === 0 ? (
                <div style={foot}>{audit.length === 0 ? "No generations logged yet. Each metered generation records a row here." : "No rows match this filter."}</div>
              ) : (
                <div style={foot}>{auditRows.length} of {audit.length} generation{audit.length === 1 ? "" : "s"} · newest first · metadata + truncated topic only</div>
              )}
            </div>
          </>
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
              <span style={{ flex: 2 }}>Carousel</span><span style={{ flex: 1.4 }}>Owner</span><span style={{ width: 90 }}>Slides</span><span style={{ width: 120 }}>Updated</span><span style={{ width: 70 }} />
            </div>
            {data.decks.map((dk) => {
              const open = onOpenDeck ? () => onOpenDeck(dk.ownerUid, dk.id, dk.name) : null;
              return (
                <div key={dk.ownerUid + "/" + dk.id} style={open ? { ...row, cursor: "pointer" } : row}
                  onClick={open || undefined} title={open ? "Open read-only" : undefined}>
                  <span style={{ flex: 2, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dk.name}</span>
                  <span style={{ flex: 1.4, fontSize: 12.5, color: "#b6b6be" }}>{nameByUid[dk.ownerUid] || dk.ownerUid.slice(0, 8)}</span>
                  <span style={{ width: 90, fontSize: 12.5, color: "#8a8a90" }}>{dk.slideCount}</span>
                  <span style={{ width: 120, fontSize: 12, color: "#8a8a90" }}>{dk.updatedAt ? relativeTime(dk.updatedAt, nowMs) : "—"}</span>
                  <span style={{ width: 70, textAlign: "right" }}>
                    {open ? <button style={openBtn} onClick={(e) => { e.stopPropagation(); open(); }}>Open</button> : null}
                  </span>
                </div>
              );
            })}
            {data.decks.length === 0 ? <div style={foot}>No decks saved yet.</div> : null}
          </div>
        )}
      </div>

      {confirm && (
        <div style={modalWrap} onClick={() => setConfirm(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitle}>Remove {confirm.name}?</div>
            <div style={modalBody}>
              This permanently deletes <b>{confirm.email}</b>&rsquo;s account and revokes their access. This can&rsquo;t be undone.
            </div>
            <label style={ckRow}>
              <input type="checkbox" checked={confirmDecks} onChange={(e) => setConfirmDecks(e.target.checked)} />
              Also delete all their decks &amp; data
            </label>
            <div style={{ fontSize: 12, color: "#8a8a90", margin: "12px 0 6px" }}>Type their email to confirm:</div>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={confirm.email}
              autoFocus style={confirmInput} onKeyDown={(e) => { if (e.key === "Enter" && confirmReady) removeAccount(confirm.uid, confirmDecks); if (e.key === "Escape") setConfirm(null); }} />
            <div style={modalBtns}>
              <button type="button" style={cancelBtn} onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" disabled={!confirmReady || !!busy[confirm.uid]} onClick={() => removeAccount(confirm.uid, confirmDecks)}
                style={{ ...dangerBtn, opacity: confirmReady ? 1 : 0.5, cursor: confirmReady ? "pointer" : "not-allowed" }}>
                {busy[confirm.uid] ? "Removing…" : "Remove account"}
              </button>
            </div>
          </div>
        </div>
      )}
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
const tabBadge = { display: "inline-block", minWidth: 17, height: 17, lineHeight: "17px", borderRadius: 9, background: "#6d3bd1", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "0 5px", marginLeft: 7, textAlign: "center" };
const panel = { background: "#141417", border: "1px solid #232327", borderRadius: 12, overflow: "hidden" };
const row = { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid #1c1c20", fontSize: 13 };
const headRow = { fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6f6f77", fontWeight: 600 };
const cAcct = { flex: 2, display: "flex", alignItems: "center", gap: 11, minWidth: 0 };
const cRole = { width: 128 };
const cLim = { width: 130, display: "flex", alignItems: "center", gap: 7 };
const cUse = { flex: 1.3, minWidth: 150 };
const cLast = { width: 96, fontSize: 12, color: "#8a8a90" };
const cAct = { width: 150, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" };
const rReq = { flex: 2, display: "flex", alignItems: "center", gap: 11, minWidth: 0 };
const rNote = { flex: 2.4, fontSize: 12, color: "#b6b6be", lineHeight: 1.45, minWidth: 0 };
const rWhen = { width: 96, fontSize: 12, color: "#8a8a90" };
const rAct = { width: 230, display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end" };
const approveBtn = { fontSize: 11.5, fontWeight: 600, color: "#fff", background: "#2f7d4f", border: "1px solid #3a9563", borderRadius: 7, padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap" };
const guestTag = { fontSize: 10, background: "#2b2140", color: "#c3a6ff", borderRadius: 5, padding: "1px 6px", marginLeft: 6, fontWeight: 600 };
const stTag = { fontSize: 10, borderRadius: 5, padding: "1px 6px", marginLeft: 6, fontWeight: 600 };
const stApproved = { background: "#13291d", color: "#8fe0ab" };
const stDenied = { background: "#2a1618", color: "#ff9a8a" };
// Audit tab
const auditBar = { display: "flex", gap: 8, marginBottom: 12, alignItems: "center" };
const fbtn = { fontSize: 12, padding: "6px 11px", borderRadius: 8, background: "#1b1b1f", border: "1px solid #2a2a30", color: "#bdbdc4", cursor: "pointer" };
const fbtnOn = { background: "#26262e", color: "#fff", borderColor: "#3a3a42" };
const auditSearch = { flex: 1, height: 32, background: "#161619", border: "1px solid #2a2a31", borderRadius: 8, color: "#e8e8e8", fontSize: 12.5, padding: "0 11px", outline: "none" };
const aWho = { flex: 1.5, display: "flex", alignItems: "center", gap: 10, minWidth: 0 };
const aTopic = { flex: 2.4, minWidth: 0, fontSize: 12.5, color: "#dcdce2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const aMeta = { width: 170, fontSize: 11.5, color: "#8a8a90" };
const aWhen = { width: 90, fontSize: 12, color: "#8a8a90" };
const auditPill = { fontSize: 9.5, borderRadius: 5, padding: "1px 6px", marginLeft: 6, fontWeight: 600 };
const apGuest = { background: "#2b2140", color: "#c3a6ff" };
const apDoc = { background: "#13293a", color: "#8fd0ff" };
const apRestyle = { background: "#132a1c", color: "#8fe0ab" };
const shortModel = (m) => { const s = String(m || ""); if (/opus/i.test(s)) return "Opus 4.8"; if (/haiku/i.test(s)) return "Haiku"; if (/sonnet/i.test(s)) return "Sonnet"; return s ? s.slice(0, 14) : ""; };
const actBtn = { fontSize: 11.5, color: "#cfcfd4", background: "#1c1c20", border: "1px solid #2c2c32", borderRadius: 7, padding: "5px 9px", cursor: "pointer", whiteSpace: "nowrap" };
const actDanger = { color: "#ff9a8a", borderColor: "#5a3030", background: "#241819" };
const openBtn = { fontSize: 11, color: "#cfcfd4", background: "#1c1c20", border: "1px solid #2c2c32", borderRadius: 6, padding: "4px 10px", cursor: "pointer" };
const suspTag = { fontSize: 10, background: "#3a2a16", color: "#e0b48a", borderRadius: 5, padding: "1px 6px", marginLeft: 6, fontWeight: 600 };
const modalWrap = { position: "fixed", inset: 0, zIndex: 80, background: "rgba(4,4,6,0.6)", display: "grid", placeItems: "center", padding: 20 };
const modal = { width: "100%", maxWidth: 380, background: "#161619", border: "1px solid #2f2f37", borderRadius: 14, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" };
const modalTitle = { fontSize: 15, fontWeight: 700, marginBottom: 8 };
const modalBody = { fontSize: 12.5, color: "#c2c2ca", lineHeight: 1.5, marginBottom: 12 };
const ckRow = { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#dcdce2", cursor: "pointer" };
const confirmInput = { width: "100%", boxSizing: "border-box", height: 34, background: "#111114", border: "1px solid #2c2c32", borderRadius: 8, color: "#eaeaea", fontSize: 13, padding: "0 10px", outline: "none" };
const modalBtns = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 };
const cancelBtn = { fontSize: 12.5, color: "#cfcfd4", background: "#1c1c20", border: "1px solid #2c2c32", borderRadius: 8, padding: "8px 14px", cursor: "pointer" };
const dangerBtn = { fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#a33028", border: "1px solid #c0392b", borderRadius: 8, padding: "8px 14px" };
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
