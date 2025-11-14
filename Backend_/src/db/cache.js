import { dbRun, dbGet } from './connect.js';


export async function writeCache(videoId, comments, counts) {
const { total, pos, neu, neg, positive_pct, neutral_pct, negative_pct } = counts;
await dbRun(
`INSERT OR REPLACE INTO cache (video_id, fetched_at, total, positive, neutral, negative, positive_pct, neutral_pct, negative_pct, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
[videoId, Date.now(), total, pos, neu, neg, positive_pct, neutral_pct, negative_pct, JSON.stringify(comments)]
);
}


export async function readCache(videoId) {
return dbGet('SELECT * FROM cache WHERE video_id = ?', [videoId]);
}