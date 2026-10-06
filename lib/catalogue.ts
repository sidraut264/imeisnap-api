import { database } from "@/db";
import { ApiError, normalize } from "./core";
import { randomToken, rateLimit } from "./auth";
import { canonicalName, discoverImage, resolveName, ScrapedImage } from "./sources";

export const metadataColumns="id,name,mime,bytes,source_url,source_image_url,attribution,license,license_url,reviewed,created_at";
export interface Model { id:string; name:string; mime:string; bytes:number; source_url:string; source_image_url:string; attribution:string; license:string; license_url:string; reviewed:number; created_at:number }
export async function saveImage(name:string, image:ScrapedImage, reviewed=0) {
  const db=database(), id=normalize(name);
  const saved=await db.prepare(`INSERT INTO models (${metadataColumns},image) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT coalesce(sum(bytes),0) FROM models) - coalesce((SELECT bytes FROM models WHERE id=?),0) + ? <= 400000000 ON CONFLICT(id) DO UPDATE SET name=excluded.name,mime=excluded.mime,bytes=excluded.bytes,source_url=excluded.source_url,source_image_url=excluded.source_image_url,attribution=excluded.attribution,license=excluded.license,license_url=excluded.license_url,reviewed=excluded.reviewed,created_at=excluded.created_at,image=excluded.image WHERE excluded.reviewed=1`).bind(id,name,image.mime,image.image.byteLength,image.sourceUrl,image.sourceImageUrl,image.attribution,image.license,image.licenseUrl,reviewed,Date.now(),image.image.buffer,id,image.image.byteLength).run();
  if(!saved.meta.changes && (reviewed || !await db.prepare("SELECT id FROM models WHERE id=?").bind(id).first())) throw new ApiError(507,"cache_full","The image cache has reached its free-storage safety limit. Remove unused images.");
  return (await db.prepare(`SELECT ${metadataColumns} FROM models WHERE id=?`).bind(id).first<Model>())!;
}
export async function lookup(input:string):Promise<{model:Model;cached:boolean}> {
  const db=database();
  const known=await db.prepare("SELECT name FROM aliases WHERE alias=?").bind(normalize(input)).first<{name:string}>();
  const initialId=normalize(known?.name || canonicalName(input));
  const existing=await db.prepare(`SELECT ${metadataColumns} FROM models WHERE id=?`).bind(initialId).first<Model>();
  if(existing) return {model:existing,cached:true};
  const miss=await db.prepare("SELECT reason FROM misses WHERE query=? AND expires_at>?").bind(normalize(input),Date.now()).first<{reason:string}>();
  if(miss) throw new ApiError(404,"image_not_found",miss.reason);
  const token=randomToken(), lockKey=initialId;
  const lock=await db.prepare("INSERT INTO locks (key,token,expires_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE expires_at<? RETURNING token").bind(lockKey,token,Date.now()+120_000,Date.now()).first<{token:string}>();
  if(lock?.token!==token) throw new ApiError(409,"lookup_in_progress","This model is already being fetched. Retry shortly.",5);
  let canonicalLock:string|undefined;
  try {
    // One global budget bounds public-source traffic, even with multiple API keys.
    await rateLimit("scrapes:minute",5,60); await rateLimit("scrapes:day",100,86400);
    const name=await resolveName(input), canonicalId=normalize(name);
    if(canonicalId!==lockKey) {
      const canonical=await db.prepare("INSERT INTO locks (key,token,expires_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE expires_at<? RETURNING token").bind(canonicalId,token,Date.now()+120_000,Date.now()).first<{token:string}>();
      if(canonical?.token!==token) throw new ApiError(409,"lookup_in_progress","This model is already being fetched. Retry shortly.",5);
      canonicalLock=canonicalId;
    }
    const cached=await db.prepare(`SELECT ${metadataColumns} FROM models WHERE id=?`).bind(normalize(name)).first<Model>();
    if(cached) return {model:cached,cached:true};
    const model=await saveImage(name,await discoverImage(name));
    await db.prepare("DELETE FROM misses WHERE query=?").bind(normalize(input)).run();
    return {model,cached:false};
  } catch(e) {
    if(e instanceof ApiError && e.status===404) await db.prepare("INSERT INTO misses(query,reason,expires_at) VALUES(?,?,?) ON CONFLICT(query) DO UPDATE SET reason=excluded.reason,expires_at=excluded.expires_at").bind(normalize(input),e.message,Date.now()+3600_000).run();
    throw e;
  } finally { await db.prepare("DELETE FROM locks WHERE token=? AND (key=? OR key=?)").bind(token,lockKey,canonicalLock || lockKey).run(); }
}
export function representation(model:Model, origin:string, cached=true) {
  return {model:model.name,cached,image_url:`${origin}/api/v1/images/${encodeURIComponent(model.id)}`,mime_type:model.mime,bytes:model.bytes,source_url:model.source_url,attribution:model.attribution,license:model.license,license_url:model.license_url,reviewed:!!model.reviewed,stored_at:new Date(model.created_at).toISOString()};
}
