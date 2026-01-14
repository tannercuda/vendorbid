"use client";

import Seed from "../../components/Seed";
import demo from "../../../data/demo.json";
import Modal from "../../components/Modal";
import ChatPanel from "../../components/ChatPanel";
import { LS_KEYS, readLS, writeLS, money, sumObjValues } from "../../components/storage";
import { useEffect, useMemo, useState } from "react";

function totalsByPlanForBid(bid, cfg, tpl) {
  const mode = bid.format?.mode || tpl?.mode || "lumpsum";
  const out = {};
  cfg.plans.forEach((p) => (out[p.id] = 0));

  if (mode === "lumpsum") {
    for (const p of cfg.plans) out[p.id] = Number(bid.lumpsumByPlan?.[p.id]) || 0;
    return out;
  }

  // line items: sum(unit price * qty) per plan
  for (const p of cfg.plans) {
    let tot = 0;
    for (const li of bid.lineItems || []) {
      const unit = Number(li.unitPrice) || 0;
      const it = (tpl?.items || []).find((x) => x.id === li.itemId);
      const q = Number(it?.qtyByPlan?.[p.id]) || 0;
      tot += unit * q;
    }
    out[p.id] = tot;
  }
  return out;
}

function avgPerPlanFromPlanTotals(planTotals, numPlans) {
  const sum = Object.values(planTotals || {}).reduce((a, c) => a + (Number(c) || 0), 0);
  return numPlans ? sum / numPlans : 0;
}

function computeLowVendorAvg(tradeId, bids, cfg, tpls) {
  const tradeBids = bids.filter((b) => b.tradeId === tradeId && b.status === "submitted");
  const nPlans = cfg.plans.length;

  let best = null;
  for (const b of tradeBids) {
    const tpl = tpls[tradeId] || { mode: "lumpsum", items: [] };
    const planTotals = totalsByPlanForBid(b, cfg, tpl);
    const avg = avgPerPlanFromPlanTotals(planTotals, nPlans);

    if (!best || avg < best.avg) best = { vendorId: b.vendorId, vendorName: b.vendorName, avg };
  }
  return best;
}

