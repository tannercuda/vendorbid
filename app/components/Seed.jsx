
"use client";
import demo from "../../data/demo.json";
import { LS_KEYS, readLS, writeLS } from "./storage";
export default function Seed() {
  if (typeof window === "undefined") return null;
  if (!readLS(LS_KEYS.COMMUNITY_CONFIG)) {
    writeLS(LS_KEYS.COMMUNITY_CONFIG, {...demo, tradesNeeded: demo.tradeCatalog.map(t=>t.id)});
  }
  if (!readLS(LS_KEYS.TEMPLATES)) writeLS(LS_KEYS.TEMPLATES, {});
  if (!readLS(LS_KEYS.DOCS)) writeLS(LS_KEYS.DOCS, []);
  if (!readLS(LS_KEYS.BIDS)) writeLS(LS_KEYS.BIDS, []);
  return null;
}
