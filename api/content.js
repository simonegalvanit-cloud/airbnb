import { list } from '@vercel/blob';
import { blobAuth, blobConfigured, NOT_CONNECTED } from './_blob.js';

// Returns the most recently saved website content.
// Each save is stored as a new file (content/site-<timestamp>.json),
// so there is never a stale cached copy and older versions stay as backups.
export default async function handler(req, res) {
  if (!blobConfigured(req)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ error: NOT_CONNECTED });
  }
  try {
    const { blobs } = await list({ prefix: 'content/', limit: 1000, ...blobAuth(req) });
    if (!blobs.length) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(404).json({ error: 'No saved content yet' });
    }
    blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const r = await fetch(blobs[0].url);
    if (!r.ok) throw new Error('Could not read content');
    const json = await r.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cached at Vercel's edge for 10 s, so visitors are fast and edits appear quickly
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=300');
    res.status(200).send(json);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ error: err.message });
  }
}
