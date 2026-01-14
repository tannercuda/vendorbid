"use client";

import demo from "../../data/demo.json";
import { LS_KEYS, readLS, writeLS } from "./storage";

export default function Seed(){
  // Seed bids only once
  const existing = readLS(LS_KEYS.BIDS, null);
  if (!existing){
    const seeded = demo.seedBids || [];
    writeLS(LS_KEYS.BIDS, seeded);
  }
  // Seed selections default to low vendor later
  return null;
}
