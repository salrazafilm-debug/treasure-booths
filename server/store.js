import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const initialPricing = { digital: { name: 'Digital Treasures', base: 275, extra: 50 }, prints: { name: 'Forever Treasures', base: 390, extra: 75 } };
export const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {const d=new Date(v+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v;},'Choose a valid date.');
export const bookingSchema = z.object({ name:z.string().trim().min(2).max(100), email:z.email().max(200), phone:z.string().trim().min(7).max(30), date:dateSchema.refine(v=>v>=today(),'Choose today or a future date.'), time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), event:z.enum(['Wedding','Birthday','Graduation','Corporate event','Baby shower','Holiday party','Other celebration']), venue:z.string().trim().min(3).max(300), guests:z.coerce.number().int().min(1).max(10000), package:z.enum(['digital','prints']), hours:z.coerce.number().int().min(3).max(10), notes:z.string().trim().max(2000).default(''), consent:z.literal(true), website:z.string().max(0).optional() });
export function createStore(directory) {
 mkdirSync(directory,{recursive:true,mode:0o700});
 const db=new DatabaseSync(resolve(directory,'treasure.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,date TEXT NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL,created TEXT NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS one_active_date ON bookings(date) WHERE status IN ('pending','confirmed'); CREATE TABLE IF NOT EXISTS blocks(date TEXT PRIMARY KEY,note TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER NOT NULL);`);
 const get=(key,fallback)=>{const row=db.prepare('SELECT value FROM settings WHERE key=?').get(key);return row?JSON.parse(row.value):fallback;};
 const set=(key,value)=>db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));
 const pricing=()=>get('pricing',initialPricing);
 const quote=(pkg,hours)=>{const p=pricing()[pkg];return p.base+(hours-3)*p.extra;};
 const unavailable=()=>[...db.prepare("SELECT date FROM bookings WHERE status IN ('pending','confirmed') UNION SELECT date FROM blocks").all()].map(r=>r.date);
 function book(input){const data=bookingSchema.parse(input);const id=randomUUID();const total=quote(data.package,data.hours); db.exec('BEGIN IMMEDIATE');try{if(unavailable().includes(data.date))throw Object.assign(new Error('This date is no longer available. Please choose another date.'),{status:409});db.prepare('INSERT INTO bookings VALUES (?,?,?,?,?)').run(id,data.date,'pending',JSON.stringify({...data,total}),new Date().toISOString());db.exec('COMMIT');return {id,total,status:'pending'};}catch(e){db.exec('ROLLBACK');throw e;}}
 function status(id,status){db.exec('BEGIN IMMEDIATE');try{const row=db.prepare('SELECT date FROM bookings WHERE id=?').get(id);if(!row)throw Object.assign(new Error('Booking not found.'),{status:404});if(status!=='cancelled'&&(db.prepare('SELECT date FROM blocks WHERE date=?').get(row.date)||db.prepare("SELECT id FROM bookings WHERE date=? AND id<>? AND status IN ('pending','confirmed')").get(row.date,id)))throw Object.assign(new Error('This date is occupied. Release it before restoring this booking.'),{status:409});db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status,id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
 return {db,get,set,pricing,quote,unavailable,book,status,bookings:()=>db.prepare('SELECT * FROM bookings ORDER BY created DESC').all().map(r=>({...JSON.parse(r.data),id:r.id,status:r.status,created:r.created}))};
}
