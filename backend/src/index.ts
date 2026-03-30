import express from 'express';
import cors from 'cors';
import { filesRouter } from './routes/files.js';
import { generateRouter } from './routes/generate.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use('/api/files', filesRouter);
app.use('/api/generate', generateRouter);

app.listen(PORT, () => {
  console.log(`Code by Design backend running on http://localhost:${PORT}`);
});

export default app;
