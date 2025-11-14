# YouTube Sentiment Backend (Modular)


## Setup
1. Copy files into the structure shown.
2. Create `.env` from `.env.example` and set `YOUTUBE_API_KEY`.
3. Install deps: `npm install`.
4. Start: `npm run dev` (requires nodemon) or `npm start`.


Notes:
- If you want HF API usage, add `HF_API_KEY` to `.env`.
- Local transformer (@xenova/transformers) is loaded asynchronously; if unavailable the code falls back to HF or sentiment npm.