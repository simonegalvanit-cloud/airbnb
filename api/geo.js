// Tells the page which country the visitor is in (Vercel adds this header automatically).
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ country: String(req.headers['x-vercel-ip-country'] || '').toUpperCase() });
}
