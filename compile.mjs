#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {compileDefinition} from './lib/compiler/index.mjs';
const args=process.argv.slice(2);let input,output,baseUrl;
while(args.length){const arg=args.shift();if(arg==='--output')output=args.shift();else if(arg==='--base-url')baseUrl=args.shift();else if(arg.startsWith('--'))throw new Error('Unknown compiler argument');else input=arg;}
try{const source=await readFile(input??new URL("./fixtures/swagger.json",import.meta.url),'utf8');const compiled=compileDefinition("swagger",source,{baseUrl});const text=JSON.stringify(compiled,null,2)+'\n';if(output)await writeFile(output,text,{flag:'wx'});else process.stdout.write(text);}catch(error){console.error(error.message);process.exitCode=1;}
