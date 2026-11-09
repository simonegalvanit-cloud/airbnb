import { put } from '@vercel/blob';
import { isOwner, denied } from './_auth.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };

// Receives one photo (already resized in the browser) and stores it.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isOwner(req)) return denied(res);

  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const ext = TYPES[type];
  if (!ext) return res.status(415).json({ error: 'Scegli una foto JPG, PNG o WebP' });

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4_400_000) return res.status(413).json({ error: 'Foto troppo grande (max ~4 MB)' });
    chunks.push(chunk);
  }
  if (!size) return res.status(400).json({ error: 'File vuoto' });

  try {
    const blob = await put(`images/photo.${ext}`, Buffer.concat(chunks), {
      access: 'public',
      contentType: type,
      addRandomSuffix: true
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
