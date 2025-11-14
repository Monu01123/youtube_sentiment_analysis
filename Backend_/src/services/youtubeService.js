import axios from 'axios';
import { YT_KEY } from '../config/env.js';


export async function fetchAllComments(videoId, maxPages = 300) {
if (!YT_KEY) throw new Error('Missing YOUTUBE_API_KEY');


const all = [];
let pageToken = null;
let pages = 0;


while (true) {
pages++;


const params = {
part: 'snippet',
videoId,
maxResults: 100,
key: YT_KEY,
};


if (pageToken) params.pageToken = pageToken;


const res = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', { params, timeout: 30000 });
const items = res.data.items || [];


for (const item of items) {
const s = item.snippet.topLevelComment.snippet;
all.push({
id: item.id,
text: s.textOriginal || '',
author: s.authorDisplayName || '',
likes: s.likeCount || 0,
published: s.publishedAt || null,
});
}


pageToken = res.data.nextPageToken || null;
if (!pageToken) break;
if (pages >= maxPages) break;
await new Promise((r) => setTimeout(r, 100));
}


return all;
}