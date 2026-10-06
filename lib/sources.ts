import { load } from "cheerio";
import deviceIndex from "./device-index.json";
import { database } from "@/db";
import { ApiError, candidateMatches, imageMime, normalize, readBounded } from "./core";
const COMMONS = "https://commons.wikimedia.org";
const USER_AGENT = process.env.SCRAPER_USER_AGENT || "IMEISnap/1.0 (device image catalogue)";
const hosts = new Set(["commons.wikimedia.org", "upload.wikimedia.org", "thumb.wikimedia.org", "storage.googleapis.com", "support.apple.com"]);
export async function sourceFetch(url: string, missingOk=false): Promise<Response> {
  let current = url;
  for (let i=0; i<4; i++) {
    const parsed=new URL(current);
    if(parsed.protocol!=="https:" || !hosts.has(parsed.hostname) || parsed.port || parsed.username || parsed.password) throw new ApiError(400,"invalid_source","Only supported public source hosts are allowed.");
    const cooldown=await database().prepare("SELECT expires_at FROM limits WHERE key=? AND expires_at>?").bind(`source:${parsed.hostname}`,Math.floor(Date.now()/1000)).first<{expires_at:number}>();
    if(cooldown) throw new ApiError(503,"source_throttled","The image source requested a cooldown. Try again later.",cooldown.expires_at-Math.floor(Date.now()/1000));
    let response: Response;
    try { response=await fetch(current,{headers:{"User-Agent":USER_AGENT,"Accept":"text/html,image/webp,image/png,image/jpeg,*/*;q=0.5"},redirect:"manual",signal:AbortSignal.timeout(12000)}); }
    catch { throw new ApiError(502,"source_unavailable","The image source could not be reached. Try again later."); }
    if([301,302,303,307,308].includes(response.status)) { const location=response.headers.get("location"); await response.body?.cancel(); if(!location) break; current=new URL(location,current).href; continue; }
    if(response.status===404 && missingOk) return response;
    if(response.status===429 || response.status===503 && response.headers.has("retry-after")) {
      const header=response.headers.get("retry-after") || "60";
      const seconds=Math.min(86400,Math.max(1,/^\d+$/.test(header)?Number(header):Math.ceil((Date.parse(header)-Date.now())/1000) || 60));
      await response.body?.cancel();
      await database().prepare("INSERT INTO limits(key,count,expires_at) VALUES(?,0,?) ON CONFLICT(key) DO UPDATE SET expires_at=excluded.expires_at").bind(`source:${parsed.hostname}`,Math.floor(Date.now()/1000)+seconds).run();
      throw new ApiError(503,"source_throttled","The image source requested a cooldown. Try again later.",seconds);
    }
    if(!response.ok) { await response.body?.cancel(); throw new ApiError(502,"source_unavailable",`A public source returned HTTP ${response.status}. Try again later.`); }
    return response;
  }
  throw new ApiError(502,"source_redirect","The source redirected too many times.");
}
async function html(url: string): Promise<string|null> {
  const response=await sourceFetch(url,true); if(response.status===404) { await response.body?.cancel(); return null; }
  const bytes=await readBounded(response,1_500_000);
  return new TextDecoder().decode(bytes);
}
export async function resolveName(input: string): Promise<string> {
  const known=await database().prepare("SELECT name FROM aliases WHERE alias=?").bind(normalize(input)).first<{name:string}>();
  if(known) return known.name;
  let name: string|null=null, source="";
  if(/^A\d{4}$/i.test(input)) {
    source="https://support.apple.com/en-us/108044";
    const page=await html(source);
    if(page){const $=load(page);let heading="";$("h2,p").each((_,el)=>{const text=$(el).text().trim();if(el.tagName==="h2")heading=text;else if(/^iPhone\b/.test(heading)&&/model numbers?:/i.test(text)&&new RegExp(`\\b${input.toUpperCase()}\\b`).test(text))name=heading;});}
  } else {
    source="https://storage.googleapis.com/play_public/supported_devices.csv";
    name=(deviceIndex as Record<string,string>)[normalize(input)] || null;
  }
  if(name) {
    await database().prepare("INSERT INTO aliases(alias,name,source) VALUES(?,?,?) ON CONFLICT(alias) DO NOTHING").bind(normalize(input),name,source).run();
    return canonicalName(name);
  }
  return canonicalName(input);
}
export function canonicalName(input:string) {
  let value=input.trim().replace(/\biphone\b/gi,"iPhone").replace(/\b(samsung|galaxy|google|pixel|ultra|pro|max|mini|plus|apple|xiaomi|redmi|note|oneplus|nokia|motorola|sony|xperia|honor)\b/gi,s=>s[0].toUpperCase()+s.slice(1).toLowerCase()).replace(/\bs(\d+)\b/gi,"S$1").replace(/\bfe\b/gi,"FE");
  value=value.replace(/\boneplus\b/gi,"OnePlus").replace(/\b([asm])([0-9]+)\b/gi,(_,a,b)=>a.toUpperCase()+b).replace(/\bse\b/gi,"SE");
  if(/^Galaxy\b/.test(value)) value=`Samsung ${value}`;
  if(/^Pixel\b/.test(value)) value=`Google ${value}`;
  return value;
}
export interface ScrapedImage { image: Uint8Array; mime: string; sourceUrl: string; sourceImageUrl: string; attribution: string; license: string; licenseUrl: string }
function clean(value: string) { return value.replace(/\s+/g," ").trim().slice(0,1500); }
function commonsFile(value: string) {
  const u=new URL(value,COMMONS);
  if(u.origin!==COMMONS || !u.pathname.startsWith("/wiki/File:") || u.search || u.hash) throw new ApiError(400,"invalid_source","Supply a Wikimedia Commons /wiki/File: page URL.");
  return u.href;
}
export async function scrapeFile(value: string): Promise<ScrapedImage> {
  const sourceUrl=commonsFile(value), page=await html(sourceUrl);
  if(!page) throw new ApiError(404,"image_not_found","The Commons file page does not exist.");
  const $=load(page);
  let imageUrl=$(".fullImageLink img").first().attr("src") || "";
  const author=$("#fileinfotpl_aut").next("td").text().trim() || $(".fileinfotpl .fileinfotpl_aut").text().trim();
  const licenses=$(".licensetpl").toArray().map(el=>{const node=$(el), link=node.find(".licensetpl_link");return {short:node.find(".licensetpl_short").text(),url:link.attr("href") || link.find("a").attr("href") || link.text(),nonfree:node.find(".licensetpl_nonfree").text(),credit:node.find(".licensetpl_attr").text()};});
  const alternatives=$(".mw-filepage-other-resolutions a").toArray().map(el=>$(el).attr("href") || "");
  const license=licenses.find(l=>! /true|yes|1/i.test(l.nonfree.trim()) && /^(CC BY(?:-SA)? [\d.]+|CC0|Public domain)$/i.test(clean(l.short)));
  if(!license || !clean(author || license?.credit || "")) throw new ApiError(404,"unsupported_license","No supported license and author were found. Choose another Commons file.");
  const match=license.url.match(/(?:https?:)?\/\/creativecommons\.org\/[^\s<>]+/i);
  let licenseUrl=match?new URL(match[0],"https://creativecommons.org").href:"";
  if(!licenseUrl && /^public domain$/i.test(clean(license.short))) licenseUrl="https://creativecommons.org/publicdomain/mark/1.0/";
  if(!licenseUrl) throw new ApiError(404,"unsupported_license","The image has no supported license URL.");
  // Prefer an existing 250–500px thumbnail. Never invent transformed image URLs.
  const thumbnail=alternatives.find(u=>/(?:\/|-)\d{3}px-/.test(u) && Number(u.match(/(\d{3})px-/)?.[1])>=250 && Number(u.match(/(\d{3})px-/)?.[1])<=500);
  imageUrl=thumbnail || imageUrl;
  if(!imageUrl) throw new ApiError(404,"image_not_found","No image was found on the file page.");
  const sourceImageUrl=new URL(imageUrl,COMMONS).href;
  if(!["upload.wikimedia.org","thumb.wikimedia.org"].includes(new URL(sourceImageUrl).hostname)) throw new ApiError(502,"invalid_image_host","The image host is unsupported.");
  const response=await sourceFetch(sourceImageUrl);
  const image=await readBounded(response,256_000), mime=imageMime(image);
  if(!mime) throw new ApiError(404,"unsupported_image","Only JPEG, PNG and WebP images are supported.");
  return {image,mime,sourceUrl,sourceImageUrl,attribution:clean(license.credit || author),license:clean(license.short),licenseUrl};
}
export async function discoverImage(name: string): Promise<ScrapedImage> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST || "mobile-phone-specs-database.p.rapidapi.com";
  
  if (rapidApiKey) {
    try {
      const brand = name.split(" ")[0];
      const modelQuery = name.split(" ").slice(1).join(" ");

      const modelsRes = await fetch(`https://${rapidApiHost}/gsm/get-models-by-brandname/${encodeURIComponent(brand)}`, {
        headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': rapidApiHost }
      });

      if (modelsRes.ok) {
        const models = await modelsRes.json() as any[];
        // Find best match allowing for fuzzy matching (like "5G" suffixes)
        const match = models.find(m => candidateMatches(m.modelValue, modelQuery) || candidateMatches(m.modelValue, name));
        
        if (match) {
          const specsRes = await fetch(`https://${rapidApiHost}/gsm/get-specifications-by-brandname-modelname/${encodeURIComponent(brand)}/${encodeURIComponent(match.modelValue)}`, {
            headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': rapidApiHost }
          });
          
          if (specsRes.ok) {
            const specs = await specsRes.json() as any;
            const customId = specs?.phoneDetails?.customId;
            
            if (customId) {
              const imagesRes = await fetch(`https://${rapidApiHost}/gsm/get-phone-images-links-by-phone-custom-id/${customId}`, {
                headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': rapidApiHost }
              });
              
              if (imagesRes.ok) {
                const images = await imagesRes.json() as any[];
                const imageUrl = images?.[0]?.link;
                
                if (imageUrl) {
                  const imgResponse = await fetch(imageUrl);
                  if (imgResponse.ok) {
                    const image = await readBounded(imgResponse, 500_000);
                    const mime = imageMime(image);
                    if (mime) {
                      return {
                        image,
                        mime,
                        sourceUrl: `https://www.gsmarena.com/res.php3?sSearch=${encodeURIComponent(match.modelValue)}`,
                        sourceImageUrl: imageUrl,
                        attribution: "GSMArena (via RapidAPI)",
                        license: "Copyrighted/Fair Use",
                        licenseUrl: "https://www.gsmarena.com"
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("RapidAPI fetch failed, falling back to Wikimedia:", error);
    }
  }

  // Fallback to Wikimedia Commons
  const title=name.replace(/^apple /i,"");
  const category=`${COMMONS}/wiki/Category:${encodeURIComponent(title.replaceAll(" ","_"))}`;
  const page=await html(category);
  if(!page) throw new ApiError(404,"image_not_found","No exact model category was found. Add a model alias or a Commons file in the admin panel.");
  const candidates=new Map<string,string>();
  const $=load(page);
  $(".gallerybox a[href]").each((_,el)=>{
    const href=$(el).attr("href");if(!href?.startsWith("/wiki/File:"))return;
    let filename:string;try{filename=decodeURIComponent(href.slice(6)).replaceAll("_"," ");}catch{return;}
    if(candidateMatches(filename,title))candidates.set(href,filename);
  });
  let upstreamError:ApiError|undefined;
  for(const [href] of [...candidates].sort((a,b)=>a[1].length-b[1].length).slice(0,4)) {
    try { return await scrapeFile(href); } catch(e) { if(!(e instanceof ApiError)) throw e; if(e.retryAfter) throw e; if(e.status>=500) upstreamError=e; }
  }
  if(upstreamError) throw upstreamError;
  throw new ApiError(404,"image_not_found","No suitable licensed image matched this exact model. Add a Commons file in the admin panel.");
}
