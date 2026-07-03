# Device Logging

APEX can register device visits in Supabase and expose them at:

```text
/api/device/list
```

The list is protected by:

```text
DEVICE_LIST_PASSWORD
```

Required Vercel environment variables:

```text
DEVICE_LIST_PASSWORD=your-private-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create this table in Supabase:

```sql
create extension if not exists pgcrypto;

create table if not exists device_visits (
  id uuid primary key default gen_random_uuid(),
  visited_at timestamptz not null default now(),
  ip text,
  user_agent text,
  browser text,
  browser_version text,
  os text,
  os_version text,
  device_type text,
  device_vendor text,
  country text,
  region text,
  city text,
  latitude text,
  longitude text,
  postal_code text,
  timezone text,
  language text,
  path text,
  referrer text,
  screen_width integer,
  screen_height integer,
  viewport_width integer,
  viewport_height integer,
  pixel_ratio numeric,
  platform text,
  is_pwa boolean,
  touch_points integer,
  client_info jsonb,
  headers_info jsonb
);

create index if not exists device_visits_visited_at_idx on device_visits (visited_at desc);
create index if not exists device_visits_device_type_idx on device_visits (device_type);
create index if not exists device_visits_browser_idx on device_visits (browser);
```

The app sends `/api/device/log` once when it opens. If Supabase is not configured, the request is ignored without affecting the app.
