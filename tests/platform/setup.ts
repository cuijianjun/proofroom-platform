import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
dotenv.config({path:fileURLToPath(new URL('../../.env',import.meta.url)),quiet:true});
if(!process.env.TEST_DATABASE_URL?.endsWith('/proofroom_test'))throw new Error('拒绝在非隔离数据库运行测试');
await mkdir('/tmp/proofroom-qa',{recursive:true,mode:0o700});
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
process.env.MIGRATION_DATABASE_URL=process.env.TEST_MIGRATION_DATABASE_URL;
process.env.S3_BUCKET='proofroom-test';
