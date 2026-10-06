import { createClient } from '@libsql/client';
import { readFile } from 'node:fs/promises';
const url=process.env.TURSO_DATABASE_URL || 'file:./local.db';
const db=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 await db.execute('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
 const journal=JSON.parse(await readFile('drizzle/meta/_journal.json','utf8'));
 for(const entry of journal.entries){
  const name=entry.tag;
  if((await db.execute({sql:'SELECT name FROM _migrations WHERE name=?',args:[name]})).rows.length)continue;
  const sql=await readFile(`drizzle/${name}.sql`,'utf8');
  await db.batch([...sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean),{sql:'INSERT INTO _migrations(name,applied_at) VALUES(?,?)',args:[name,Date.now()]}],'write');
  console.log(`Applied ${name}`);
 }
 console.log('Database ready.');
}finally{db.close();}
