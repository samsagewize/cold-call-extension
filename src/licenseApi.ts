// License verification API base.
//
// When deployed on Vercel (recommended), set:
//   VITE_LICENSE_API_BASE=https://<your-vercel-domain>
//
// For local dev, you can leave it blank (same-origin).

export const LICENSE_API_BASE = import.meta.env.VITE_LICENSE_API_BASE || '';

export async function verifyLicense(key: string): Promise<boolean> {
  const url = `${LICENSE_API_BASE}/api/verify-license`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const json = await res.json();
  return Boolean(json?.ok && json?.valid);
}
