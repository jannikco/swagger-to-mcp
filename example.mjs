/** Show an import request offline. Mutations require the importer explicit flags. */
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,[new URL('./lib/run.mjs',import.meta.url).pathname,"swagger",...process.argv.slice(2)],{stdio:'inherit'});
if(result.error)throw result.error;process.exit(result.status??1);
