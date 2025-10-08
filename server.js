// index.js (hardened)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- CORS allowlist ----------
const whitelist = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server tools (no origin) like curl/postman
    if (!origin) return callback(null, true);
    if (whitelist.length === 0 || whitelist.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  }
}));

// ---------- Basic security & logging ----------
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));

// ---------- Rate limiter ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15m
  max: 200, // limit each IP to 200 requests per windowMs
});
app.use(limiter);

// ---------- Mongoose model ----------
const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

// Optionally create index for createdAt to optimize sorting
MessageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', MessageSchema);

// ---------- Connect to MongoDB ----------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-one';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('Mongo connection error', err); process.exit(1); });

// ---------- Helpers ----------
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------- Routes ----------
// GET
app.get('/api/messages', async (req, res, next) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json(msgs);
  } catch (err) { next(err); }
});

// POST
app.post('/api/messages', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

    // sanitize more if needed
    const m = new Message({ text: text.trim() });
    await m.save();
    res.status(201).json(m);
  } catch (err) { next(err); }
});

// PUT (update)
app.put('/api/messages/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

    const updated = await Message.findByIdAndUpdate(
      id,
      { text: text.trim() },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE
app.delete('/api/messages/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) { next(err); }
});

// health
app.get('/', (req, res) => res.send('API is running'));
app.get('/health', (req, res) => res.json('this is health check endpoint'));

// ---------- Central error handler ----------
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ---------- Graceful shutdown ----------
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Mongo connection');
  await mongoose.disconnect();
  process.exit(0);
});


app.listen(PORT, () => console.log(`🚀 Backend listening on port ${PORT}`));
