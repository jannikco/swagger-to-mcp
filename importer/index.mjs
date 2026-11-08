/** Four authentic PipMCP import formats; preview is local, execution creates a private integration only. */
export const formats = Object.freeze(['openapi','swagger','postman','graphql']);
const target = 'https://pipmcp.com/api/v1/integrations';

export function buildImportRequest(format, content, {name = `PipMCP ${format} example`, endpoint} = {}) {
  if (!formats.includes(format)) throw new TypeError('Choose openapi, swagger, postman or graphql.');
  if (typeof content !== 'string' || !content.trim()) throw new TypeError('An input document is required.');
  if (typeof name !== 'string' || !name.trim() || name.length > 120) throw new TypeError('name must contain 1–120 characters.');
  if (format !== 'graphql') {
    let doc;
    try {doc=JSON.parse(content);} catch {throw new TypeError('This example accepts JSON input; convert YAML to JSON first.');}
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new TypeError('The input document must be an object.');
    if (format==='openapi' && !(typeof doc.openapi==='string' && doc.openapi.startsWith('3.') && doc.paths)) throw new TypeError('Expected an OpenAPI 3 JSON document with paths.');
    if (format==='swagger' && !(doc.swagger==='2.0' && doc.paths)) throw new TypeError('Expected a Swagger 2.0 JSON document with paths.');
    if (format==='postman' && !(doc.info?.schema?.includes('/collection/v2.') && Array.isArray(doc.item))) throw new TypeError('Expected a Postman v2 collection.');
  } else if (!/(?:type\s+Query\s*\{|"__schema"\s*:)/.test(content)) throw new TypeError('Expected GraphQL SDL with Query or an introspection JSON document.');
  const body={source_type:format==='swagger'||format==='openapi'?'openapi_upload':format,name,content,wait:true};
  if(endpoint!==undefined){
    const url=new URL(endpoint);
    if(url.protocol!=='https:' || url.username || url.password || url.hash || url.search) throw new TypeError('A GraphQL endpoint must be HTTPS without credentials, query or fragment.');
    if(format!=='graphql') throw new TypeError('endpoint is only used by GraphQL input.');
    body.url=url.href;
  }
  return {method:'POST',url:target,headers:{Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer <PIPMCP_API_KEY>'},body};
}

export async function executeImport(request,{apiKey,confirmed=false,fetch:fetcher=globalThis.fetch,signal}={}){
  if(confirmed!==true) throw new TypeError('Explicit import confirmation is required.');
  if(typeof apiKey!=='string'||!/^pmk_[A-Za-z0-9_-]+$/.test(apiKey)) throw new TypeError('Supply a PipMCP management pmk_ API key.');
  if(request?.url!==target || request?.method!=='POST') throw new TypeError('Only the documented PipMCP create-integration endpoint is supported.');
  // Validate again so edited preview JSON cannot silently add publication/connection options.
  const format=request.body?.source_type==='openapi_upload'?(JSON.parse(request.body.content).swagger==='2.0'?'swagger':'openapi'):request.body?.source_type;
  const validated=buildImportRequest(format,request.body.content,{name:request.body.name,endpoint:request.body.url});
  if(JSON.stringify(Object.keys(request.body).sort())!==JSON.stringify(Object.keys(validated.body).sort()) || request.body.wait!==true) throw new TypeError('Unexpected import request fields.');
  const headers={Accept:'application/json',Authorization:`Bearer ${apiKey}`};
  async function jsonResponse(response){
    let result;
    try{result=await response.json();}catch{throw new Error(`PipMCP returned non-JSON (HTTP ${response.status}); inspect its dashboard before retrying.`);}
    if(!response.ok){const e=new Error(`PipMCP request failed (HTTP ${response.status}); no automatic retry.`);e.status=response.status;e.code=result.error?.code??null;throw e;}
    return result;
  }
  const existing=await jsonResponse(await fetcher(target,{method:'GET',headers,redirect:'error',signal}));
  if(!Array.isArray(existing.data)) throw new Error('Cannot verify existing integration names; import stopped.');
  if(existing.data.some(row=>row.name===validated.body.name)) throw new Error('An integration with this name already exists; inspect it or re-import from the PipMCP dashboard.');
  const result=await jsonResponse(await fetcher(target,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(validated.body),redirect:'error',signal}));
  if(!result.data?.id) throw new Error('PipMCP did not return an integration ID; inspect the dashboard before retrying.');
  return result;
}
