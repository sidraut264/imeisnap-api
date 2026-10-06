export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter?: number) { super(message); }
}
export function modelName(value: unknown): string {
  if (typeof value !== "string") throw new ApiError(400, "invalid_model", "Provide a model name or number.");
  const name = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100 || !/^[\p{L}\p{N} ._+()/\-]+$/u.test(name))
    throw new ApiError(400, "invalid_model", "Use 2–100 letters, numbers, spaces, or model punctuation.");
  return name;
}
export function normalize(value: string): string { return value.normalize("NFKC").toLowerCase().replaceAll("+"," plus ").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
export function validImei(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{15}$/.test(value)) return false;
  return [...value].reduce((sum, n, i) => { const d = Number(n) * (i % 2 ? 2 : 1); return sum + (d > 9 ? d - 9 : d); }, 0) % 10 === 0;
}
export function csvRow(line: string): string[] {
  const fields: string[] = []; let field = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (quoted && line[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === "," && !quoted) { fields.push(field.trim()); field = ""; } else field += c;
  }
  fields.push(field.trim()); return fields;
}
export function exactDevice(rows: string[][], query: string): string | null {
  const names = new Map(rows.filter(r => normalize(r[3] || "") === normalize(query)).map(r => { const name=normalize(r[1]).startsWith(normalize(r[0])) ? r[1] : `${r[0]} ${r[1]}`; return [normalize(name),name]; }));
  return names.size === 1 ? [...names.values()][0] : null;
}
export function candidateMatches(title: string, name: string): boolean {
  const t = normalize(title.replace(/^File:/i, "").replace(/\.(jpg|jpeg|png|webp)$/i, ""));
  const q = normalize(name).replace(/^(apple|samsung|google) /, "");
  if (!(` ${t} `).includes(` ${q} `)) return false;
  if (/\b(case|cover|screen protector|teardown|disassembly|logo|icon|screenshot|wallpaper|camera sample|taken with|shot on|versus|vs|comparison|unboxing|software information|software alert|display at|store display|and)\b/.test(t)) return false;
  const extra = t.replace(q, " ");
  if (/\b(pro|max|ultra|plus|mini|lite|fe)\b/.test(extra)) return false;
  return true;
}
export async function readBounded(response: Response, max: number): Promise<Uint8Array> {
  if (Number(response.headers.get("content-length")) > max) { await response.body?.cancel(); throw new ApiError(502, "source_too_large", "The source exceeds the size limit."); }
  if (!response.body) throw new ApiError(502, "empty_source", "The source returned no content.");
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > max) throw new ApiError(502, "source_too_large", "The source exceeds the size limit."); chunks.push(value); } }
  finally { await reader.cancel(); }
  const result = new Uint8Array(size); let offset = 0; for (const c of chunks) { result.set(c, offset); offset += c.length; } return result;
}
export function imageMime(data: Uint8Array): string | null {
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((x,i) => data[i] === x)) return "image/png";
  if (new TextDecoder().decode(data.slice(0,4)) === "RIFF" && new TextDecoder().decode(data.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}
