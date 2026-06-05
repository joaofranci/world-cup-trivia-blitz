const KEY = "wct.profile";
const TROPHIES_KEY = "wct.trophies";

export interface Profile {
  playerId: string;
  nickname: string;
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getProfile(): Profile {
  if (typeof window === "undefined") return { playerId: "", nickname: "Guest" };
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const p: Profile = { playerId: uuid(), nickname: `Striker${Math.floor(Math.random() * 9999)}` };
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export function setNickname(nickname: string): Profile {
  const p = getProfile();
  const next = { ...p, nickname: nickname.trim().slice(0, 20) || p.nickname };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function getTrophyCount(): Record<string, number> {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem(TROPHIES_KEY) || "{}");
}

export function addTrophy(category: string) {
  const t = getTrophyCount();
  t[category] = (t[category] || 0) + 1;
  localStorage.setItem(TROPHIES_KEY, JSON.stringify(t));
}
