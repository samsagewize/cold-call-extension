import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../_supabase.js';

function generateKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `CTP-${chunk()}-${chunk()}-${chunk()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const adminSecret = process.env.ADMIN_ISSUE_SECRET;
  const provided = (req.headers['x-admin-secret'] ?? req.body?.adminSecret ?? '').toString();

  if (!adminSecret) {
    res.status(500).json({ ok: false, error: 'missing_admin_secret' });
    return;
  }

  const a = Buffer.from(adminSecret);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const key = generateKey();

    const { error } = await supabase.from('licenses').insert({ key, active: true });
    if (error) {
      res.status(500).json({ ok: false, error: 'db_error', detail: error.message });
      return;
    }

    res.status(200).json({ ok: true, key });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server_error', detail: e?.message ?? String(e) });
  }
}
