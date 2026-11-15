alter table portfolio_items add column state text not null default 'ready';
alter table portfolio_items add column filename text not null default '';
alter table portfolio_items add column expected_bytes bigint not null default 0;
alter table portfolio_items add column reserved_bytes bigint not null default 0;
alter table portfolio_items add column source_key text;
alter table portfolio_items add column sha256 text;
alter table portfolio_items add column preview_bytes bigint not null default 0;
alter table portfolio_items add column error text;
alter table portfolio_items add column version integer not null default 1;
alter table portfolio_items add column created_by uuid references users(id);
alter table portfolio_items add column publish_requested boolean not null default true;
alter table portfolio_items add column deleted_at timestamptz;
insert into studio_configs(studio_id,section,value)
 select id,'portfolio','{"showSamples":true,"groups":[{"id":"portraits","name":"人像"},{"id":"couples","name":"情侣"},{"id":"families","name":"家庭"},{"id":"moments","name":"纪实"},{"id":"commercial","name":"商业形象"}]}'::jsonb from studios
 on conflict do nothing;
