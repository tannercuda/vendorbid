"use client";

import demo from "../../data/demo.json";
import { LS_KEYS, readLS, writeLS, uid, nowISO } from "./storage";

function defaultConfig() {
  return {
    communityId: demo.communityId,
    communityName: demo.communityName,
    communityCode: demo.communityCode,
    plans: demo.plans,
    tradesNeeded: ["trade1", "trade2", "trade3", "trade4", "trade5", "trade6"],
  };
}

function defaultDocs() {
  return [
    { id: uid("doc"), title: "Community Specs.pdf", url: "", updatedAt: nowISO() },
    { id: uid("doc"), title: "Takeoffs.xlsx", url: "", updatedAt: nowISO() },
    { id: uid("doc"), title: "Plan Set (All).pdf", url: "", updatedAt: nowISO() },
  ];
}

function defaultTemplates(cfg) {
  const makeQty = () => Object.fromEntries((cfg.plans || demo.plans).map((p) => [p.id, 1]));

  return {
    trade1: { mode: "lumpsum", items: [] },
    trade2: { mode: "lumpsum", items: [] },
    trade3: {
      mode: "lineitems",
      items: [
        { id: uid("it"), name: "Rough plumbing labor", uom: "EA", qtyByPlan: makeQty() },
        { id: uid("it"), name: "Fixtures allowance", uom: "Allowance", qtyByPlan: makeQty() },
      ],
    },
    trade4: { mode: "lumpsum", items: [] },
    trade5: { mode: "lumpsum", items: [] },
    trade6: { mode: "lumpsum", items: [] },
  };
}

function seedBidsOnce() {
  const existing = readLS(LS_KEYS.BIDS, null);
  if (existing) return;

  const bids = [
    {
      bidId: uid("bid"),
      communityId: demo.communityId,
      vendorId: "v-seeded-sunrise",
      vendorName: "Sunrise Concrete",
      tradeId: "trade1",
      status: "submitted",
      submittedAt: nowISO(),
      format: { mode: "lumpsum" },
      lumpsumByPlan: { plan1: 3200, plan2: 3450, plan3: 3600, plan4: 3725 },
      lineItems: [],
      notes: "Includes standard flatwork. Excludes permits.",
    },
    {
      bidId: uid("bid"),
      communityId: demo.communityId,
      vendorId: "v-seeded-timberline",
      vendorName: "Timberline Framing",
      tradeId: "trade2",
      status: "submitted",
      submittedAt: nowISO(),
      format: { mode: "lumpsum" },
      lumpsumByPlan: { plan1: 9800, plan2: 10250, plan3: 10750, plan4: 11200 },
      lineItems: [],
      notes: "Includes labor + nails. Excludes crane.",
    },
  ];

  writeLS(LS_KEYS.BIDS, bids);
}

export default function Seed() {
  const cfgExisting = readLS(LS_KEYS.COMMUNITY_CONFIG, null);
  const cfg = cfgExisting || defaultConfig();
  if (!cfgExisting) writeLS(LS_KEYS.COMMUNITY_CONFIG, cfg);

  if (!readLS(LS_KEYS.DOCS, null)) writeLS(LS_KEYS.DOCS, defaultDocs());
  if (!readLS(LS_KEYS.TEMPLATES, null)) writeLS(LS_KEYS.TEMPLATES, defaultTemplates(cfg));

  seedBidsOnce();
  return null;
}
