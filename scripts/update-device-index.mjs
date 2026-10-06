import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source='https://storage.googleapis.com/play_public/supported_devices.csv';
const input=process.argv[2];
const bytes=input?await readFile(input):new Uint8Array(await (await fetch(source,{signal:AbortSignal.timeout(30000)})).arrayBuffer());
if(bytes.length>8_000_000)throw new Error('Device list exceeds the expected size');
const text=new TextDecoder(bytes[0]===255&&bytes[1]===254?'utf-16le':'utf-8').decode(bytes);
const normalize=s=>s.normalize('NFKC').toLowerCase().replaceAll('+',' plus ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function row(line){let value='',quote=false;const fields=[];for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quote&&line[i+1]==='"'){value+='"';i++;}else quote=!quote;}else if(c===','&&!quote){fields.push(value.trim());value='';}else value+=c;}fields.push(value.trim());return fields;}
const index=new Map(),ambiguous=new Set();
for(const line of text.split(/\r?\n/).slice(1)){
 const [brand,name,,model]=row(line);if(!brand||!name||!model)continue;
 const key=normalize(model),full=normalize(name).startsWith(normalize(brand))?name:`${brand} ${name}`;
 if(ambiguous.has(key))continue;
 if(index.has(key)&&normalize(index.get(key))!==normalize(full)){index.delete(key);ambiguous.add(key);}else index.set(key,full);
}
if(index.size<10000)throw new Error('Incomplete or invalid device list; refusing to replace index');
await writeFile(fileURLToPath(new URL('../lib/device-index.json',import.meta.url)),JSON.stringify(Object.fromEntries([...index].sort((a,b)=>a[0].localeCompare(b[0]))))+'\n');
await writeFile(fileURLToPath(new URL('../lib/device-index-meta.json',import.meta.url)),JSON.stringify({source,updated_at:new Date().toISOString(),models:index.size,ambiguous_models_excluded:ambiguous.size},null,2)+'\n');
console.log(`Saved ${index.size} unambiguous model mappings. Excluded ${ambiguous.size} ambiguous codes.`);
