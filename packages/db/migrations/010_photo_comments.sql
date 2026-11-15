alter table photo_comments add column author_id uuid references users(id);
alter table photo_comments add column version integer not null default 1;
alter table photo_comments add column updated_at timestamptz not null default now();
alter table photo_comments add column deleted_at timestamptz;
create index comments_current on photo_comments(studio_id,order_id,photo_id) where deleted_at is null;
