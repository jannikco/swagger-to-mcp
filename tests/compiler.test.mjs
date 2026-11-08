import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {compileDefinition} from '../lib/compiler/index.mjs';
import {runTool} from '../lib/runtime/index.js';
test('compiler produces real local tools and not a hosted import redirect',async()=>{const result=JSON.parse(execFileSync(process.execPath,['compile.mjs'],{encoding:'utf8'}));assert.ok(result.tools.length);assert.ok(result.tools.every(t=>t.method&&t.path!==undefined));assert.ok(!JSON.stringify(result).includes('pipmcp.com/api'));const tool=result.tools.find(t=>t.readOnly);const args=Object.fromEntries((tool.inputSchema.required??[]).map(name=>[name,'example-id']));const executed=await runTool(result,tool.name,args,{fetch:async()=>new Response(JSON.stringify({fixture:true}),{headers:{'content-type':'application/json'}})});assert.equal(executed.data.fixture,true);});
