-- Adapted from ProofRoom eff48d0 core entities. Migration is an explicit API-side step.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;
create table users (
 id uuid primary key default gen_random_uuid(), username text not null unique,
 email text not null unique, name text not null, password_hash text not null,
 is_platform_admin boolean not null default false, disabled boolean not null default false,
 force_password_change boolean not null default false, mfa_secret text, mfa_enabled boolean not null default false,
 recovery_hashes jsonb not null default '[]', failed_logins integer not null default 0,
 locked_until timestamptz, created_at timestamptz not null default now()
);
create unique index users_email_lower on users(lower(email));
create unique index users_username_lower on users(lower(username));
create table studios (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 timezone text not null default 'Asia/Shanghai', state text not null default 'active' check(state in('active','readonly','suspended')),
 state_reason text not null default '', seat_limit integer not null default 5 check(seat_limit>0),
 quota_bytes bigint not null default 10737418240 check(quota_bytes>=0),
 storage_bytes bigint not null default 0 check(storage_bytes>=0), reserved_bytes bigint not null default 0 check(reserved_bytes>=0),
 version integer not null default 1, created_at timestamptz not null default now()
);
create table memberships (
 user_id uuid not null references users(id),studio_id uuid not null references studios(id),
 role text not null check(role in('owner','admin','member')), created_at timestamptz not null default now(),
 primary key(user_id,studio_id)
);
create unique index one_owner on memberships(studio_id) where role='owner';
create table sessions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references users(id),token_hash text not null unique,
 expires_at timestamptz not null,created_at timestamptz not null default now()
);
create table invitations (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),
 email text not null,role text not null check(role in('admin','member')),token_hash text not null unique,
 invited_by uuid not null references users(id),expires_at timestamptz not null,accepted_at timestamptz,
 created_at timestamptz not null default now()
);
create table studio_configs (
 studio_id uuid not null references studios(id),section text not null,version integer not null default 1,
 value jsonb not null,updated_at timestamptz not null default now(),primary key(studio_id,section)
);
create table clients (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),name text not null,
 email text,wechat text not null,phone_last4 text,created_at timestamptz not null default now(),unique(studio_id,id)
);
create unique index clients_email on clients(studio_id,lower(email)) where email is not null;
create table inquiries (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),
 status text not null default 'pending' check(status in('pending','confirmed','ignored')),
 name text not null,wechat text not null,pin_hash text not null,answers jsonb not null,snapshot jsonb not null,
 receipt_hash text not null unique,receipt_cipher text not null,project_id uuid,ignored_at timestamptz,
 visibility_restored_at timestamptz,created_at timestamptz not null default now(),unique(studio_id,id)
);
create table orders (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),client_id uuid not null,
 inquiry_id uuid,title text not null,workflow_stage text not null default 'P1' check(workflow_stage in('P1','P2','P3','P4','archived')),
 lifecycle_status text not null default 'active' check(lifecycle_status in('active','cancelled')),
 requirement_snapshot jsonb not null,agreement jsonb not null,pin_hash text not null,
 token_hash text not null unique,token_cipher text not null,version integer not null default 1,
 selection_version integer not null default 1,completed_selection_version integer,
 selection_baseline jsonb,completed_at timestamptz,delivered_at timestamptz,expires_at timestamptz,
 manifest_version integer not null default 1,compatibility_policy text not null default 'strict',
 archived_at timestamptz,visibility_restored_at timestamptz,cancelled_at timestamptz,
 attention text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(studio_id,id),unique(studio_id,inquiry_id),
 foreign key(studio_id,client_id) references clients(studio_id,id),
 foreign key(studio_id,inquiry_id) references inquiries(studio_id,id)
);
alter table inquiries add foreign key(studio_id,project_id) references orders(studio_id,id);
create index orders_list on orders(studio_id,created_at desc,id desc);
create index inquiries_list on inquiries(studio_id,status,created_at desc,id desc);
create table booking_slots (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),
 start_at timestamptz not null,end_at timestamptz not null,enabled boolean not null default true,
 order_id uuid,version integer not null default 1,check(end_at>start_at),unique(studio_id,id),unique(studio_id,order_id),
 foreign key(studio_id,order_id) references orders(studio_id,id),
 exclude using gist(studio_id with =, tstzrange(start_at,end_at,'[)') with &&)
);
create table galleries (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),order_id uuid not null,
 title text not null,kind text not null check(kind in('original','retouched')),published boolean not null default true,
 settings jsonb not null default '{}',version integer not null default 1,
 unique(studio_id,id),unique(studio_id,order_id,kind),foreign key(studio_id,order_id) references orders(studio_id,id)
);
create table upload_batches (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),order_id uuid not null,
 role text not null check(role in('original','retouched')),state text not null default 'pending' check(state in('pending','ready','failed','cancelled')),
 selection_version integer not null,created_at timestamptz not null default now(),unique(studio_id,id),
 foreign key(studio_id,order_id) references orders(studio_id,id)
);
create table upload_items (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),batch_id uuid not null,
 filename text not null,expected_bytes bigint not null check(expected_bytes>0),expected_sha256 text not null,
 state text not null default 'pending' check(state in('pending','received','processing','ready','failed','removed')),
 error text,photo_id uuid,created_at timestamptz not null default now(),unique(studio_id,id),
 foreign key(studio_id,batch_id) references upload_batches(studio_id,id)
);
create table photos (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),order_id uuid not null,
 gallery_id uuid not null,batch_id uuid not null,item_id uuid not null,filename text not null,
 object_key text not null unique,preview_key text,thumbnail_key text,sha256 text not null,
 size_bytes bigint not null check(size_bytes>0),width integer,height integer,
 role text not null check(role in('original','retouched')),processing_state text not null default 'received',
 visible boolean not null default true,deleted_at timestamptz,category text not null default '',sort_order integer not null default 0,
 delivered boolean not null default false,created_at timestamptz not null default now(),unique(studio_id,id),unique(studio_id,item_id),
 foreign key(studio_id,order_id) references orders(studio_id,id),
 foreign key(studio_id,gallery_id) references galleries(studio_id,id),
 foreign key(studio_id,batch_id) references upload_batches(studio_id,id),
 foreign key(studio_id,item_id) references upload_items(studio_id,id)
);
alter table upload_items add foreign key(studio_id,photo_id) references photos(studio_id,id);
create index photos_order on photos(studio_id,order_id,role,sort_order,id);
create table photo_selections (
 photo_id uuid not null,studio_id uuid not null,order_id uuid not null,
 actor text not null check(actor in('client','studio')),rating integer not null default 0 check(rating between 0 and 5),
 color text check(color in('red','yellow','green','blue','purple')),updated_by uuid references users(id),
 updated_at timestamptz not null default now(),primary key(photo_id,actor),
 foreign key(studio_id,photo_id) references photos(studio_id,id),foreign key(studio_id,order_id) references orders(studio_id,id)
);
create table photo_comments (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null,order_id uuid not null,photo_id uuid not null,
 author_role text not null check(author_role in('client','studio')),body text not null check(char_length(body) between 1 and 2000),
 created_at timestamptz not null default now(),foreign key(studio_id,photo_id) references photos(studio_id,id),
 foreign key(studio_id,order_id) references orders(studio_id,id)
);
create table delivery_mappings (
 studio_id uuid not null,order_id uuid not null,retouched_id uuid not null,original_id uuid,
 additional boolean not null default false,selection_version integer not null,
 primary key(retouched_id),unique(studio_id,order_id,original_id),
 check((original_id is not null and not additional) or (original_id is null and additional)),
 foreign key(studio_id,order_id) references orders(studio_id,id),
 foreign key(studio_id,retouched_id) references photos(studio_id,id),
 foreign key(studio_id,original_id) references photos(studio_id,id)
);
create table client_sessions (
 token_hash text primary key,studio_id uuid not null,order_id uuid not null,expires_at timestamptz not null,
 foreign key(studio_id,order_id) references orders(studio_id,id)
);
create table idempotency (
 scope text not null,key text not null,digest text not null,result jsonb not null,
 created_at timestamptz not null default now(),primary key(scope,key)
);
create table rate_limits (
 key text primary key,count integer not null,reset_at timestamptz not null
);
create table audit_log (
 id uuid primary key default gen_random_uuid(),studio_id uuid references studios(id),user_id uuid references users(id),
 action text not null,resource_id text,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create table portfolio_items (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null references studios(id),
 title text not null,group_name text not null,object_key text not null,sort_order integer not null default 0,
 published boolean not null default true,created_at timestamptz not null default now(),unique(studio_id,id)
);
create table zip_jobs (
 id uuid primary key default gen_random_uuid(),studio_id uuid not null,order_id uuid not null,kind text not null,
 manifest_version integer not null,state text not null default 'pending',object_key text,error text,
 created_at timestamptz not null default now(),unique(studio_id,order_id,kind,manifest_version),
 foreign key(studio_id,order_id) references orders(studio_id,id)
);
