import DemoCodes from "./components/DemoCodes";

export default function Page(){
  return (
    <div className="card">
      <h1>POC: Builder + Subcontractor Bid Portal</h1>
      <div className="hint">
        This demo is designed so you can deploy to Vercel and test both sides immediately.
        <br/>All data is stored in <b>your browser</b> (localStorage) so it behaves like a real app without needing a database.
      </div>
      <div className="hr"></div>
      <div className="grid2">
        <div className="card" style={{margin:0}}>
          <h2>Builder side</h2>
          <div className="hint">Review bids, select vendors per trade, and see totals update (Selected vs Low).</div>
          <div style={{marginTop:12}}>
            <a className="btn good" href="/builder">Open Builder Portal →</a>
          </div>
        </div>
        <div className="card" style={{margin:0}}>
          <h2>Subcontractor side</h2>
          <div className="hint">Redeem an invite code, view package docs, and submit a bid by trade & plan.</div>
          <div style={{marginTop:12}}>
            <a className="btn good" href="/sub">Open Subcontractor Portal →</a>
          </div>
        </div>
      </div>
      <div className="hr"></div>
      <DemoCodes />
    </div>
  )
}
