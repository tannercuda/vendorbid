
"use client";
import Seed from "../components/Seed";
export default function BuilderHome() {
  return (
    <div className="card">
      <Seed />
      <h1>Builder Portal</h1>
      <a className="btn good" href="/builder/setup">Setup</a>{" "}
      <a className="btn secondary" href="/builder/analysis">Bid Analysis</a>
    </div>
  );
}
