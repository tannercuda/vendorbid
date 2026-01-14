"use client";

import Seed from "../components/Seed";
import demo from "../../data/demo.json";
import Modal from "../components/Modal";
import ChatPanel from "../components/ChatPanel";
import { LS_KEYS, readLS, writeLS, uid, nowISO, money } from "../components/storage";
import { useEffect, useMemo, useState } from "react";

function validCommunityCode(cfg, code) {
  return String(code || "").trim().toUpperCase() === String(cfg.communityCode || "").trim().toUpperCase();
}

export default function Sub() {
  const [cfg, setCfg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [tpls, setTpls] = useState({});
  const [bids, setBids] = useState([]);

  const [session, setSession] = useState(null);
  const [step, setStep] = useState("enter"); // enter | signup | dashboard
  const [communityCode, setCommunityCode] = useState("");

  const [profile, setProfile] = useState({ company: "", first: "", last: "", email: "" });
  const [openBid, setOpenBid] = useState(null); // {tradeId}
  const [notes, setNotes] = useState("");
  const [lumpsumByPlan, setLumpsumByPlan] = useState({});
  const [unitPrices, setUnitPrices] = useState({}); // itemId -> unit price
  const [chatCtx, setChatCtx] = useState(null);

  useEffect(() => {
    setCfg(readLS(LS_KEYS.COMMUNITY_CONFIG, null));
    setDocs(readLS(LS_KEYS.DOCS, []));
    setTpls(readLS(LS_KEYS.TEMPLATES, {}));
    setBids(readLS(LS_KEYS.BIDS, []));

    const sess = readLS(LS_KEYS.SUB_SESSION, null);
    if (sess?.communityId) {
      setSession(sess);
      setProfile(sess.profile || profile);
      setStep("dashboard");
    }
  }, []);

  if (!cfg) return <div className="card"><Seed /><div className="hint">Loading…</div></div>;

  const tradeCatalog = demo.tradeCatalog;
  const tradesNeeded = cfg.tradesNeeded || [];

  const myBids = useMemo(() => {
    if (!session) return [];
    return bids.filter((b) => b.communityId === cfg.communityId && b.vendorId === session.vendorId);
  }, [bids, session, cfg]);

  function redeem() {
    if (!validCommunityCode(cfg, communityCode)) {
      alert("Invalid community code.");
      return;
    }
    setStep("signup");
  }

  function signup() {
    if (!profile.company || !profile.first || !profile.last || !profile.email) {
      alert("Please fill all fields.");
      return;
    }
    const vendorId = ("v-" + profile.email).replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    const sess = { communityId: cfg.communityId, vendorId, vendorName: profile.company, profile, at: Date.now() };
    writeLS(LS_KEYS.SUB_SESSION, sess);
    setSession(sess);
    setStep("dashboard");
  }

  function logout() {
    writeLS(LS_KEYS.SUB_SESSION, null);
    setSession(null);
    setStep("enter");
  }

  function startBid(tradeId) {
    const tpl = tpls[tradeId] || { mode: "lumpsum", items: [] };
    setNotes("");

    const ls = {};
    cfg.plans.forEach((p) => (ls[p.id] = ""));
    setLumpsumByPlan(ls);

    const up = {};
    (tpl.items || []).forEach((it) => (up[it.id] = ""));
    setUnitPrices(up);

    setOpenBid({ tradeId });
  }

  function calcPreviewTotal(tradeId) {
    const tpl = tpls[tradeId] || { mode: "lumpsum", items: [] };
    if (tpl.mode === "lumpsum") {
      return cfg.plans.reduce(
        (a, p) => a + (Number(String(lumpsumByPlan[p.id]).replace(/[^0-9.-]/g, "")) || 0),
        0
      );
    }
    let total = 0;
    for (const it of tpl.items || []) {
      const unit = Number(String(unitPrices[it.id]).replace(/[^0-9.-]/g, "")) || 0;
      for (const p of cfg.plans) {
        const q = Number(it.qtyByPlan?.[p.id]) || 0;
        total += unit * q;
      }
    }
    return total;
  }

  function submitBid() {
    if (!session || !openBid) return;
    const tradeId = openBid.tradeId;
    const tpl = tpls[tradeId] || { mode: "lumpsum", items: [] };

    const bid = {
      bidId: uid("bid"),
      communityId: cfg.communityId,
      vendorId: session.vendorId,
      vendorName: session.vendorName,
      tradeId,
      status: "submitted",
      submittedAt: nowISO(),
      format: { mode: tpl.mode },
      notes: notes || "",
      lumpsumByPlan: {},
      lineItems: [],
    };

    if (tpl.mode === "lumpsum") {
      cfg.plans.forEach((p) => {
        bid.lumpsumByPlan[p.id] = Number(String(lumpsumByPlan[p.id]).replace(/[^0-9.-]/g, "")) || 0;
      });
      const any = Object.values(bid.lumpsumByPlan).some((v) => v > 0);
      if (!any) {
        alert("Enter at least one plan lumpsum amount.");
        return;
      }
    } else {
      const lis = (tpl.items || []).map((it) => ({
        itemId: it.id,
        name: it.name,
        uom: it.uom,
        unitPrice: Number(String(unitPrices[it.id]).replace(/[^0-9.-]/g, "")) || 0,
      }));
      const any = lis.some((x) => x.unitPrice > 0);
      if (!any) {
        alert("Enter at least one unit price.");
        return;
      }
      bid.lineItems = lis;
    }

    const next = [...bids, bid];
    setBids(next);
    writeLS(LS_KEYS.BIDS, next);
    setOpenBid(null);
    alert("Bid submitted. Open Builder → Bid Analysis to review.");
  }

  return (
    <div>
      <Seed />
      <div className="card">
        <h1>Subcontractor Portal</h1>
        <div className="hint">
          Register using the <b>community code</b>. View documents. Submit bids only in the builder-defined format.
        </div>
      </div>

      {step === "enter" && (
        <div className="card">
          <h2>Enter community code</h2>
          <div className="row" style={{ marginTop: 12 }}>
            <input className="input" value={communityCode} onChange={(e) => setCommunityCode(e.target.value)} placeholder="Community code" />
            <button className="btn good" onClick={redeem}>Continue</button>
          </div>
          <div className="hint" style={{ marginTop: 10 }}>Demo code is on the Home page.</div>
        </div>
      )}

      {step === "signup" && (
        <div className="card">
          <h2>Create your account</h2>
          <div className="hint">Company + contact info. In production this includes verification and org-level controls.</div>
          <div className="grid2" style={{ marginTop: 12 }}>
            <input className="input" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} placeholder="Company name" />
            <input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="Email" />
            <input className="input" value={profile.first} onChange={(e) => setProfile({ ...profile, first: e.target.value })} placeholder="First name" />
            <input className="input" value={profile.last} onChange={(e) => setProfile({ ...profile, last: e.target.value })} placeholder="Last name" />
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge"><b>Community:</b>&nbsp;{cfg.communityName}</span>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn good" onClick={signup}>Create account</button>
            <button className="btn secondary" onClick={() => setStep("enter")}>Back</button>
          </div>
        </div>
      )}

      {step === "dashboard" && session && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h2>{session.vendorName}</h2>
              <div className="hint">Community: <b>{cfg.communityName}</b></div>
            </div>
            <button className="btn secondary" onClick={logout}>Log out</button>
          </div>

          <div className="hr"></div>

          <h2>Documents</h2>
          <div className="hint">Builder-managed documents are visible here for reference.</div>
          <div className="tablewrap" style={{ marginTop: 10 }}>
            <table>
              <thead><tr><th>Title</th><th>Link</th><th>Updated</th></tr></thead>
              <tbody>
                {docs.length === 0 ? (
                  <tr><td colSpan={3} className="small">No documents posted yet.</td></tr>
                ) : docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td className="small">{d.url ? <a className="link" href={d.url} target="_blank">Open</a> : "—"}</td>
                    <td className="small">{new Date(d.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hr"></div>

          <h2>Submit bids</h2>
          <div className="hint">Trades required by the builder are listed below.</div>
          <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
            {tradesNeeded.map((tid) => {
              const t = tradeCatalog.find((x) => x.id === tid);
              const tpl = tpls[tid] || { mode: "lumpsum", items: [] };
              return (
                <button key={tid} className="btn good" onClick={() => startBid(tid)}>
                  New {t?.name} bid ({tpl.mode}) →
                </button>
              );
            })}
          </div>

          <div className="hr"></div>

          <h2>My bids</h2>
          <div className="hint">You can message the builder per trade.</div>

          <div className="tablewrap" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Trade</th>
                  <th>Format</th>
                  <th>Submitted</th>
                  <th>Total</th>
                  <th>Notes</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {myBids.length === 0 ? (
                  <tr><td colSpan={6} className="small">No bids submitted yet.</td></tr>
                ) : myBids.map((b) => {
                  const tpl = tpls[b.tradeId] || { mode: "lumpsum", items: [] };
                  let total = 0;

                  if ((b.format?.mode || tpl.mode) === "lumpsum") {
                    total = Object.values(b.lumpsumByPlan || {}).reduce((a, c) => a + (Number(c) || 0), 0);
                  } else {
                    for (const it of tpl.items || []) {
                      const unit = Number((b.lineItems || []).find((x) => x.itemId === it.id)?.unitPrice) || 0;
                      for (const p of cfg.plans) {
                        total += unit * (Number(it.qtyByPlan?.[p.id]) || 0);
                      }
                    }
                  }

                  const tname = tradeCatalog.find((t) => t.id === b.tradeId)?.name || b.tradeId;

                  return (
                    <tr key={b.bidId}>
                      <td><b>{tname}</b></td>
                      <td className="small">{b.format?.mode || tpl.mode}</td>
                      <td className="small">{new Date(b.submittedAt).toLocaleString()}</td>
                      <td><b>{money(total)}</b></td>
                      <td className="small">{b.notes ? "Yes" : "—"}</td>
                      <td>
                        <button className="btn" onClick={() => setChatCtx({ tradeId: b.tradeId, tradeName: tname })}>
                          Open chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!openBid}
        title={
          openBid
            ? `Bid Form — ${demo.tradeCatalog.find((t) => t.id === openBid.tradeId)?.name || ""}`
            : "Bid Form"
        }
        onClose={() => setOpenBid(null)}
      >
        {openBid && (
          <BidForm
            cfg={cfg}
            tradeId={openBid.tradeId}
            tpl={tpls[openBid.tradeId] || { mode: "lumpsum", items: [] }}
            lumpsumByPlan={lumpsumByPlan}
            setLumpsumByPlan={setLumpsumByPlan}
            unitPrices={unitPrices}
            setUnitPrices={setUnitPrices}
            notes={notes}
            setNotes={setNotes}
            onSubmit={submitBid}
            calcPreviewTotal={calcPreviewTotal}
          />
        )}
      </Modal>

      <Modal
        open={!!chatCtx}
        title={chatCtx ? `Feedback Chat — Builder (${chatCtx.tradeName})` : "Feedback Chat"}
        onClose={() => setChatCtx(null)}
      >
        {chatCtx && session && (
          <ChatPanel
            communityId={cfg.communityId}
            vendorId={session.vendorId}
            vendorName={session.vendorName}
            tradeId={chatCtx.tradeId}
            tradeName={chatCtx.tradeName}
            currentUserRole="vendor"
          />
        )}
      </Modal>
    </div>
  );
}

function BidForm({
  cfg,
  tradeId,
  tpl,
  lumpsumByPlan,
  setLumpsumByPlan,
  unitPrices,
  setUnitPrices,
  notes,
  setNotes,
  onSubmit,
  calcPreviewTotal,
}) {
  return (
    <div>
      <div className="hint"><b>Format:</b> {tpl.mode}</div>
      <div className="hr"></div>

      {tpl.mode === "lumpsum" ? (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Plan</th><th>Sqft</th><th>Lumpsum</th></tr></thead>
            <tbody>
              {cfg.plans.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.name}</b></td>
                  <td className="small">{p.sqft.toLocaleString()}</td>
                  <td>
                    <input
                      className="input"
                      style={{ minWidth: 220 }}
                      value={lumpsumByPlan[p.id] ?? ""}
                      onChange={(e) => setLumpsumByPlan({ ...lumpsumByPlan, [p.id]: e.target.value })}
                      placeholder="$"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="hint">
            Enter unit pricing. Totals are calculated using builder-entered takeoffs/quantities per plan.
          </div>
          <div className="tablewrap" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>UOM</th>
                  <th>Unit Price</th>
                  {cfg.plans.map((p) => <th key={p.id}>Qty ({p.name})</th>)}
                </tr>
              </thead>
              <tbody>
                {(tpl.items || []).length === 0 ? (
                  <tr><td colSpan={3 + cfg.plans.length} className="small">Builder has not defined line items yet for this trade.</td></tr>
                ) : (tpl.items || []).map((it) => (
                  <tr key={it.id}>
                    <td>{it.name || <span className="small">Unnamed item</span>}</td>
                    <td className="small">{it.uom}</td>
                    <td>
                      <input
                        className="input"
                        style={{ minWidth: 180 }}
                        value={unitPrices[it.id] ?? ""}
                        onChange={(e) => setUnitPrices({ ...unitPrices, [it.id]: e.target.value })}
                        placeholder="$ / unit"
                      />
                    </td>
                    {cfg.plans.map((p) => (
                      <td key={p.id} className="small">
                        {Number(it.qtyByPlan?.[p.id] || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div className="hint">Notes / exclusions / clarifications</div>
        <textarea
          className="input"
          style={{ width: "100%", minHeight: 90, marginTop: 6 }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes here…"
        />
      </div>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <div className="badge"><b>Preview total:</b>&nbsp;{money(calcPreviewTotal(tradeId))}</div>
        <button className="btn good" onClick={onSubmit}>Submit bid</button>
      </div>
    </div>
  );
}
