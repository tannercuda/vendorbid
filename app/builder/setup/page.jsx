
"use client";
import Seed from "../../components/Seed";
export default function Setup() {
  return (
    <div className="card">
      <Seed />
      <h1>Builder Setup</h1>
      <p>Routing + base setup verified.</p>
      <a className="btn secondary" href="/builder">Back</a>
    </div>
  );
}
