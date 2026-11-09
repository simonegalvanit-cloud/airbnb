import { createHash, timingSafeEqual } from 'node:crypto';

// True when the request carries the owner password (set as ADMIN_PASSWORD in Vercel).
export function isOwner(req) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const given = String(req.headers['x-admin-password'] || '');
  const a = createHash('sha256').update(real).digest();
  const b = createHash('sha256').update(given).digest();
  return timingSafeEqual(a, b);
}

// Slow down password guessing
export const wait = ms => new Promise(r => setTimeout(r, ms));

export async function denied(res) {
  await wait(800);
  res.status(401).json({ error: 'Password errata' });
}
