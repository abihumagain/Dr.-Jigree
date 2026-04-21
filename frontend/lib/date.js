/**
 * SQLite stores CURRENT_TIMESTAMP as "YYYY-MM-DD HH:MM:SS" (space separator).
 * new Date("YYYY-MM-DD HH:MM:SS") is invalid in Firefox/Safari.
 * These helpers normalise to ISO before parsing.
 */

export function fmtDate(val) {
  if (!val) return '—';
  return new Date(String(val).replace(' ', 'T')).toLocaleDateString();
}

export function fmtDateTime(val) {
  if (!val) return '—';
  return new Date(String(val).replace(' ', 'T')).toLocaleString();
}
