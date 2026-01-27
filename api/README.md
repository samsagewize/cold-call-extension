# CallTrack Pro — License API

These endpoints are intended for deployment on Vercel.

## Required env vars (Vercel project settings)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; keep secret)
- `ADMIN_ISSUE_SECRET`

## Supabase schema

Create a table named `licenses`:

```sql
create table if not exists public.licenses (
  key text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

## Endpoints

- `POST /api/verify-license` body: `{ "key": "CTP-...." }`

Returns:
- `{ ok: true, valid: true }` or `{ ok: true, valid: false }`

- `POST /api/admin/issue-license` header: `x-admin-secret: <ADMIN_ISSUE_SECRET>`

Returns:
- `{ ok: true, key: "CTP-XXXX-XXXX-XXXX" }`
