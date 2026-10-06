const env = process.env;
import { database } from "@/db";
import { ApiError, modelName, normalize } from "./core";
import { authorize, hash, isAdmin, jsonBody, login, randomToken, rateLimit, requireAdmin, sameOrigin } from "./auth";
import { lookup, metadataColumns, Model, representation, saveImage } from "./catalogue";
import { resolveImei } from "./imei";
import { scrapeFile } from "./sources";

const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{"cache-control":"no-store"}});
async function route(request:Request):Promise<Response> {
  const url=new URL(request.url), path=url.pathname, method=request.method, db=database();
  if(method==="OPTIONS") return new Response(null,{status:204});
  if(path==="/api/health" && method==="GET") { await db.prepare("SELECT 1").first(); return json({status:"ok",service:"imeisnap",version:"1.0.0"}); }
  if(path==="/api/admin/session" && method==="GET") return json({authenticated:await isAdmin(request)});
  if(path==="/api/admin/login" && method==="POST") return login(request);
  if(path==="/api/admin/logout" && method==="POST") { sameOrigin(request);return new Response(null,{status:204,headers:{"set-cookie":"imeisnap_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0","cache-control":"no-store"}}); }
  if(path.startsWith("/api/admin/")) {
    await requireAdmin(request);
    if(path==="/api/admin/overview" && method==="GET") {
      await db.batch([db.prepare("DELETE FROM limits WHERE expires_at<?").bind(Math.floor(Date.now()/1000)-86400),db.prepare("DELETE FROM misses WHERE expires_at<?").bind(Date.now()),db.prepare("DELETE FROM locks WHERE expires_at<?").bind(Date.now())]);
      const [stats,keys,aliases,tacs,misses,budget]=await Promise.all([
        db.prepare("SELECT count(*) AS models,coalesce(sum(bytes),0) AS bytes,coalesce(sum(reviewed),0) AS reviewed FROM models").first(),
        db.prepare("SELECT id,name,prefix,created_at FROM api_keys ORDER BY created_at DESC").all(),
        db.prepare("SELECT alias,name,source FROM aliases ORDER BY alias LIMIT 200").all(),
        db.prepare("SELECT tac,name FROM tac_mappings ORDER BY tac LIMIT 200").all(),
        db.prepare("SELECT query,reason,expires_at FROM misses ORDER BY expires_at DESC LIMIT 30").all(),
        db.prepare("SELECT count,expires_at FROM limits WHERE key='scrapes:day' AND expires_at>?").bind(Math.floor(Date.now()/1000)).first(),
      ]);
      return json({stats,keys:keys.results,aliases:aliases.results,tacs:tacs.results,misses:misses.results,budget,provider:env.IMEI_PROVIDER_URL?"http":"local-tac"});
    }
    if(path==="/api/admin/models" && method==="GET") {
      const search=(url.searchParams.get("search") || "").slice(0,100), page=Math.max(1,Math.min(100000,Number(url.searchParams.get("page")) || 1));
      const pattern=`%${search.replace(/[\\%_]/g,"\\$&")}%`;
      const [rows,count]=await Promise.all([db.prepare(`SELECT ${metadataColumns} FROM models WHERE name LIKE ? ESCAPE '\\' ORDER BY created_at DESC LIMIT 20 OFFSET ?`).bind(pattern,(page-1)*20).all<Model>(),db.prepare("SELECT count(*) AS total FROM models WHERE name LIKE ? ESCAPE '\\'").bind(pattern).first()]);
      return json({models:rows.results,...count,page});
    }
    if(path==="/api/admin/models" && method==="POST") {
      const data=await jsonBody(request), name=modelName(data.model);
      if(typeof data.source_url!=="string") throw new ApiError(400,"invalid_source","Provide a Commons file page URL.");
      await rateLimit("scrapes:minute",5,60); await rateLimit("scrapes:day",100,86400);
      const image=await scrapeFile(data.source_url);
      const model=await saveImage(name,image,1);
      await db.prepare("DELETE FROM misses").run();
      return json(representation(model,url.origin,false),201);
    }
    if(path.startsWith("/api/admin/models/") && ["DELETE","PATCH"].includes(method)) {
      const id=decodeURIComponent(path.slice("/api/admin/models/".length));
      if(method==="DELETE") await db.batch([db.prepare("DELETE FROM models WHERE id=?").bind(id),db.prepare("DELETE FROM misses")]);
      else await db.prepare("UPDATE models SET reviewed=1 WHERE id=?").bind(id).run();
      return json({ok:true});
    }
    if(path==="/api/admin/keys" && method==="POST") {
      const data=await jsonBody(request), name=modelName(data.name), token=`isk_${randomToken()}`, id=crypto.randomUUID();
      const count=await db.prepare("SELECT count(*) AS n FROM api_keys").first<{n:number}>();
      if((count?.n || 0)>=20) throw new ApiError(409,"key_limit","Revoke an unused key before creating another.");
      await db.prepare("INSERT INTO api_keys(id,name,hash,prefix,created_at) VALUES(?,?,?,?,?)").bind(id,name,await hash(token),token.slice(0,12),Date.now()).run();
      return json({id,name,key:token},201);
    }
    if(path.startsWith("/api/admin/keys/") && method==="DELETE") { await db.prepare("DELETE FROM api_keys WHERE id=?").bind(path.slice("/api/admin/keys/".length)).run(); return json({ok:true}); }
    if(path==="/api/admin/aliases" && method==="POST") {
      const data=await jsonBody(request), alias=normalize(modelName(data.alias)), name=modelName(data.name);
      const incoming=await db.prepare("SELECT name FROM aliases").all<{name:string}>();
      if(alias!==normalize(name) && incoming.results.some(row=>normalize(row.name)===alias)) throw new ApiError(400,"alias_chain","This name is used as a canonical destination. Update those mappings before making it an alias.");
      // Canonical destinations are stored directly; chains/cycles would make lookups ambiguous.
      const destination=await db.prepare("SELECT name FROM aliases WHERE alias=?").bind(normalize(name)).first<{name:string}>();
      if(destination && normalize(destination.name)!==normalize(name)) throw new ApiError(400,"alias_chain","Use the final model name as the destination, rather than another alias.");
      await db.batch([db.prepare("INSERT INTO aliases(alias,name,source) VALUES(?,?,'admin') ON CONFLICT(alias) DO UPDATE SET name=excluded.name,source='admin'").bind(alias,name),db.prepare("DELETE FROM misses")]);
      return json({ok:true},201);
    }
    if(path.startsWith("/api/admin/aliases/") && method==="DELETE") { await db.prepare("DELETE FROM aliases WHERE alias=?").bind(decodeURIComponent(path.slice("/api/admin/aliases/".length))).run(); return json({ok:true}); }
    if(path==="/api/admin/tacs" && method==="POST") {
      const data=await jsonBody(request), name=modelName(data.name);
      if(typeof data.tac!=="string" || !/^\d{8}$/.test(data.tac)) throw new ApiError(400,"invalid_tac","TAC must contain exactly eight digits.");
      await db.prepare("INSERT INTO tac_mappings(tac,name) VALUES(?,?) ON CONFLICT(tac) DO UPDATE SET name=excluded.name").bind(data.tac,name).run(); return json({ok:true},201);
    }
    if(path.startsWith("/api/admin/tacs/") && method==="DELETE") { await db.prepare("DELETE FROM tac_mappings WHERE tac=?").bind(path.slice("/api/admin/tacs/".length)).run(); return json({ok:true}); }
    if(path==="/api/admin/misses" && method==="DELETE") { await db.prepare("DELETE FROM misses").run();return json({ok:true}); }
    throw new ApiError(404,"not_found","This admin endpoint does not exist.");
  }
  await authorize(request);
  if(path==="/api/v1/image" && method==="GET") {
    const {model,cached}=await lookup(modelName(url.searchParams.get("model")));
    if(url.searchParams.get("format")==="image") return imageResponse(request,model.id,cached);
    return json(representation(model,url.origin,cached));
  }
  if(path==="/api/v1/imei" && method==="POST") {
    const data=await jsonBody(request);
    await rateLimit("imei:minute",10,60);
    const name=await resolveImei(data.imei), {model,cached}=await lookup(name);
    return json(representation(model,url.origin,cached));
  }
  if(path.startsWith("/api/v1/images/") && method==="GET") return imageResponse(request,decodeURIComponent(path.slice("/api/v1/images/".length)),true);
  throw new ApiError(404,"not_found","This endpoint does not exist. Use GET /api/v1/image?model=... or POST /api/v1/imei.");
}
async function imageResponse(request:Request,id:string,cached:boolean) {
  const row=await database().prepare("SELECT image,mime,created_at,bytes FROM models WHERE id=?").bind(id).first<{image:number[]|ArrayBuffer;mime:string;created_at:number;bytes:number}>();
  if(!row) throw new ApiError(404,"image_not_found","This image is not in the cache.");
  const etag=`\"${row.created_at}-${row.bytes}\"`, headers={"content-type":row.mime,"cache-control":"private, no-cache","etag":etag,"x-image-cache":cached?"HIT":"MISS","vary":"Authorization, Cookie, X-API-Key"};
  if(request.headers.get("if-none-match")===etag) return new Response(null,{status:304,headers});
  return new Response(new Uint8Array(row.image),{headers});
}
export async function handleApi(request:Request):Promise<Response> {
  let response:Response;
  try { response=await route(request); }
  catch(error) {
    if(error instanceof ApiError) { response=json({error:{code:error.code,message:error.message}},error.status); if(error.retryAfter) response.headers.set("retry-after",String(error.retryAfter)); }
    else { console.error("IMEISnap request failed",error instanceof Error?error.name:"UnknownError"); response=json({error:{code:"service_unavailable",message:"The service is unavailable. Check database bindings and migrations, then retry."}},503); }
  }
  response.headers.set("x-content-type-options","nosniff");response.headers.set("referrer-policy","no-referrer");
  const origin=request.headers.get("origin");
  if(origin && env.CORS_ORIGIN && origin===env.CORS_ORIGIN && new URL(request.url).pathname.startsWith("/api/v1/")) {
    response.headers.set("access-control-allow-origin",origin); response.headers.set("access-control-allow-methods","GET, POST, OPTIONS"); response.headers.set("access-control-allow-headers","Authorization, X-API-Key, Content-Type, If-None-Match"); response.headers.append("vary","Origin");
  }
  return response;
}
