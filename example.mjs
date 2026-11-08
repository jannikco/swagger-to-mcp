#!/usr/bin/env node
import{spawnSync}from'node:child_process';
const r=spawnSync(process.execPath,[new URL('./importer/run.mjs',import.meta.url).pathname,"swagger",...process.argv.slice(2)],{stdio:'inherit'});if(r.error)throw r.error;process.exitCode=r.status??1;
