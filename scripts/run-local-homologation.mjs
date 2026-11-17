import {execFileSync,spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Read only local CLI status. Never accepts remote URLs or prints credentials.
const status=JSON.parse(execFileSync('node_modules/.bin/supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const url=status.API_URL;
assert(url&&new URL(url).protocol==='http:'&&['localhost','127.0.0.1'].includes(new URL(url).hostname),'LOCAL_SUPABASE_REQUIRED');
assert(status.ANON_KEY&&status.SERVICE_ROLE_KEY,'LOCAL_KEYS_REQUIRED');
const all=process.argv.includes('--all');
const result=spawnSync(all?'npm':process.execPath,all?['test']:['--test','tests/integration.test.mjs','tests/homologation.test.mjs'],{
 stdio:'inherit',env:{...process.env,TEST_SUPABASE_URL:url,TEST_SUPABASE_ANON_KEY:status.ANON_KEY,TEST_SUPABASE_SERVICE_ROLE_KEY:status.SERVICE_ROLE_KEY,TEST_SUPABASE_JWT_SECRET:status.JWT_SECRET||''}
});
process.exitCode=result.status??1;
