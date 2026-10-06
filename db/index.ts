import { createClient, type Client, type InValue, type InStatement } from "@libsql/client";
let client:Client|undefined;
function connection(){
  if(!client){
    const url=process.env.TURSO_DATABASE_URL || (process.env.VERCEL?"":"file:./local.db");
    if(!url || process.env.VERCEL && !/^libsql:\/\/|^https:\/\//.test(url)) throw new Error("Set TURSO_DATABASE_URL to a remote database for Vercel.");
    client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
  }
  return client;
}
class Statement {
  constructor(readonly sql:string,readonly args:InValue[]=[]){ }
  bind(...args:unknown[]){return new Statement(this.sql,args as InValue[]);}
  async first<T=Record<string,unknown>>():Promise<T|null>{return (await connection().execute(this)).rows[0] as T || null;}
  async all<T=Record<string,unknown>>(){return {results:(await connection().execute(this)).rows as unknown as T[]};}
  async run(){const r=await connection().execute(this);return {meta:{changes:r.rowsAffected}};}
}
export function database(){return {prepare:(sql:string)=>new Statement(sql),batch:(statements:Statement[])=>connection().batch(statements as InStatement[],"write")};}

export function closeDatabase(){client?.close();client=undefined;}
