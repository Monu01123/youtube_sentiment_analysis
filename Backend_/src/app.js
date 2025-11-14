import express from 'express';
import cors from 'cors';
import routes from './routes/analyzeRoutes.js';


const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));
app.use('/api', routes);


export default app;