export default function Analysis() {
  const [cfg, setCfg] = useState(null);
  const [tpls, setTpls] = useState({});
  const [bids, setBids] = useState([]);
  const [selections, setSelections] = useState({});
  const [search, setSearch] = useState("");
  const [onlyVariance, setOnlyVariance] = useState(false);

  const [notesBid, setNotesBid] = useState(null);
  const [chatCtx, setChatCtx] = useState(null);

  useEffect(() => {
    setCfg(readLS(LS_KEYS.COMMUNITY_CONFIG, null));
    setTpls(readLS(LS_KEYS.TEMPLATES, {}));
    setBids(readLS(LS_KEYS.BIDS, []));
    setSelections(readLS(LS_KEYS.SELECTIONS, {}));
  }, []);

  if (!cfg) {
    return (
      <div className="card">
        <Seed />
        <div className="hint">Loading…</div>
      </div>
    );
  }

  const tradeCatalog = demo.tradeCatalog;
  const tradesNeeded = cfg.tradesNeeded || [];

  const computed = useMemo(() => {
    const submitted = bids.filter(
      (b) => b.status === "submitted" && b.communityId === cfg.communityId
    );

    // LOW vendor based on avg per plan
    const lowByTrade = {};
    for (const tid of tradesNeeded) {
      lowByTrade[tid] = computeLowVendorAvg(tid, submitted, cfg, tpls);
    }

    // default selections to low
    const sel = { ...selections };
    let changed = false;
    for (const tid of tradesNeeded) {
      if (!sel[tid] && lowByTrade[tid]?.vendorId) {
        sel[tid] = lowByTrade[tid].vendorId;
        changed = true;
      }
    }
    if (changed) {
      writeLS(LS_KEYS.SELECTIONS, sel);
      setSelections(sel);
    }

    // Totals selected vs low (by plan) so your top bands still behave like Excel
    const selectedTotals = {};
    const lowTotals = {};
    cfg.plans.forEach((p) => {
      selectedTotals[p.id] = 0;
      lowTotals[p.id] = 0;
    });

    for (const tid of tradesNeeded) {
      const tradeBids = submitted.filter((b) => b.tradeId === tid);

      const lowId = lowByTrade[tid]?.vendorId;
      const selId = sel[tid];

      const lowBid = tradeBids.find((b) => b.vendorId === lowId);
      const selBid = tradeBids.find((b) => b.vendorId === selId);

      const tpl = tpls[tid] || { mode: "lumpsum", items: [] };

      const lowPlanTotals = lowBid ? totalsByPlanForBid(lowBid, cfg, tpl) : null;
      const selPlanTotals = selBid ? totalsByPlanForBid(selBid, cfg, tpl) : null;

      for (const p of cfg.plans) {
        lowTotals[p.id] += Number(lowPlanTotals?.[p.id]) || 0;
        selectedTotals[p.id] += Number(selPlanTotals?.[p.id]) || 0;
      }
    }

    return { submitted, lowByTrade, selectedTotals, lowTotals, sel };
  }, [bids, selections, cfg, tpls]);

  function saveSelections(next) {
    setSelections(next);
    writeLS(LS_KEYS.SELECTIONS, next);
  }

  function exportCsv() {
    const rows = [];
    rows.push(
      [
        "Trade",
        "Vendor",
        "Format",
        ...cfg.plans.map((p) => p.name),
        "Sum",
        "AvgPerPlan",
        "IsLow",
        "IsSelected",
        "Notes",
      ].join(",")
    );

    for (const tid of tradesNeeded) {
      const tname = tradeCatalog.find((t) => t.id === tid)?.name || tid;
      const tpl = tpls[tid] || { mode: "lumpsum", items: [] };

      const tradeBids = computed.submitted.filter((b) => b.tradeId === tid);
      const lowId = computed.lowByTrade[tid]?.vendorId;
      const selId = computed.sel[tid];

      for (const b of tradeBids) {
        const planTotals = totalsByPlanForBid(b, cfg, tpl);
        const sum = sumObjValues(planTotals);
        const avg = cfg.plans.length ? sum / cfg.plans.length : 0;

        rows.push(
          [
            esc(tname),
            esc(b.vendorName),
            esc(b.format?.mode || tpl.mode),
            ...cfg.plans.map((p) => Number(planTotals[p.id]) || 0),
            sum,
            avg,
            b.vendorId === lowId ? 1 : 0,
            b.vendorId === selId ? 1 : 0,
            esc(b.notes || ""),
          ].join(",")
        );
      }
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bid-analysis-v2.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function esc(v) {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replaceAll('"', '""') + '"';
    return s;
  }

  const totalsRow = (label, obj, perSf = false) => (
    <tr>
      <td>
        <b>{label}</b>
      </td>
      {cfg.plans.map((p) => {
        const v = obj[p.id] || 0;
        const out = perSf ? money(v / (Number(p.sqft) || 1)) : money(v);
        return (
          <td key={p.id}>
            <b>{out}</b>
          </td>
        );
      })}
    </tr>
  );

  function showTrade(tid) {
    const tname = tradeCatalog.find((t) => t.id === tid)?.name || tid;

    if (search) {
      const q = search.toLowerCase();
      const tradeMatch = tname.toLowerCase().includes(q);
      const vendorMatch = computed.submitted.some(
        (b) => b.tradeId === tid && b.vendorName.toLowerCase().includes(q)
      );
      if (!tradeMatch && !vendorMatch) return false;
    }

    if (onlyVariance) {
      const lowId = computed.lowByTrade[tid]?.vendorId;
      const selId = computed.sel[tid];
      if (!lowId || !selId) return false;
      if (lowId === selId) return false;
    }

    return true;
  }

  return (
    <div>
      <Seed />

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1>Bid Analysis</h1>
            <div className="hint">
              Community: <b>{cfg.communityName}</b> • Trades needed: <b>{tradesNeeded.length}</b> • Submitted bids:{" "}
              <b>{computed.submitted.length}</b>
              <br />
              <b>Low</b> = <b>(sum of all plan costs ÷ # of plans)</b> → per-plan average
            </div>
          </div>
          <div className="row">
            <a className="btn secondary" href="/builder/setup">
              Setup
            </a>
            <button className="btn" onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="hr"></div>

        <h2>Totals</h2>
        <div className="tablewrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                {cfg.plans.map((p) => (
                  <th key={p.id}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {totalsRow("Direct costs with Selected vendors", computed.selectedTotals)}
              {totalsRow("Selected $/SF", computed.selectedTotals, true)}
              {totalsRow("Direct costs with Lowest vendors", computed.lowTotals)}
              {totalsRow("Lowest $/SF", computed.lowTotals, true)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Trade analysis</h2>
            <div className="hint">
              Low is based on <b>Avg/Plan</b>. Selected is one vendor per trade. Notes + Feedback are per vendor per trade.
            </div>
          </div>
          <div className="row">
            <input
              className="input"
              style={{ minWidth: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trade or vendor…"
            />
            <label className="row" style={{ gap: 8, color: "var(--muted)", fontSize: 12 }}>
              <input
                type="checkbox"
                checked={onlyVariance}
                onChange={(e) => setOnlyVariance(e.target.checked)}
              />
              Show only trades where selected ≠ low
            </label>
          </div>
        </div>

        <div className="tablewrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Low</th>
                <th>Selected</th>
                <th>Trade / Vendor</th>
                {cfg.plans.map((p) => (
                  <th key={p.id}>{p.name}</th>
                ))}
                <th>Sum</th>
                <th>Avg/Plan</th>
                <th>Delta vs Low (Avg)</th>
                <th>Notes</th>
                <th>Feedback</th>
              </tr>
            </thead>

            <tbody>
              {tradesNeeded.filter(showTrade).map((tid) => {
                const tname = tradeCatalog.find((t) => t.id === tid)?.name || tid;
                const tpl = tpls[tid] || { mode: "lumpsum", items: [] };

                const tradeBids = computed.submitted.filter((b) => b.tradeId === tid);
                const lowId = computed.lowByTrade[tid]?.vendorId;
                const lowBid = tradeBids.find((b) => b.vendorId === lowId);

                const lowPlanTotals = lowBid ? totalsByPlanForBid(lowBid, cfg, tpl) : null;
                const lowSum = sumObjValues(lowPlanTotals || {});
                const lowAvg = cfg.plans.length ? lowSum / cfg.plans.length : 0;

                return (
                  <>
                    <tr className="group" key={tid + "-g"}>
                      <td colSpan={6 + cfg.plans.length}>
                        {tname} <span className="small">— format: <b>{tpl.mode}</b></span>
                      </td>
                      <td colSpan={3} className="small"></td>
                    </tr>

                    {tradeBids.length === 0 ? (
                      <tr key={tid + "-none"}>
                        <td></td>
                        <td></td>
                        <td className="small">No bids submitted yet for this trade.</td>
                        {cfg.plans.map((p) => (
                          <td key={p.id}></td>
                        ))}
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ) : (
                      tradeBids.map((b) => {
                        const isLow = b.vendorId === lowId;
                        const isSel = computed.sel[tid] === b.vendorId;

                        const planTotals = totalsByPlanForBid(b, cfg, tpl);
                        const sum = sumObjValues(planTotals);
                        const avg = cfg.plans.length ? sum / cfg.plans.length : 0;
                        const deltaAvg = avg - lowAvg;

                        return (
                          <tr key={b.bidId}>
                            <td className={isLow ? "low" : ""}>{isLow ? "x" : ""}</td>

                            <td>
                              <label className="row" style={{ gap: 8 }}>
                                <input
                                  type="radio"
                                  name={"sel-" + tid}
                                  checked={isSel}
                                  onChange={() => {
                                    const next = { ...computed.sel, [tid]: b.vendorId };
                                    saveSelections(next);
                                  }}
                                />
                                <span className={isSel ? "sel" : ""}>{isSel ? "x" : ""}</span>
                              </label>
                            </td>

                            <td>
                              <div><b>{b.vendorName}</b></div>
                              <div className="small">Submitted {new Date(b.submittedAt).toLocaleString()}</div>
                            </td>

                            {cfg.plans.map((p) => (
                              <td key={p.id}>{money(planTotals[p.id])}</td>
                            ))}

                            <td><b>{money(sum)}</b></td>
                            <td><b>{money(avg)}</b></td>

                            <td>
                              {deltaAvg === 0 ? (
                                <span className="small">—</span>
                              ) : deltaAvg > 0 ? (
                                <span className="warn">+{money(deltaAvg)}</span>
                              ) : (
                                <span className="low">{money(deltaAvg)}</span>
                              )}
                            </td>

                            <td>
                              <button className="btn" onClick={() => setNotesBid({ tradeId: tid, tradeName: tname, bid: b })}>
                                View
                              </button>
                            </td>

                            <td>
                              <button
                                className="btn good"
                                onClick={() =>
                                  setChatCtx({
                                    vendorId: b.vendorId,
                                    vendorName: b.vendorName,
                                    tradeId: tid,
                                    tradeName: tname,
                                  })
                                }
                              >
                                Chat
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!notesBid}
        title={
          notesBid ? `Vendor Notes — ${notesBid.bid.vendorName} (${notesBid.tradeName})` : "Vendor Notes"
        }
        onClose={() => setNotesBid(null)}
      >
        {notesBid && (
          <div>
            <div className="hint"><b>Bid format:</b> {notesBid.bid.format?.mode || (tpls[notesBid.tradeId]?.mode || "lumpsum")}</div>
            <div className="hr"></div>
            <div style={{ whiteSpace: "pre-wrap" }}>{notesBid.bid.notes || "No notes provided."}</div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!chatCtx}
        title={
          chatCtx ? `Feedback Chat — ${chatCtx.vendorName} (${chatCtx.tradeName})` : "Feedback Chat"
        }
        onClose={() => setChatCtx(null)}
      >
        {chatCtx && (
          <ChatPanel
            communityId={cfg.communityId}
            vendorId={chatCtx.vendorId}
            vendorName={chatCtx.vendorName}
            tradeId={chatCtx.tradeId}
            tradeName={chatCtx.tradeName}
            currentUserRole="builder"
          />
        )}
      </Modal>
    </div>
  );
}
