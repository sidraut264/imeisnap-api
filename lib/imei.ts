const env = process.env;
import { database } from "@/db";
import { ApiError, modelName, readBounded, validImei } from "./core";

export interface ImeiProvider { resolve(imei: string): Promise<string> }
export class LocalTacProvider implements ImeiProvider {
  async resolve(imei: string) {
    const row=await database().prepare("SELECT name FROM tac_mappings WHERE tac=?").bind(imei.slice(0,8)).first<{name:string}>();
    if(!row) throw new ApiError(422,"unknown_tac","No model is mapped to this TAC. Supply a model directly, add a TAC mapping, or configure an IMEI provider.");
    return row.name;
  }
}
/** Replace this adapter when a supplier uses a different method or request body. */
export class HttpImeiProvider implements ImeiProvider {
  async resolve(imei: string) {
    const url=new URL(env.IMEI_PROVIDER_URL!);
    if(url.protocol!=="https:" || url.username || url.password || url.hostname==="localhost" || /^[\d.:[\]]+$/.test(url.hostname)) throw new ApiError(503,"invalid_provider","Configure a public HTTPS IMEI provider URL.");
    let response:Response;
    try { response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",...(env.IMEI_PROVIDER_TOKEN?{Authorization:`Bearer ${env.IMEI_PROVIDER_TOKEN}`}:{})},body:JSON.stringify({imei}),redirect:"error",signal:AbortSignal.timeout(10000)}); }
    catch { throw new ApiError(502,"provider_unavailable","The IMEI provider could not be reached."); }
    if(!response.ok) { await response.body?.cancel(); throw new ApiError(502,"provider_error","The IMEI provider rejected the lookup."); }
    let data:unknown;
    try { data=JSON.parse(new TextDecoder().decode(await readBounded(response,64_000))); } catch { throw new ApiError(502,"provider_response","The IMEI provider returned invalid JSON."); }
    for(const part of (env.IMEI_MODEL_PATH || "model").split(".")) data=data && typeof data==="object" ? (data as Record<string,unknown>)[part] : undefined;
    try { return modelName(data); } catch { throw new ApiError(502,"provider_response","No valid model was found at the configured response path."); }
  }
}
export async function resolveImei(value:unknown) {
  if(!validImei(value)) throw new ApiError(400,"invalid_imei","Supply a 15-digit IMEI with a valid checksum.");
  const provider:ImeiProvider=env.IMEI_PROVIDER_URL?new HttpImeiProvider():new LocalTacProvider();
  return provider.resolve(value);
}
