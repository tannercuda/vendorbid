
"use client";
import Seed from "./components/Seed";
import demo from "../data/demo.json";
export default function Home() {
  return (
    <div className="card">
      <Seed />
      <h1>NCB Bid Portal – Clean POC</h1>
      <p>Builder Code: <b>{demo.builderAccessCode}</b></p>
      <p>Community Code: <b>{demo.communityCode}</b></p>
      <a className="btn good" href="/builder">Builder</a>{" "}
      <a className="btn secondary" href="/sub">Subcontractor</a>
    </div>
  );
}
