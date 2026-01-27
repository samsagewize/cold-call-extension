const { getSupabaseAdmin } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const key = (req.body?.key ?? '').toString().trim();
  if (!key) {
    res.status(400).json({ ok: false, error: 'missing_key' });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('licenses')
      .select('key, active')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      res.status(500).json({ ok: false, error: 'db_error', detail: error.message });
      return;
    }

    if (!data || data.active !== true) {
      res.status(200).json({ ok: true, valid: false });
      return;
    }

    res.status(200).json({ ok: true, valid: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server_error', detail: e?.message ?? String(e) });
  }
};
