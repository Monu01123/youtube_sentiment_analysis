import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../comments_cache.db');


const sqlite = sqlite3.verbose();
const db = new sqlite.Database(DB_PATH);


export function dbRun(sql, params = []) {
return new Promise((resolve, reject) => {
db.run(sql, params, function (err) {
if (err) reject(err);
else resolve(this);
});
});
}


export function dbGet(sql, params = []) {
return new Promise((resolve, reject) => {
db.get(sql, params, (err, row) => {
if (err) reject(err);
else resolve(row);
});
});
}


export async function initDB() {
await dbRun(`
CREATE TABLE IF NOT EXISTS cache (
video_id TEXT PRIMARY KEY,
fetched_at INTEGER,
total INTEGER,
positive INTEGER,
neutral INTEGER,
negative INTEGER,
positive_pct REAL,
neutral_pct REAL,
negative_pct REAL,
raw_json TEXT
)
`);
}


export default db;