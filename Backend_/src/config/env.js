import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const PORT = process.env.PORT || 8000;
export const YT_KEY = process.env.YOUTUBE_API_KEY || '';
export const HF_API_KEY = process.env.HF_API_KEY || '';
export const TRANSFORMER_MODEL = process.env.TRANSFORMER_MODEL || 'cardiffnlp/twitter-roberta-base-sentiment-latest';


if (!YT_KEY) console.warn('⚠️ YOUTUBE_API_KEY not set in .env');