
YouTube Sentiment - Pro Upgrade
==================================

This package contains:
- backend/: Node.js backend (full comment pagination, optional transformer, HF API fallback, SQLite cache)
- extension_v2/: Chrome extension (premium UI) to inject panel under YouTube videos

Quick start (backend):
1. cd backend
2. npm install
3. copy .env.example -> .env and set YOUTUBE_API_KEY (required)
   optionally set HF_API_KEY to use Hugging Face Inference API, and TRANSFORMER_MODEL
4. node server.js
   - First run may take longer if transformer loads models (optional).
   - The server caches results per video in comments_cache.db

Quick start (extension):
1. Go to chrome://extensions
2. Enable Developer mode
3. Load unpacked -> select extension_v2 folder from this package
4. Open a YouTube video and wait for panel

Notes:
- Fetching all comments uses YouTube Data API quota. Use cache and avoid repeated full scans.
- If transformer isn't available locally, the server falls back to 'sentiment' package.
- HF Inference API can be faster but requires API key and may incur costs.
