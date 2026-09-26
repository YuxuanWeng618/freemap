export const REFERENCE = { latitude: 1.2931, longitude: 103.8520, name: 'City Hall' };
export const CATEGORIES = [
  { id: 'all', label: 'All finds', icon: 'spark' },
  { id: 'furniture', label: 'Furniture', icon: 'furniture' },
  { id: 'electronics', label: 'Electronics', icon: 'electronics' },
  { id: 'materials', label: 'Materials', icon: 'materials' },
  { id: 'boxes', label: 'Boxes', icon: 'boxes' },
  { id: 'bikes', label: 'Bikes', icon: 'bikes' },
];
export function distanceKm(a, b = REFERENCE) {
  const rad = x => x * Math.PI / 180;
  const lat = rad(b.latitude - a.latitude), lng = rad(b.longitude - a.longitude);
  const h = Math.sin(lat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(lng / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}
export function freshness(postedAt, now = Date.now()) {
  const hours = Math.max(0, (now - new Date(postedAt).getTime()) / 3600000);
  if (!Number.isFinite(hours)) return 'old';
  return hours <= 2 ? 'fresh' : hours <= 12 ? 'recent' : hours <= 48 ? 'stale' : 'old';
}
export function timeAgo(postedAt, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(postedAt).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return 'time unknown';
  if (minutes < 60) return `${minutes || 1}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
export function filterItems(items, category, radius) {
  return items.filter(item => (category === 'all' || item.category === category) && distanceKm(item) <= radius);
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function readSaved(storage, validIds) {
  try {
    const raw = JSON.parse(storage.getItem('freemap.stash.v1') || '[]');
    return new Set(Array.isArray(raw) ? raw.filter(id => typeof id === 'string' && validIds.has(id)) : []);
  } catch { return new Set(); }
}
export function writeSaved(storage, saved) {
  try { storage.setItem('freemap.stash.v1', JSON.stringify([...saved])); return true; } catch { return false; }
}
export function safeSourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
