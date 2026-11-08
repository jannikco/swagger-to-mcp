/** Compile user-owned API definitions to direct-provider MCP tools; no hosted account required. */
import {parse as parseYaml} from 'yaml';
import {buildSchema,buildClientSchema,getNamedType,isNonNullType,isListType,isScalarType,isEnumType,isInputObjectType} from 'graphql';
const methods=new Set(['get','post','put','patch','delete']);
const slug=value=>String(value).replace(/[^A-Za-z0-9_]/g,'_').replace(/^[^A-Za-z_]/,'_$&').slice(0,80);
function endpoint(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new Error('API base URL must use HTTPS without credentials, query or fragment');return u.href.replace(/\/$/,'');}
function parseInput(text){try{return JSON.parse(text);}catch{return parseYaml(text,{maxAliasCount:50});}}
function nodeRef(doc,value){const seen=new Set();while(value?.$ref){const ref=value.$ref;if(!ref.startsWith('#/'))throw new Error('External schema references must be bundled before compilation');if(seen.has(ref))throw new Error('Circular parameter or body reference');seen.add(ref);value=ref.slice(2).split('/').reduce((node,key)=>node?.[key.replace(/~1/g,'/').replace(/~0/g,'~')],doc);if(!value)throw new Error('Unresolved schema reference');}return value;}
function resolve(doc,schema,depth=0,seen=new Set()){
 if(!schema||typeof schema!=='object')return {};
 if(depth>14)throw new Error('Schema nesting exceeds compiler limit');
 if(schema.$ref){
  if(!schema.$ref.startsWith('#/'))throw new Error('External schema references must be bundled before compilation');
  if(seen.has(schema.$ref))return {type:'object',description:'Recursive input; validate against provider schema.'};
  const next=new Set(seen);next.add(schema.$ref);
  let value=doc;for(const part of schema.$ref.slice(2).split('/'))value=value?.[part.replace(/~1/g,'/').replace(/~0/g,'~')];
  if(!value)throw new Error('Unresolved schema reference');return resolve(doc,value,depth+1,next);
 }
 const out={};
 for(const key of ['type','description','enum','format','minimum','maximum','minLength','maxLength','minItems','maxItems','required','additionalProperties','default'])if(schema[key]!==undefined)out[key]=schema[key];
 if(schema.properties){out.type??='object';out.properties=Object.fromEntries(Object.entries(schema.properties).map(([key,value])=>[key,resolve(doc,value,depth+1,seen)]));}
 if(schema.items)out.items=resolve(doc,schema.items,depth+1,seen);
 for(const keyword of ['oneOf','anyOf','allOf'])if(schema[keyword])out[keyword]=schema[keyword].map(s=>resolve(doc,s,depth+1,seen));
 return out;
}
function authFor(doc){
 const definitions=doc.components?.securitySchemes??doc.securityDefinitions??{};
 const selected=Object.keys(doc.security?.[0]??{})[0];const scheme=definitions[selected]??Object.values(definitions)[0];
 if(!scheme)return {type:'none'};
 if(scheme.type==='apiKey')return {type:scheme.in==='query'?'query':'header',env:'PROVIDER_API_KEY',name:scheme.name};
 if(scheme.type==='basic'||scheme.scheme==='basic')return {type:'basic',usernameEnv:'PROVIDER_USERNAME',passwordEnv:'PROVIDER_PASSWORD'};
 if(scheme.type==='oauth2'||scheme.type==='openIdConnect')return {type:'oauth',env:'PROVIDER_ACCESS_TOKEN'};
 if(scheme.type==='http'&&scheme.scheme==='bearer')return {type:'bearer',env:'PROVIDER_API_KEY'};
 throw new Error('Unsupported authentication scheme; supply a reviewed auth adapter');
}
function fromOpenApi(doc,{id,baseUrl}){
 const swagger=doc.swagger==='2.0';
 if(!swagger&&!String(doc.openapi??'').startsWith('3.'))throw new Error('Expected OpenAPI3 or Swagger2');
 const base=endpoint(baseUrl??(swagger?`${doc.schemes?.includes('https')?'https':'https'}://${doc.host}${doc.basePath??''}`:doc.servers?.[0]?.url));
 const tools=[];const used=new Set();
 for(const [resource,item]of Object.entries(doc.paths??{}))for(const [method,op]of Object.entries(item)){
  if(!methods.has(method))continue;
  const name=slug(op.operationId??`${method}_${resource}`);if(used.has(name))throw new Error('Duplicate tool name; give operations unique operationIds');used.add(name);
  const properties={},required=[],bindings={path:[],query:{},body:{}};
  for(const raw of [...(item.parameters??[]),...(op.parameters??[])]){
   const p=nodeRef(doc,raw);
   if(['path','query'].includes(p.in)){
    properties[p.name]=resolve(doc,p.schema??{...p,required:undefined});if(p.required||p.in==='path')required.push(p.name);
    if(p.in==='path')bindings.path.push(p.name);else bindings.query[p.name]=p.name;
   }else if(p.in==='body'){
    properties.body=resolve(doc,p.schema);bindings.body.body='';if(p.required)required.push('body');
   }else if(p.in==='header'&&p.required&&!/^(authorization|content-type|accept)$/i.test(p.name))throw new Error(`Required header ${p.name} needs an explicit reviewed adapter`);
   else if(p.in==='formData'||p.in==='cookie')throw new Error(`Unsupported ${p.in} parameter; use a reviewed JSON/auth adapter`);
  }
  if(op.requestBody){const body=nodeRef(doc,op.requestBody);const schema=body.content?.['application/json']?.schema;if(!schema)throw new Error('Only JSON request bodies are supported by this compiler');properties.body=resolve(doc,schema);bindings.body.body='';if(body.required)required.push('body');}
  tools.push({name,description:op.summary??op.description??`${method.toUpperCase()} ${resource}`,method:method.toUpperCase(),path:resource,readOnly:method==='get',inputSchema:{type:'object',properties,required:[...new Set(required)],additionalProperties:false},bindings});
 }
 if(!tools.length)throw new Error('Definition contains no supported HTTP operations');
 return {id:id??slug(doc.info?.title??'custom_api').toLowerCase().replace(/_/g,'-'),name:doc.info?.title??'Custom API',version:doc.info?.version??'0.2.0',baseUrl:base,auth:authFor(doc),tools,workflow:'Call the selected operations from your own API definition using your own credentials.',provenance:['User-supplied API definition']};
}
function fromPostman(doc,{id,baseUrl}){
 if(!doc.info?.schema?.includes('/collection/v2.'))throw new Error('Expected a Postman v2 collection');
 const rows=[];const visit=items=>{for(const item of items??[])item.item?visit(item.item):item.request&&rows.push(item);};visit(doc.item);
 const paths={};let base=baseUrl;const authProfiles=[...(doc.auth?[doc.auth]:[]),...rows.map(row=>row.request?.auth).filter(Boolean)].filter(auth=>auth.type!=='noauth');
 if(new Set(authProfiles.map(auth=>auth.type)).size>1)throw new Error('Collection uses multiple auth methods; split or review the authentication adapters');
 const selectedAuth=doc.auth??authProfiles[0];
 for(const row of rows){
  const request=row.request;if(typeof request==='string')throw new Error('Postman string requests must be expanded before compilation');
  const raw=typeof request.url==='string'?request.url:request.url?.raw;
  if(!raw||raw.includes('{{'))throw new Error('Resolve Postman URL variables before compilation');
  const url=new URL(raw);if(url.username||url.password)throw new Error('Remove embedded URL credentials and use an auth environment variable');base??=url.origin;
  if(url.origin!==new URL(base).origin)throw new Error('Collection uses multiple origins; split into separate connectors');
  const method=(request.method??'GET').toLowerCase();const resource=url.pathname.replace(new URL(base).pathname.replace(/\/$/,''),'')||'/';
  const parameters=[...url.searchParams.keys()].map(name=>({name,in:'query',schema:{type:'string',...(/api.?key|token|secret|password|authorization/i.test(name)?{}:{default:url.searchParams.get(name)})}}));
  for(const match of resource.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g))parameters.push({name:match[1],in:'path',required:true,schema:{type:'string'}});
  const op={operationId:slug(row.name),summary:row.name,parameters};
  if(request.body?.raw){try{JSON.parse(request.body.raw);}catch{throw new Error('Postman body must be JSON');}op.requestBody={required:true,content:{'application/json':{schema:{type:'object',additionalProperties:true}}}};}
  (paths[resource.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g,'{$1}')]??={})[method]=op;
 }
 const auth=selectedAuth?.type;
 const schemes=auth==='bearer'?{provider:{type:'http',scheme:'bearer'}}:auth==='apikey'?(()=>{const values=Object.fromEntries((selectedAuth.apikey??[]).map(x=>[x.key,x.value]));return {provider:{type:'apiKey',in:values.in??'header',name:values.key??'X-API-Key'}};})():{};
 if(auth&&!['bearer','apikey','noauth'].includes(auth))throw new Error('Postman auth requires an explicit adapter');
 return fromOpenApi({openapi:'3.1.0',info:{title:doc.info.name,version:'0.2.0'},servers:[{url:base}],paths,components:{securitySchemes:schemes}},{id,baseUrl:base});
}
function graphInput(type,depth=0){
 if(depth>8)throw new Error('GraphQL input nesting exceeds limit');
 if(isNonNullType(type))return graphInput(type.ofType,depth+1);
 if(isListType(type))return {type:'array',items:graphInput(type.ofType,depth+1)};
 if(isEnumType(type))return {type:'string',enum:type.getValues().map(x=>x.name)};
 if(isInputObjectType(type)){const fields=Object.values(type.getFields());return {type:'object',properties:Object.fromEntries(fields.map(f=>[f.name,graphInput(f.type,depth+1)])),required:fields.filter(f=>isNonNullType(f.type)&&f.defaultValue===undefined).map(f=>f.name)};}
 return {type:type.name==='Int'?'integer':type.name==='Float'?'number':type.name==='Boolean'?'boolean':'string'};
}
function fromGraphql(text,{id='graphql-api',baseUrl}){
 let schema;if(text.trim().startsWith('{')){const parsed=JSON.parse(text);schema=buildClientSchema(parsed.data??parsed);}else schema=buildSchema(text);
 const tools=[];
 for(const [kind,root]of [['query',schema.getQueryType()],['mutation',schema.getMutationType()]])for(const field of Object.values(root?.getFields()??{})){
  const named=getNamedType(field.type);const selection=isScalarType(named)||isEnumType(named)?'':` { ${Object.values(named.getFields?.()??{}).filter(f=>isScalarType(getNamedType(f.type))||isEnumType(getNamedType(f.type))).map(f=>f.name).join(' ')||'__typename'} }`;
  const definitions=field.args.map(a=>`$${a.name}: ${a.type}`).join(', ');const values=field.args.map(a=>`${a.name}: $${a.name}`).join(', ');
  const query=`${kind} PipMCP_${field.name}${definitions?`(${definitions})`:''} { ${field.name}${values?`(${values})`:''}${selection} }`;
  tools.push({name:`${kind}_${field.name}`,description:field.description??`GraphQL ${kind}: ${field.name}`,method:'POST',path:'',readOnly:kind==='query',body:{query},inputSchema:{type:'object',properties:Object.fromEntries(field.args.map(a=>[a.name,graphInput(a.type)])),required:field.args.filter(a=>isNonNullType(a.type)&&a.defaultValue===undefined).map(a=>a.name),additionalProperties:false},bindings:{path:[],query:{},body:Object.fromEntries(field.args.map(a=>[a.name,`variables.${a.name}`]))}});
 }
 if(!tools.length)throw new Error('GraphQL schema contains no root fields');
 return {id,name:'GraphQL API',version:'0.2.0',baseUrl:endpoint(baseUrl??'https://example.com/graphql'),auth:{type:'none'},tools,workflow:'Run typed GraphQL root queries or explicitly approved mutations with your own API endpoint.',provenance:['User-supplied GraphQL schema']};
}
export function compileDefinition(format,text,options={}){
 if(typeof text!=='string'||Buffer.byteLength(text)>5_000_000)throw new Error('Input must be a definition smaller than5MB');
 if(format==='graphql')return fromGraphql(text,options);
 const doc=parseInput(text);if(!doc||typeof doc!=='object')throw new Error('Invalid API definition');
 if(format==='postman')return fromPostman(doc,options);
 if(!['openapi','swagger'].includes(format))throw new Error('Choose openapi, swagger, postman or graphql');
 return fromOpenApi(doc,options);
}
