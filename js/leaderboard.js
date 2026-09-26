const SUPABASE_URL = 'https://wyxvivoqzmgkuktcztqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XU11yQujdQhqu8ej5x6SMA_Yp93KHO2';

const DEVICE_KEY = 'oliMoonDeviceToken';
const CACHE_KEY = 'oliCatchLeaderboard';

const normalizeName = (value = '') => String(value).trim().toLocaleLowerCase('zh-Hant');

function getDeviceToken() {
  let token = localStorage.getItem(DEVICE_KEY);
  if (!token) {
    token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, token);
  }
  return token;
}

async function getDeviceHash() {
  const bytes = new TextEncoder().encode(`oli-moonlight-v1:${getDeviceToken()}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readCache() {
  try {
    const rows = JSON.parse(localStorage.getItem(CACHE_KEY));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeCache(rows) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(rows.slice(0, 10)));
}

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

async function rpc(name, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `排行榜連線失敗（${response.status}）`);
    error.code = data?.code || '';
    throw error;
  }
  return data;
}

export async function claimPlayerName(name) {
  if (!configured()) return { ok: true, cloud: false };
  try {
    const deviceHash = await getDeviceHash();
    const accepted = await rpc('claim_oli_player', { p_name: name.trim(), p_device_hash: deviceHash });
    return accepted ? { ok: true, cloud: true } : { ok: false, reason: 'name_taken', cloud: true };
  } catch (error) {
    if (/name_taken|already claimed/i.test(error.message)) return { ok: false, reason: 'name_taken', cloud: true };
    console.warn('Shared leaderboard claim failed:', error);
    return { ok: false, reason: 'offline', cloud: true };
  }
}

export async function submitSharedScore(name, score, combo) {
  if (!configured()) return { ok: false, cloud: false };
  try {
    const deviceHash = await getDeviceHash();
    const accepted = await rpc('submit_oli_score', {
      p_name: name.trim(),
      p_device_hash: deviceHash,
      p_score: Math.max(0, Number(score) || 0),
      p_combo: Math.max(0, Number(combo) || 0),
    });
    return accepted ? { ok: true, cloud: true } : { ok: false, reason: 'name_taken', cloud: true };
  } catch (error) {
    console.warn('Shared leaderboard submit failed:', error);
    return { ok: false, reason: /name_taken/i.test(error.message) ? 'name_taken' : 'offline', cloud: true };
  }
}

export async function fetchSharedLeaderboard() {
  if (!configured()) return readCache();
  try {
    const rows = await rpc('get_oli_leaderboard', { p_limit: 10 });
    const normalized = (Array.isArray(rows) ? rows : []).map((entry) => ({
      id: normalizeName(entry.name),
      name: entry.name,
      score: Number(entry.score) || 0,
      combo: Number(entry.combo) || 0,
      rank: Number(entry.rank) || 0,
    }));
    writeCache(normalized);
    return normalized;
  } catch (error) {
    console.warn('Shared leaderboard fetch failed:', error);
    return readCache();
  }
}

export function saveLocalBest(name, score, combo) {
  const rows = readCache();
  const key = normalizeName(name);
  const existing = rows.find((entry) => normalizeName(entry.name) === key);
  if (!existing) rows.push({ id: key, name, score, combo });
  else if (Number(score) > Number(existing.score || 0)) Object.assign(existing, { name, score, combo });
  rows.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  writeCache(rows);
  return rows;
}

export { normalizeName };
