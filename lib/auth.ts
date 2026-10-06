const env = process.env;
import { database } from "@/db";
import { ApiError, readBounded } from "./core";
const encoder = new TextEncoder();
export async function hash(value: string): Promise<string> { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))].map(n => n.toString(16).padStart(2,"0")).join(""); }
export function randomToken() { return [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2,"0")).join(""); }
async function hmac(value: string) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new ApiError(503,"setup_required","Set SESSION_SECRET to at least 32 random characters.");
  const key = await crypto.subtle.importKey("raw",encoder.encode(env.SESSION_SECRET),{name:"HMAC", hash:"SHA-256"},false,["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(value)))].map(n => n.toString(16).padStart(2,"0")).join("");
}
async function same(a: string, b: string) { const [x,y] = await Promise.all([hash(a),hash(b)]); let n=0; for(let i=0;i<x.length;i++) n |= x.charCodeAt(i)^y.charCodeAt(i); return n===0; }
export async function isAdmin(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith("imeisnap_session="))?.split("=")[1];
  if (!cookie || !env.SESSION_SECRET) return false;
  const [expiry, sig] = cookie.split(".");
  return /^\d+$/.test(expiry) && Number(expiry)>Date.now() && !!sig && await same(sig,await hmac(expiry));
}
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new ApiError(403,"invalid_origin","Use the admin panel on this site's own origin.");
}
export async function requireAdmin(request: Request) {
  if (!await isAdmin(request)) throw new ApiError(401,"unauthorized","Sign in to the admin panel.");
  if (!["GET","HEAD"].includes(request.method)) sameOrigin(request);
}
export async function rateLimit(key: string, max: number, seconds: number) {
  const now = Math.floor(Date.now()/1000);
  const row = await database().prepare(`INSERT INTO limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END WHERE expires_at<=? OR count<? RETURNING count,expires_at`).bind(key,now+seconds,now,now,now,max).first<{count:number;expires_at:number}>();
  if (!row) {
    const blocked=await database().prepare("SELECT expires_at FROM limits WHERE key=?").bind(key).first<{expires_at:number}>();
    throw new ApiError(429,"rate_limited","Request limit reached. Try again later.",Math.max(1,(blocked?.expires_at || now+seconds)-now));
  }
}
export async function authorize(request: Request) {
  if (await isAdmin(request)) { if (request.method !== "GET") sameOrigin(request); return; }
  const token=request.headers.get("authorization")?.replace(/^Bearer /i,"") || request.headers.get("x-api-key");
  if (!token || token.length>200) throw new ApiError(401,"unauthorized","Supply an API key in Authorization: Bearer <key>.");
  const row=await database().prepare("SELECT id FROM api_keys WHERE hash=?").bind(await hash(token)).first<{id:string}>();
  if (!row) throw new ApiError(401,"unauthorized","The API key is invalid or revoked.");
  await rateLimit(`api:${row.id}`,60,60);
}
export async function login(request: Request) {
  sameOrigin(request);
  const ip = (process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : undefined) || "local";
  await rateLimit(`login:${await hash(ip)}`,10,900);
  const data=await jsonBody(request);
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length<16) throw new ApiError(503,"setup_required","Set ADMIN_PASSWORD to at least 16 characters.");
  if (typeof data.password!=="string" || !await same(data.password,env.ADMIN_PASSWORD)) throw new ApiError(401,"invalid_password","Incorrect admin password.");
  const expiry=String(Date.now()+12*3600*1000);
  return Response.json({ok:true},{headers:{"set-cookie":`imeisnap_session=${expiry}.${await hmac(expiry)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${new URL(request.url).protocol==="https:"?"; Secure":""}`,"cache-control":"no-store"}});
}
export async function jsonBody(request: Request): Promise<Record<string,unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415,"invalid_content_type","Send application/json.");
  try { const data=JSON.parse(new TextDecoder().decode(await readBounded(new Response(request.body),16_384))); if (!data || typeof data!=="object" || Array.isArray(data)) throw new Error(); return data; }
  catch (e) { if(e instanceof ApiError && e.code === "source_too_large") throw new ApiError(413,"body_too_large","JSON body must not exceed 16 KB."); throw new ApiError(400,"invalid_json","Send a valid JSON object."); }
}
