import { put, list, del } from '@vercel/blob';
import { blobAuth, blobConfigured, NOT_CONNECTED } from './_blob.js';
import { isOwner, denied } from './_auth.js';

const KEEP_VERSIONS = 30; // older saves are kept as backups, then cleaned up

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isOwner(req)) return denied(res);
  if (!blobConfigured(req)) return res.status(500).json({ error: NOT_CONNECTED });

  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Contenuto non valido' });
  }
  const body = JSON.stringify(data, null, 2);
  if (body.length > 1_000_000) return res.status(413).json({ error: 'Contenuto troppo grande' });

  try {
    const stamp = String(Date.now()).padStart(15, '0');
    await put(`content/site-${stamp}.json`, body, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      ...blobAuth(req)
    });

    // Tidy up very old versions
    const { blobs } = await list({ prefix: 'content/', limit: 1000, ...blobAuth(req) });
    blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const old = blobs.slice(KEEP_VERSIONS).map(b => b.url);
    if (old.length) await del(old, blobAuth(req));

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
