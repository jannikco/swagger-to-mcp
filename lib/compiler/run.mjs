#!/usr/bin/env node
/** Local conversion only. Does not contact PipMCP or execute provider operations. */
import {readFile,writeFile} from 'node:fs/promises';
import {compileDefinition} from './index.mjs';
const args=process.argv.slice(2),format=args.shift();
let input,output,baseUrl;
while(args.length){const arg=args.shift();if(arg==='--output')output=args.shift();else if(arg==='--base-url')baseUrl=args.shift();else if(arg.startsWith('--'))throw new Error('Unknown compiler option');else if(!input)input=arg;else throw new Error('Only one input definition is accepted');}
try{
 if(!input)throw new Error('Usage: node run.mjs openapi|swagger|postman|graphql input-file [--base-url HTTPS_URL] [--output connector.json]');
 const compiled=compileDefinition(format,await readFile(input,'utf8'),{baseUrl});const text=JSON.stringify(compiled,null,2)+'\n';
 if(output)await writeFile(output,text);else process.stdout.write(text);
}catch(error){console.error(error.message);process.exitCode=1;}
