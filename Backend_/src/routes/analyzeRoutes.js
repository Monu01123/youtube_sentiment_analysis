import express from 'express';
import { analyzeVideo } from '../controllers/analyzeController.js';


const router = express.Router();


router.get('/ping', (req, res) => res.json({ ok: true }));


router.post('/fetch_and_analyze', async (req, res) => {
try {
const videoId = req.body?.video_id;
const force = req.body?.force === true;
if (!videoId) return res.status(400).json({ error: 'video_id required' });
const result = await analyzeVideo(videoId, force);
res.json(result);
} catch (err) {
console.error('Analyze error:', err);
res.status(500).json({ error: err.message || 'Unknown error' });
}
});


export default router;