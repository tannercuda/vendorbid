"use client";

import { LS_KEYS, readLS, writeLS, nowISO, uid } from "./storage";
import { useEffect, useMemo, useState } from "react";

export default function ChatPanel({
  communityId,
  vendorId,
  vendorName,
  tradeId,
  tradeName,
  currentUserRole, // "builder" | "vendor"
}) {
  const key = `${communityId}::${vendorId}::${tradeId}`;
  const [text, setText] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    const all = readLS(LS_KEYS.CHAT, {});
    setChat(all[key] || []);
  }, [key]);

  const messages = useMemo(() => chat, [chat]);

  function send() {
    const t = text.trim();
    if (!t) return;

    const msg = { id: uid("m"), from: currentUserRole, text: t, at: nowISO() };
    const all = readLS(LS_KEYS.CHAT, {});
    const next = [...(all[key] || []), msg];
    all[key] = next;
    writeLS(LS_KEYS.CHAT, all);

    setChat(next);
    setText("");
  }

  return (
    <div>
      <div className="hint">
        <b>Channel:</b> {vendorName} ↔ Builder • <b>Trade:</b> {tradeName}
      </div>

      <div
        style={{
          marginTop: 10,
          border: "1px solid var(--line)",
          borderRadius: 16,
          background: "rgba(255,255,255,.03)",
          padding: 12,
          maxHeight: 340,
          overflow: "auto",
        }}
      >
        {messages.length === 0 ? (
          <div className="hint">No messages yet.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ margin: "10px 0" }}>
              <div className="small">
                <b style={{ color: m.from === "builder" ? "var(--accent)" : "var(--good)" }}>
                  {m.from === "builder" ? "Builder" : "Vendor"}
                </b>
                {" • "}
                {new Date(m.at).toLocaleString()}
              </div>
              <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 240 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button className="btn good" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
