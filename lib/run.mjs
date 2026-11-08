#!/usr/bin/env node
/** Preview is the default. --execute --confirm-import creates a private PipMCP integration. */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {buildImportRequest,executeImport,formats} from './index.mjs';
const args=process.argv.slice(2);
const format=args.shift();
try {
  if(!formats.includes(format)) throw new Error('Usage: node run.mjs openapi|swagger|postman|graphql [input-file] [--name NAME] [--endpoint HTTPS_URL] [--execute --confirm-import]');
  let input,name,endpoint,execute=false,confirm=false;
  while(args.length){
    const value=args.shift();
    if(value==='--execute')execute=true;
    else if(value==='--confirm-import')confirm=true;
    else if(value==='--name'){name=args.shift();if(!name||name.startsWith('--'))throw new Error('--name requires a value.');}
    else if(value==='--endpoint'){endpoint=args.shift();if(!endpoint||endpoint.startsWith('--'))throw new Error('--endpoint requires a value.');}
    else if(value.startsWith('--'))throw new Error('Unknown option.');
    else if(input)throw new Error('Provide only one input file.');
    else input=value;
  }
  const fixture=fileURLToPath(new URL(`./fixtures/${format}.${format==='graphql'?'graphql':'json'}`,import.meta.url));
  const request=buildImportRequest(format,await readFile(input??fixture,'utf8'),{name,endpoint});
  if(!execute){console.log(JSON.stringify({mode:'dry-run',preflight:'GET /api/v1/integrations checks for duplicate names when executed',request},null,2));}
  else {
    const result=await executeImport(request,{apiKey:process.env.PIPMCP_API_KEY,confirmed:confirm,signal:AbortSignal.timeout(120_000)});
    console.log(JSON.stringify({mode:'imported-private',integration:result.data,next:'Inspect import status and tools in PipMCP. No connection, endpoint or publication was created.'},null,2));
  }
}catch(error){console.error(error.message);process.exitCode=1;}
