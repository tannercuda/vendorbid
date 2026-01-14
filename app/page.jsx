"use client";

import demo from "../data/demo.json";
import Seed from "./components/Seed";
import { LS_KEYS } from "./components/storage";

function reset() {
  if (typeof window === "undefined") return;
  Object.values(LS_KEYS).forEach((k) => window.localStorage.removeItem(k));
  window.location.reload();
}

export default function Page() {
  return (
    <div className="card">
      <Seed />
      <h1>POC v2 (Updated)</h1>
      <div className="hint">
        Updates: <b>one community code</b>, Builder setup for trades + templates, Builder-managed docs, vendor notes view, and Builder↔Vendor chat.
      </div>

      <div className="hr"></div>

      <div className="grid2">
        <div className="card" style={{ margin: 0 }}>
          <h2>Builder side</h2>
          <div className="hint">Setup trades/templates/docs, review bids, select vendors, message vendors.</div>
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn good" href="/builder">Open Builder →</a>
            <a className="btn secondary" href="/builder/setup">Setup →</a>
            <a className="btn secondary" href="/builder/analysis">Bid Analysis →</a>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge"><b>Builder code:</b>&nbsp;{demo.builderAccessCode}</span>
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <h2>Subcontractor side</h2>
          <div className="hint">Register using the community code, view docs, submit bids in required format, and chat with Builder.</div>
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn good" href="/sub">Open Sub →</a>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge"><b>Community code:</b>&nbsp;{demo.communityCode}</span>
          </div>
        </div>
      </div>

      <div className="hr"></div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="hint"><b>Demo reset:</b> clears bids, templates, docs, selections, and chat.</div>
        <button className="btn secondary" onClick={reset}>Reset demo data</button>
      </div>
    </div>
  );
}
