"use client";

import demo from "../../data/demo.json";
import { LS_KEYS, readLS, writeLS } from "./storage";

function clearAll(){
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEYS.BIDS);
  window.localStorage.removeItem(LS_KEYS.SELECTIONS);
  window.localStorage.removeItem(LS_KEYS.SUB_SESSION);
  window.localStorage.removeItem(LS_KEYS.BUILDER_SESSION);
  // also seed bids again on next load
  window.location.reload();
}

export default function DemoCodes(){
  return (
    <div>
      <h2>Demo access</h2>
      <div className="hint">Use these codes to test the flows. You can also reset the browser data at any time.</div>
      <div className="row" style={{marginTop:10}}>
        <span className="badge"><b>Builder code:</b>&nbsp;{demo.builderAccessCode}</span>
        <button className="btn secondary" onClick={clearAll}>Reset demo data</button>
      </div>

      <div className="card" style={{margin:"14px 0 0"}}>
        <h2>Subcontractor invite codes</h2>
        <div className="hint">Pick any vendor code below, redeem it in the Subcontractor portal, then submit bids. Refresh the Builder page to see them.</div>
        <div className="tablewrap" style={{marginTop:10}}>
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Invite Code</th>
                <th>Trades</th>
              </tr>
            </thead>
            <tbody>
              {demo.invites.map(inv=>(
                <tr key={inv.code}>
                  <td>{inv.vendorName}</td>
                  <td><b>{inv.code}</b></td>
                  <td className="small">
                    {inv.tradeIds.map(tid=>demo.trades.find(t=>t.id===tid)?.name).filter(Boolean).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hint" style={{marginTop:10}}>
          Tip: open Builder and Subcontractor in two tabs so you can submit a bid and instantly compare it.
        </div>
      </div>
    </div>
  );
}
