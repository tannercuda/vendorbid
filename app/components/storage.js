export const LS_KEYS = {
  BIDS: "ncb_poc_bids_v1",
  SELECTIONS: "ncb_poc_selections_v1",
  SUB_SESSION: "ncb_poc_sub_session_v1",
  BUILDER_SESSION: "ncb_poc_builder_session_v1",
};

export function readLS(key, fallback){
  if (typeof window === "undefined") return fallback;
  try{
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{ return fallback; }
}

export function writeLS(key, value){
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function money(n){
  if (n===null || n===undefined || Number.isNaN(n)) return "";
  const v = Number(n);
  return v.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0});
}

export function sumObjValues(obj){
  return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);
}

export function uid(prefix="id"){
  return prefix + "-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}
