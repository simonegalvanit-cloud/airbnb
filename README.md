# Holiday home website (Vercel) — edit right on the page

The owner goes to **yoursite.com/admin**, types the password, and edits the live page:

- **Tap any text** (titles, descriptions, button text, reviews, rules…) and type.
- **Tap any photo** (or "Change photo") to replace it from the phone or computer. Photos are shrunk automatically.
- **Arrows / bin icons** reorder or remove items; **+ Add** buttons add photos, amenities, reviews, rules, FAQs.
- **Settings**: booking link, price, map location, email, phone, Google description, brand colour.
- **Preview** shows the page as guests see it. **Save** publishes — live for everyone within ~10 seconds.

Every save is kept as a backup (last 30) in Vercel Blob, so nothing is ever lost.

## Setup (≈10 minutes, free Hobby plan)

1. Put this folder in a GitHub repo, then on vercel.com: **Add New → Project → Import** it.
   Framework preset: **Other**. No build command needed. Deploy.
2. In the project: **Storage → Create → Blob**. Choose **Public** access (needed so photos can be shown),
   pick a region near your guests (e.g. Frankfurt), and connect it to this project.
3. **Settings → Environment Variables** → add `ADMIN_PASSWORD` = a strong password for the owner.
4. **Deployments → ⋯ → Redeploy** so the new settings take effect.
5. (Optional) **Settings → Domains** → add the owner's domain.

Give the owner the link `https://yourdomain.com/admin` and the password. Done.

Until the first Save, the site shows the starter content from `content/site.json`.

## Files
- `index.html`, `styles.css`, `app.js` — the site and the on-page editor
- `api/` — tiny serverless functions: `content` (read), `save`, `upload`, `login`
- `content/site.json` — starter content

## Change the password
Edit `ADMIN_PASSWORD` in Vercel → Environment Variables, then redeploy.

## Restore an older version
Vercel → Storage → your Blob store → `content/` folder. Each file is a saved version. To restore one,
download it, delete the newer files, or re-upload it with a newer name like `content/site-999999999999999.json`.
