
export const LS_KEYS = {
  COMMUNITY_CONFIG: "ncb_cfg",
  DOCS: "ncb_docs",
  TEMPLATES: "ncb_tpls",
  BIDS: "ncb_bids",
  SELECTIONS: "ncb_sel"
};
export const readLS = (k, f) => {
  if (typeof window === "undefined") return f;
  try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; }
};
export const writeLS = (k, v) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
};
export const money = (n) => "$" + (Number(n)||0).toLocaleString();
