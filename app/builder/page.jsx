"use client";

import demo from "../../data/demo.json";
import Seed from "../components/Seed";
import { LS_KEYS, readLS, writeLS, money, sumObjValues } from "../components/storage";
import { useEffect, useMemo, useState } from "react";

function computeLowByTrade(bids, tradeId){
  const byVendor = new Map();
  for (const b of bids.filter(x=>x.tradeId===tradeId && x.status==="submitted")){
    const total = sumObjValues(b.amountsByPlan);
    const prev = byVendor.get(b.vendorId);
    if (!prev || total < prev.total){
      byVendor.set(b.vendorId, {vendorId:b.vendorId, vendorName:b.vendorName, total});
    }
  }
  let best = null;
  for (const v of byVendor.values()){
    if (!best || v.total < best.total) best = v;
  }
  return best;
}

function plansHeader(){
  return demo.plans.map(p=>p.name);
}

export default function Builder(){
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [bids, setBids] = useState([]);
  const [search, setSearch] = useState("");
  const [onlyVariance, setOnlyVariance] = useState(false);

  useEffect(()=>{
    const sess = readLS(LS_KEYS.BUILDER_SESSION, null);
    if (sess?.authed) setAuthed(true);
    setBids(readLS(LS_KEYS.BIDS, []));
  },[]);

  function login(){
    if (code.trim() === demo.builderAccessCode){
      writeLS(LS_KEYS.BUILDER_SESSION, {authed:true, at:Date.now()});
      setAuthed(true);
    }else{
      alert("Invalid builder code.");
    }
  }

  function logout(){
    writeLS(LS_KEYS.BUILDER_SESSION, {authed:false});
    setAuthed(false);
  }

  // selections per trade
  const [selections, setSelections] = useState({});
  useEffect(()=>{
    setSelections(readLS(LS_KEYS.SELECTIONS, {}));
  },[authed]);

  function saveSelections(next){
    setSelections(next);
    writeLS(LS_KEYS.SELECTIONS, next);
  }

  const computed = useMemo(()=>{
    const submitted = bids.filter(b=>b.status==="submitted");
    const lowByTrade = {};
    for (const t of demo.trades){
      lowByTrade[t.id] = computeLowByTrade(submitted, t.id);
    }

    // default selections if missing: low
    const sel = {...selections};
    let changed = false;
    for (const t of demo.trades){
      if (!sel[t.id] && lowByTrade[t.id]?.vendorId){
        sel[t.id] = lowByTrade[t.id].vendorId;
        changed = true;
      }
    }
    if (changed) {
      // persist once
      writeLS(LS_KEYS.SELECTIONS, sel);
      setSelections(sel);
    }

    // totals per plan for selected + low
    const selectedTotals = {};
    const lowTotals = {};
    for (const p of demo.plans){
      selectedTotals[p.id] = 0;
      lowTotals[p.id] = 0;
    }

    for (const t of demo.trades){
      const lowVendorId = lowByTrade[t.id]?.vendorId;
      const selVendorId = sel[t.id];

      const lowBid = submitted.find(b=>b.tradeId===t.id && b.vendorId===lowVendorId);
      const selBid = submitted.find(b=>b.tradeId===t.id && b.vendorId===selVendorId);

      for (const p of demo.plans){
        lowTotals[p.id] += Number(lowBid?.amountsByPlan?.[p.id]) || 0;
        selectedTotals[p.id] += Number(selBid?.amountsByPlan?.[p.id]) || 0;
      }
    }

    return {submitted, lowByTrade, selectedTotals, lowTotals, sel};
  },[bids, selections]);

  function exportCsv(){
    const rows = [];
    rows.push(["Trade","Vendor","IsLow","IsSelected",...demo.plans.map(p=>p.name),"Sum"].join(","));
    for (const t of demo.trades){
      const tradeBids = computed.submitted.filter(b=>b.tradeId===t.id);
      const lowId = computed.lowByTrade[t.id]?.vendorId;
      const selId = computed.sel[t.id];
      for (const b of tradeBids){
        const sum = sumObjValues(b.amountsByPlan);
        rows.push([
          esc(t.name),
          esc(b.vendorName),
          b.vendorId===lowId?1:0,
          b.vendorId===selId?1:0,
          ...demo.plans.map(p=>Number(b.amountsByPlan?.[p.id])||0),
          sum
        ].join(","));
      }
    }
    const blob = new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url;a.download="builder-bid-analysis.csv";document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
  }

  function esc(v){
    const s = String(v??"");
    if (s.includes(",")||s.includes('"')||s.includes("\n")) return '"' + s.replaceAll('"','""') + '"';
    return s;
  }

  if (!authed){
    return (
      <div className="card">
        <Seed />
        <h1>Builder Portal</h1>
        <div className="hint">Enter the Builder access code to view the bid analysis.</div>
        <div className="row" style={{marginTop:12}}>
          <input className="input" value={code} onChange={e=>setCode(e.target.value)} placeholder="Builder access code" />
          <button className="btn good" onClick={login}>Enter</button>
        </div>
        <div className="hint" style={{marginTop:10}}>You can find the code on the Home page.</div>
      </div>
    );
  }

  // render
  const planCols = plansHeader();

  const totalsRow = (label, obj, perSf=false) => (
    <tr>
      <td><b>{label}</b></td>
      {demo.plans.map(p=>{
        const v = obj[p.id] || 0;
        const out = perSf ? money(v/(Number(p.sqft)||1)) : money(v);
        return <td key={p.id}><b>{out}</b></td>
      })}
    </tr>
  );

  const showTrade = (t) => {
    if (search){
      const q = search.toLowerCase();
      const tradeMatch = t.name.toLowerCase().includes(q);
      const vendorMatch = computed.submitted.some(b=>b.tradeId===t.id && b.vendorName.toLowerCase().includes(q));
      if (!tradeMatch && !vendorMatch) return false;
    }
    if (onlyVariance){
      const lowId = computed.lowByTrade[t.id]?.vendorId;
      const selId = computed.sel[t.id];
      if (!lowId || !selId) return false;
      if (lowId === selId) return false;
    }
    return true;
  };

  return (
    <div>
      <Seed />
      <div className="card">
        <div className="row" style={{justifyContent:"space-between"}}>
          <div>
            <h1>Builder Portal — Bid Analysis</h1>
            <div className="hint">
              Community: <b>{demo.community}</b> • Bids submitted: <b>{computed.submitted.length}</b>
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={exportCsv}>Export CSV</button>
            <button className="btn secondary" onClick={logout}>Log out</button>
          </div>
        </div>

        <div className="hr"></div>
        <h2>Plans</h2>
        <div className="row" style={{marginTop:8, flexWrap:"wrap"}}>
          {demo.plans.map(p=>(
            <span className="badge" key={p.id}><b>{p.name}</b>&nbsp;•&nbsp;{p.sqft.toLocaleString()} SF</span>
          ))}
        </div>

        <div className="hr"></div>
        <h2>Totals</h2>
        <div className="tablewrap" style={{marginTop:10}}>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                {planCols.map(h=><th key={h}>{h}</th>)}
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
        <div className="row" style={{justifyContent:"space-between"}}>
          <div>
            <h2>Trade analysis</h2>
            <div className="hint">Select one vendor per trade. Low is calculated by total across plans.</div>
          </div>
          <div className="row">
            <input className="input" style={{minWidth:240}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trade or vendor…" />
            <label className="row" style={{gap:8, color:"var(--muted)", fontSize:12}}>
              <input type="checkbox" checked={onlyVariance} onChange={e=>setOnlyVariance(e.target.checked)} />
              Show only trades where selected ≠ low
            </label>
          </div>
        </div>

        <div className="tablewrap" style={{marginTop:12}}>
          <table>
            <thead>
              <tr>
                <th>Low</th>
                <th>Selected</th>
                <th>Trade / Vendor</th>
                {demo.plans.map(p=><th key={p.id}>{p.name}</th>)}
                <th>Sum</th>
                <th>Delta vs Low</th>
              </tr>
            </thead>
            <tbody>
              {demo.trades.filter(showTrade).map(trade=>{
                const tradeBids = computed.submitted.filter(b=>b.tradeId===trade.id);
                const lowId = computed.lowByTrade[trade.id]?.vendorId;
                const lowBid = tradeBids.find(b=>b.vendorId===lowId);
                const lowSum = sumObjValues(lowBid?.amountsByPlan||{});

                return (
                  <>
                    <tr className="group" key={trade.id+"-g"}>
                      <td colSpan={3+demo.plans.length+2}>{trade.name} <span className="small">— choose one Selected vendor</span></td>
                    </tr>
                    {tradeBids.length===0 ? (
                      <tr key={trade.id+"-none"}>
                        <td></td><td></td>
                        <td className="small">No bids submitted yet for this trade.</td>
                        {demo.plans.map(p=><td key={p.id}></td>)}
                        <td></td><td></td>
                      </tr>
                    ) : tradeBids.map(b=>{
                      const sum = sumObjValues(b.amountsByPlan);
                      const delta = sum - lowSum;
                      const isLow = b.vendorId===lowId;
                      const isSel = computed.sel[trade.id]===b.vendorId;
                      return (
                        <tr key={b.bidId}>
                          <td className={isLow?"low":""}>{isLow?"x":""}</td>
                          <td>
                            <label className="row" style={{gap:8}}>
                              <input
                                type="radio"
                                name={"sel-"+trade.id}
                                checked={isSel}
                                onChange={()=>{
                                  const next = {...computed.sel, [trade.id]: b.vendorId};
                                  saveSelections(next);
                                }}
                              />
                              <span className={isSel?"sel":""}>{isSel?"x":""}</span>
                            </label>
                          </td>
                          <td>{b.vendorName}</td>
                          {demo.plans.map(p=><td key={p.id}>{money(b.amountsByPlan?.[p.id])}</td>)}
                          <td><b>{money(sum)}</b></td>
                          <td>{delta===0 ? <span className="small">—</span> : (delta>0 ? <span className="warn">+{money(delta)}</span> : <span className="low">{money(delta)}</span>)}</td>
                        </tr>
                      )
                    })}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="hint" style={{marginTop:10}}>
          Want the Excel-accurate behavior where “Selected” can be marked even if a vendor has not bid every plan? We can add missing-value rules next.
        </div>
      </div>
    </div>
  )
}
