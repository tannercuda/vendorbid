"use client";

import Seed from "../../components/Seed";
import demo from "../../../data/demo.json";
import Modal from "../../components/Modal";
import { LS_KEYS, readLS, writeLS, uid, nowISO } from "../../components/storage";
import { useEffect, useMemo, useState } from "react";

export default function Setup() {
  const [cfg, setCfg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [tpls, setTpls] = useState({});
  const [openTrade, setOpenTrade] = useState(null); // tradeId

  useEffect(() => {
    setCfg(readLS(LS_KEYS.COMMUNITY_CONFIG, null));
    setDocs(readLS(LS_KEYS.DOCS, []));
    setTpls(readLS(LS_KEYS.TEMPLATES, {}));
  }, []);

  const tradeCatalog = demo.tradeCatalog;

  function toggleTrade(id) {
    const next = { ...cfg };
    const set = new Set(next.tradesNeeded || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    next.tradesNeeded = Array.from(set);
    setCfg(next);
    writeLS(LS_KEYS.COMMUNITY_CONFIG, next);
  }

  function setMode(tradeId, mode) {
    const next = { ...tpls };
    next[tradeId] = next[tradeId] || { mode: "lumpsum", items: [] };
    next[tradeId].mode = mode;
    setTpls(next);
    writeLS(LS_KEYS.TEMPLATES, next);
  }

  function addItem(tradeId) {
    const next = { ...tpls };
    next[tradeId] = next[tradeId] || { mode: "lineitems", items: [] };

    const qtyByPlan = {};
    (cfg?.plans || demo.plans).forEach((p) => (qtyByPlan[p.id] = 1));

    next[tradeId].items = [
      ...(next[tradeId].items || []),
      { id: uid("it"), name: "", uom: "EA", qtyByPlan },
    ];

    setTpls(next);
    writeLS(LS_KEYS.TEMPLATES, next);
  }

  function updateItem(tradeId, itemId, patch) {
    const next = { ...tpls };
    const items = (next[tradeId]?.items || []).map((it) =>
      it.id === itemId ? { ...it, ...patch } : it
    );
    next[tradeId] = { ...next[tradeId], items };
    setTpls(next);
    writeLS(LS_KEYS.TEMPLATES, next);
  }

  function removeItem(tradeId, itemId) {
    const next = { ...tpls };
    next[tradeId].items = (next[tradeId]?.items || []).filter((it) => it.id !== itemId);
    setTpls(next);
    writeLS(LS_KEYS.TEMPLATES, next);
  }

  function addDoc() {
    const title = prompt("Document title (e.g., Plumbing Scope Sheet.pdf)");
    if (!title) return;
    const url = prompt("Optional URL (can be blank for now):", "") || "";
    const next = [...docs, { id: uid("doc"), title, url, updatedAt: nowISO() }];
    setDocs(next);
    writeLS(LS_KEYS.DOCS, next);
  }

  function editDoc(doc) {
    const title = prompt("Update title:", doc.title);
    if (!title) return;
    const url = prompt("Update URL (blank ok):", doc.url || "") || "";
    const next = docs.map((d) =>
      d.id === doc.id ? { ...d, title, url, updatedAt: nowISO() } : d
    );
    setDocs(next);
    writeLS(LS_KEYS.DOCS, next);
  }

  function deleteDoc(doc) {
    if (!confirm("Remove this document?")) return;
    const next = docs.filter((d) => d.id !== doc.id);
    setDocs(next);
    writeLS(LS_KEYS.DOCS, next);
  }

  const activeTrades = useMemo(() => {
    if (!cfg) return [];
    return (cfg.tradesNeeded || [])
      .map((id) => tradeCatalog.find((t) => t.id === id))
      .filter(Boolean);
  }, [cfg]);

  if (!cfg) {
    return (
      <div className="card">
        <Seed />
        <div className="hint">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <Seed />
      <div className="card">
        <h1>Builder Setup</h1>
        <div className="hint">
          Configure required trades and the bid submission format per trade. Manage community documents.
          <br />
          Subcontractors register using <b>one community code</b>: <b>{cfg.communityCode}</b>
        </div>

        <div className="hr"></div>

        <h2>Trades needed</h2>
        <div className="hint">Select which trades you want bids for on this community.</div>
        <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
          {tradeCatalog.map((t) => {
            const on = (cfg.tradesNeeded || []).includes(t.id);
            return (
              <button
                key={t.id}
                className={"btn " + (on ? "good" : "secondary")}
                onClick={() => toggleTrade(t.id)}
              >
                {on ? "✓ " : ""}
                {t.name}
              </button>
            );
          })}
        </div>

        <div className="hr"></div>

        <h2>Bid format templates</h2>
        <div className="hint">
          For each trade, choose <b>Lumpsum</b> (vendor enters one amount per plan) or{" "}
          <b>Line items</b> (builder defines items + UOM + takeoffs/qty per plan; vendor enters unit price).
        </div>

        <div className="tablewrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Trade</th>
                <th>Format</th>
                <th>Configure</th>
              </tr>
            </thead>
            <tbody>
              {activeTrades.map((t) => {
                const tpl = tpls[t.id] || { mode: "lumpsum", items: [] };
                return (
                  <tr key={t.id}>
                    <td>
                      <b>{t.name}</b>
                    </td>
                    <td>
                      <div className="row">
                        <button
                          className={"btn " + (tpl.mode === "lumpsum" ? "good" : "secondary")}
                          onClick={() => setMode(t.id, "lumpsum")}
                        >
                          Lumpsum
                        </button>
                        <button
                          className={"btn " + (tpl.mode === "lineitems" ? "good" : "secondary")}
                          onClick={() => setMode(t.id, "lineitems")}
                        >
                          Line items
                        </button>
                      </div>
                    </td>
                    <td>
                      <button className="btn" onClick={() => setOpenTrade(t.id)}>
                        Edit template
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="hr"></div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Documents</h2>
            <div className="hint">
              Only Builder can add/modify/remove. Vendors can view these once registered.
            </div>
          </div>
          <button className="btn good" onClick={addDoc}>
            Add document
          </button>
        </div>

        <div className="tablewrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>URL</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="small">
                    No documents yet.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td className="small">
                      {d.url ? (
                        <a className="link" href={d.url} target="_blank">
                          Open link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="small">{new Date(d.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="row">
                        <button className="btn" onClick={() => editDoc(d)}>
                          Edit
                        </button>
                        <button className="btn bad" onClick={() => deleteDoc(d)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="hr"></div>

        <div className="row">
          <a className="btn good" href="/builder/analysis">
            Go to Bid Analysis →
          </a>
          <a className="btn secondary" href="/builder">
            Back to Builder Home
          </a>
        </div>
      </div>

      <Modal
        open={!!openTrade}
        title={
          "Edit Template — " + (tradeCatalog.find((t) => t.id === openTrade)?.name || "")
        }
        onClose={() => setOpenTrade(null)}
      >
        {openTrade && (
          <TemplateEditor
            tradeId={openTrade}
            tradeName={tradeCatalog.find((t) => t.id === openTrade)?.name || ""}
            cfg={cfg}
            tpl={tpls[openTrade] || { mode: "lumpsum", items: [] }}
            onSetMode={setMode}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
          />
        )}
      </Modal>
    </div>
  );
}

function TemplateEditor({
  tradeId,
  tradeName,
  cfg,
  tpl,
  onSetMode,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}) {
  const plans = cfg.plans || [];

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="hint">
          <b>{tradeName}</b> template controls how vendors submit bids for this trade.
        </div>
        <div className="row">
          <button
            className={"btn " + (tpl.mode === "lumpsum" ? "good" : "secondary")}
            onClick={() => onSetMode(tradeId, "lumpsum")}
          >
            Lumpsum
          </button>
          <button
            className={"btn " + (tpl.mode === "lineitems" ? "good" : "secondary")}
            onClick={() => onSetMode(tradeId, "lineitems")}
          >
            Line items
          </button>
        </div>
      </div>

      {tpl.mode === "lumpsum" ? (
        <div className="hint" style={{ marginTop: 12 }}>
          Vendors will enter one lumpsum per plan + optional notes.
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h2>Line items</h2>
              <div className="hint">
                Define items, UOM, and takeoffs/quantities per plan. Vendors enter unit pricing.
              </div>
            </div>
            <button className="btn good" onClick={() => onAddItem(tradeId)}>
              Add item
            </button>
          </div>

          <div className="tablewrap" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>UOM</th>
                  {plans.map((p) => (
                    <th key={p.id}>Qty ({p.name})</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(tpl.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={3 + plans.length} className="small">
                      No items yet. Add an item.
                    </td>
                  </tr>
                ) : (
                  (tpl.items || []).map((it) => (
                    <tr key={it.id}>
                      <td>
                        <input
                          className="input"
                          value={it.name}
                          onChange={(e) => onUpdateItem(tradeId, it.id, { name: e.target.value })}
                          placeholder="Item name"
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          style={{ minWidth: 140 }}
                          value={it.uom}
                          onChange={(e) => onUpdateItem(tradeId, it.id, { uom: e.target.value })}
                          placeholder="UOM (SF, LF, EA)"
                        />
                      </td>
                      {plans.map((p) => (
                        <td key={p.id}>
                          <input
                            className="input"
                            style={{ minWidth: 120 }}
                            value={it.qtyByPlan?.[p.id] ?? 0}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              const qtyByPlan = { ...(it.qtyByPlan || {}), [p.id]: v };
                              onUpdateItem(tradeId, it.id, { qtyByPlan });
                            }}
                            placeholder="Qty"
                          />
                        </td>
                      ))}
                      <td>
                        <button className="btn bad" onClick={() => onRemoveItem(tradeId, it.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            Tip: Set Qty=1 if you want that line item to behave like a lumpsum line.
          </div>
        </div>
      )}
    </div>
  );
}

