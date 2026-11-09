// Credentials for Vercel Blob.
// Works with both ways Vercel connects a Blob store to a project:
//  - classic token: BLOB_READ_WRITE_TOKEN
//  - newer OIDC:    BLOB_STORE_ID + the OIDC token Vercel sends with each request
export function blobAuth(req) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return { token: process.env.BLOB_READ_WRITE_TOKEN };
  const oidcToken = req?.headers?.['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  if (oidcToken && storeId) return { oidcToken, storeId };
  return {};
}

export function blobConfigured(req) {
  return Object.keys(blobAuth(req)).length > 0;
}

export const NOT_CONNECTED =
  'Lo spazio "Blob" non è collegato al sito. Su Vercel: Storage → Blob → Connect Project, poi Deployments → Redeploy.';
