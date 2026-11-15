alter table galleries add column archived boolean not null default false;
alter table galleries add column created_at timestamptz not null default now();
alter table photos add column retained_deleted boolean not null default false;
create index galleries_workspace on galleries(studio_id,archived,created_at,id);
