-- Every external PUT is registered before it starts. Tombstones survive logical
-- cleanup so a lost/late response remains discoverable across process crashes.
create table storage_cleanup(
 object_key text primary key,
 studio_id uuid not null references studios(id),
 resource_id uuid not null,
 next_check timestamptz not null default now()+interval '1 minute',
 last_error boolean not null default false,
 created_at timestamptz not null default now()
);
create index storage_cleanup_due on storage_cleanup(next_check);
