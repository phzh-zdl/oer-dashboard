// Erlaubt nur https:// (oder protocol-relative // → https). Liefert '' für alles
// andere. Blockiert javascript:, data:, file:, http:, mailto:, blob: usw. —
// damit Daten aus User-Input oder DB-Zeilen nicht plötzlich Code ausführen
// können, wenn sie als href oder background-image landen.
export function safeHttps(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return 'https:' + s;
  return '';
}
