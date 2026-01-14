"use client";

import Seed from "../../components/Seed";
import demo from "../../../data/demo.json";
import Modal from "../../components/Modal";
import { LS_KEYS, readLS, writeLS, uid, nowISO } from "../../components/storage";
import { useEffect, useMemo, useState } from "react";

export default function Setup() {
  const [cfg, setCfg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [tpls, setTpls] = useState({});
  const [openTrade, setOpenTrade] = useState(null); // tradeId

  useEffect(() => {
    setCfg(readLS(LS_KEYS.COMMUNITY_CONFIG, null));
    setDocs(readLS(LS_KEYS.DOCS, []));
    setTpls(readLS(LS_KEYS.TEMPLATES, {}));
  }, []);

  const tradeCatalog = demo.tradeCatalog;

  function toggleTrade(id) {
    const next = { ...cfg };
    const set = new Set(next.tradesNeeded || []);
    if (set.has(id)) set.delete(id);
    e
