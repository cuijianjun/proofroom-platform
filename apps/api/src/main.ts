import {createApp} from './app.js';
import {pool} from '@proofroom/db';
const app=await createApp();
const port=Number(process.env.API_PORT??18182);
await app.listen({host:'127.0.0.1',port});
process.stdout.write(`ProofRoom API http://127.0.0.1:${port}\n`);
for(const s of ['SIGINT','SIGTERM'])process.on(s,async()=>{await app.close();await pool.end();process.exit(0);});
