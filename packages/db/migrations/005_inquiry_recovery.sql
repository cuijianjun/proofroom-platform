alter table inquiries add column recovery_hash text;
create unique index inquiry_recovery on inquiries(studio_id,recovery_hash) where recovery_hash is not null;
