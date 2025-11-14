import { fetchAllComments } from '../services/youtubeService.js';
import { analyzeBatch } from '../services/sentimentService.js';
import { writeCache, readCache } from '../db/cache.js';


export async function analyzeVideo(videoId, force = false) {
if (!videoId) throw new Error('videoId required');


if (!force) {
const cached = await readCache(videoId);
if (cached) {
return { cached: true, video_id: videoId, aggregate: {
total: cached.total,
positive: cached.positive,
neutral: cached.neutral,
negative: cached.negative,
positive_pct: cached.positive_pct,
neutral_pct: cached.neutral_pct,
negative_pct: cached.negative_pct,
}};
}
}


const comments = await fetchAllComments(videoId);
// Batch analyze
const BATCH_SIZE = 32;
let pos = 0, neg = 0, neu = 0;


for (let i = 0; i < comments.length; i += BATCH_SIZE) {
const batch = comments.slice(i, i + BATCH_SIZE).map(c => c.text || '');
const results = await analyzeBatch(batch);
for (const r of results) {
if (r.label === 'positive') pos++;
else if (r.label === 'negative') neg++;
else neu++;
}
}


const total = comments.length;
const positive_pct = Number(((pos / Math.max(1, total)) * 100).toFixed(2));
const neutral_pct = Number(((neu / Math.max(1, total)) * 100).toFixed(2));
const negative_pct = Number(((neg / Math.max(1, total)) * 100).toFixed(2));


await writeCache(videoId, comments, { total, pos, neu, neg, positive_pct, neutral_pct, negative_pct });


return {
video_id: videoId,
aggregate: {
total,
positive: pos,
neutral: neu,
negative: neg,
positive_pct,
neutral_pct,
negative_pct,
},
top_positive: comments.slice(0,5).map(c=>c.text),
top_negative: comments.slice(-5).map(c=>c.text),
};
}