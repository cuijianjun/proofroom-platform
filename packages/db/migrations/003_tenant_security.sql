alter table studios add column idempotency_key_cipher text;
alter table portfolio_items add column updated_at timestamptz not null default now();
alter table portfolio_items add column lease_token uuid;
alter table portfolio_items add constraint portfolio_state check(state in('pending','received','processing','ready','failed'));
alter table portfolio_items add column processing_attempts integer not null default 0;
alter table portfolio_items add column preview_reserved_bytes bigint not null default 0;
alter table inquiries add column version integer not null default 1;
create index inquiries_wechat on inquiries(studio_id,wechat);
