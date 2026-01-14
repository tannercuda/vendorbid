"use client";

import demo from "../../data/demo.json";
import Seed from "../components/Seed";
import { LS_KEYS, readLS, writeLS, money, uid } from "../components/storage";
import { useEffect, useMemo, useState } from "react";

function findInvite(code){
  return demo.invites.find(i=>i.code.toUpperCase()===code.toUpperCase());
}

export default function Sub(){
  const [step,setStep] = useState("enter"); // enter | signup | dashboard | bid
  const [inviteCode,setInviteCode] = useState("");
  const [invite,setInvite] = useState(null);
  const [profile,setProfile] = useState({company:"",first:"",last:"",email:""});
  const [tradeId,setTradeId] = useState("");
  const [amounts,setAmounts] = useState({});
  const [notes,setNotes] = useState("");
  const [bids,setBids] = useState([]);

  useEffect(()=>{
    setBids(readLS(LS_KEYS.BIDS, []));
    const sess = readLS(LS_KEYS.SUB_SESSION, null);
    if (sess?.vendorId){
      const inv = demo.invites.find(i=>i.vendorId===sess.vendorId);
      if (inv){
        setInvite(inv);
        setProfile(sess.profile || profile);
        setStep("dashboard");
      }
    }
  },[]);

  const myBids = useMemo(()=>{
    if (!invite) return [];
    return bids.filter(b=>b.vendorId===invite.vendorId);
  },[bids, invite]);

  function redeem(){
    const inv = findInvite(inviteCode.trim());
    if (!inv) return alert("Invalid invite code. Use one from the Home page.");
    setInvite(inv);
    setStep("signup");
  }

  function signup(){
    if (!profile.company || !profile.first || !profile.last || !profile.email) return alert("Please fill all fields.");
    writeLS(LS_KEYS.SUB_SESSION, {vendorId: invite.vendorId, profile, at:Date.now()});
    setStep("dashboard");
  }

  function logout(){
    writeLS(LS_KEYS.SUB_SESSION, null);
    setInvite(null);
    setStep("enter");
  }

  function startBid(tid){
    setTradeId(tid);
    const init = {};
    for (const p of demo.plans) init[p.id] = "";
    setAmounts(init);
    setNotes("");
    setStep("bid");
  }

  function submitBid(){
    if (!invite) return;
    // basic validation: at least one plan value filled
    const any = Object.values(amounts).some(v=>String(v).trim()!=="");
    if (!any) return alert("Enter at least one plan amount.");

    const bid = {
      bidId: uid("bid"),
      communityId:"c1",
      vendorId: invite.vendorId,
      vendorName: invite.vendorName,
      tradeId,
      status:"submitted",
      submittedAt: new Date().toISOString(),
      amountsByPlan: Object.fromEntries(Object.entries(amounts).map(([k,v])=>[k, Number(String(v).replace(/[^0-9.-]/g,'')) || 0])),
      notes
    };

    const next = [...bids, bid];
    setBids(next);
    writeLS(LS_KEYS.BIDS, next);
    setStep("dashboard");
    alert("Bid submitted! Open the Builder portal to compare it.");
  }

  return (
    <div>
      <Seed />
      <div className="card">
        <h1>Subcontractor Portal</h1>
        <div className="hint">
          Redeem your invite code, view the bid package, and submit a trade bid by plan.
        </div>
      </div>

      {step==="enter" && (
        <div className="card">
          <h2>Enter invite code</h2>
          <div className="row" style={{marginTop:12}}>
            <input className="input" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="Invite code (e.g., 8 characters)" />
            <button className="btn good" onClick={redeem}>Redeem</button>
          </div>
          <div className="hint" style={{marginTop:10}}>Use any invite code listed on the Home page.</div>
        </div>
      )}

      {step==="signup" && invite && (
        <div className="card">
          <h2>Create your subcontractor account</h2>
          <div className="hint">For the POC, this is a simple signup screen. (In production: email verification, MFA optional.)</div>
          <div className="grid2" style={{marginTop:12}}>
            <input className="input" value={profile.company} onChange={e=>setProfile({...profile,company:e.target.value})} placeholder="Company name" />
            <input className="input" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} placeholder="Email" />
            <input className="input" value={profile.first} onChange={e=>setProfile({...profile,first:e.target.value})} placeholder="First name" />
            <input className="input" value={profile.last} onChange={e=>setProfile({...profile,last:e.target.value})} placeholder="Last name" />
          </div>
          <div className="row" style={{marginTop:12}}>
            <span className="badge"><b>Vendor:</b>&nbsp;{invite.vendorName}</span>
            <span className="badge"><b>Trades:</b>&nbsp;{invite.tradeIds.map(tid=>demo.trades.find(t=>t.id===tid)?.name).filter(Boolean).join(", ")}</span>
          </div>
          <div className="row" style={{marginTop:14}}>
            <button className="btn good" onClick={signup}>Create account</button>
            <button className="btn secondary" onClick={()=>setStep("enter")}>Back</button>
          </div>
        </div>
      )}

      {step==="dashboard" && invite && (
        <div className="card">
          <div className="row" style={{justifyContent:"space-between"}}>
            <div>
              <h2>{invite.vendorName}</h2>
              <div className="hint">Community: <b>{demo.community}</b></div>
            </div>
            <button className="btn secondary" onClick={logout}>Log out</button>
          </div>

          <div className="hr"></div>

          <h2>Bid package documents</h2>
          <div className="hint">In production these would be real downloads with access control.</div>
          <div className="row" style={{marginTop:10, flexWrap:"wrap"}}>
            {demo.docs.map(d=>(
              <span className="badge" key={d.title}>{d.title}</span>
            ))}
          </div>

          <div className="hr"></div>

          <h2>Submit a bid</h2>
          <div className="hint">Choose a trade and enter the lumpsum for each plan.</div>
          <div className="row" style={{marginTop:10, flexWrap:"wrap"}}>
            {invite.tradeIds.map(tid=>{
              const t = demo.trades.find(x=>x.id===tid);
              return (
                <button key={tid} className="btn good" onClick={()=>startBid(tid)}>
                  New {t?.name} bid →
                </button>
              )
            })}
          </div>

          <div className="hr"></div>

          <h2>My submitted bids</h2>
          <div className="tablewrap" style={{marginTop:10}}>
            <table>
              <thead>
                <tr>
                  <th>Trade</th>
                  <th>Submitted</th>
                  {demo.plans.map(p=><th key={p.id}>{p.name}</th>)}
                  <th>Sum</th>
                </tr>
              </thead>
              <tbody>
                {myBids.length===0 ? (
                  <tr><td className="small" colSpan={2+demo.plans.length+1}>No bids submitted yet.</td></tr>
                ) : myBids.map(b=>{
                  const sum = Object.values(b.amountsByPlan||{}).reduce((a,c)=>a+(Number(c)||0),0);
                  return (
                    <tr key={b.bidId}>
                      <td>{demo.trades.find(t=>t.id===b.tradeId)?.name}</td>
                      <td className="small">{new Date(b.submittedAt).toLocaleString()}</td>
                      {demo.plans.map(p=><td key={p.id}>{money(b.amountsByPlan?.[p.id])}</td>)}
                      <td><b>{money(sum)}</b></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="hint" style={{marginTop:10}}>
            After submitting, open the Builder portal and you will see your bid appear under that trade.
          </div>
        </div>
      )}

      {step==="bid" && invite && (
        <div className="card">
          <div className="row" style={{justifyContent:"space-between"}}>
            <div>
              <h2>Bid form — {demo.trades.find(t=>t.id===tradeId)?.name}</h2>
              <div className="hint">Enter a lumpsum per plan. (POC format to match your Excel.)</div>
            </div>
            <button className="btn secondary" onClick={()=>setStep("dashboard")}>Back</button>
          </div>

          <div className="hr"></div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Sqft</th>
                  <th>Lumpsum</th>
                </tr>
              </thead>
              <tbody>
                {demo.plans.map(p=>(
                  <tr key={p.id}>
                    <td><b>{p.name}</b></td>
                    <td className="small">{p.sqft.toLocaleString()}</td>
                    <td>
                      <input
                        className="input"
                        style={{minWidth:220}}
                        value={amounts[p.id] ?? ""}
                        onChange={e=>setAmounts({...amounts,[p.id]:e.target.value})}
                        placeholder="$"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:12}}>
            <div className="hint">Notes / clarifications</div>
            <textarea
              style={{width:"100%",minHeight:90,marginTop:6}}
              className="input"
              value={notes}
              onChange={e=>setNotes(e.target.value)}
              placeholder="Add exclusions, inclusions, assumptions, etc."
            />
          </div>

          <div className="row" style={{marginTop:12}}>
            <button className="btn good" onClick={submitBid}>Submit bid</button>
            <button className="btn secondary" onClick={()=>setStep("dashboard")}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
