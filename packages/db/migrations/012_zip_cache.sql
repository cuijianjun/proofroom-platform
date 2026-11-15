alter table zip_jobs add column download_scope text not null default 'studio' check(download_scope in('studio','client'));
alter table zip_jobs add column manifest_hash text not null default '';
alter table zip_jobs add column sha256 text;
update zip_jobs set manifest_hash='legacy:'||id::text where manifest_hash='';
alter table zip_jobs drop constraint zip_jobs_studio_id_order_id_kind_manifest_version_key;
alter table zip_jobs add unique(studio_id,order_id,download_scope,kind,manifest_hash);
