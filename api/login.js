import { isOwner, denied } from './_auth.js';
import { blobConfigured, NOT_CONNECTED } from './_blob.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not set in Vercel' });
  }
  if (!isOwner(req)) return denied(res);
  res.status(200).json({ ok: true, storage: blobConfigured(req) ? 'ok' : NOT_CONNECTED });
}
