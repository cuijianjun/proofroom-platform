alter table users add column version integer not null default 1;
create table service_heartbeats (
 name text primary key check(name in('worker')),
 last_seen timestamptz not null default clock_timestamp()
);
