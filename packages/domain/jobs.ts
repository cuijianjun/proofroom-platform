import {PgBoss} from 'pg-boss';
import '@proofroom/db';
let pending:Promise<PgBoss>|undefined;
export function getBoss(){return pending??=(async()=>{const boss=new PgBoss({connectionString:process.env.DATABASE_URL,schema:'pgboss',migrate:false,createSchema:false,max:3,connectionTimeoutMillis:4000});boss.on('error',error=>process.stderr.write(JSON.stringify({service:'jobs',error:error.message})+'\n'));await boss.start();return boss;})();}
export async function stopBoss(){if(pending){const boss=await pending;pending=undefined;await boss.stop({graceful:true,timeout:5000});}}
