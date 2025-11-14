import app from './app.js';
import { PORT } from './config/env.js';
import { initDB } from './db/connect.js';


async function start() {
await initDB();
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
}


start().catch(err => {
console.error('Server failed to start', err);
process.exit(1);
});