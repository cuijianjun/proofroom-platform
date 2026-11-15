create table backup_jobs (
 id uuid primary key default gen_random_uuid(),
 scope text not null check(scope in('studio','full')),
 studio_id uuid references studios(id),created_by uuid references users(id),
 request_key text not null,request_digest text not null,
 snapshot_cipher text,passphrase_cipher text,
 state text not null default 'pending' check(state in('pending','processing','ready','failed','expired')),
 object_key text,sha256 text,size_bytes bigint not null default 0,
 attempts integer not null default 0,lease_token uuid,error text,
 version integer not null default 1,created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),expires_at timestamptz,
 unique(studio_id,created_by,request_key),
 check((scope='studio' and studio_id is not null and created_by is not null) or scope='full')
);
create table backup_media (
 backup_id uuid not null references backup_jobs(id),
 studio_id uuid not null references studios(id),object_key text not null,
 primary key(backup_id,object_key)
);
create index backup_media_protected on backup_media(object_key,backup_id);
create index backup_jobs_work on backup_jobs(state,updated_at);

create unique index backup_one_active_studio on backup_jobs(studio_id) where scope='studio' and state in('pending','processing');
