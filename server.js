// Xe1640JSY2gwkEyi password
//rahulrajput808160_db_user


require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-one';

// Minimal middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://mini-one-frontend.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  }
}));

app.use(express.json());

// Minimal Mongoose model (inline for smallest footprint)
const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error(err); process.exit(1); });

// Routes (minimal)
app.get('/api/messages', async (req, res) => {
  const msgs = await Message.find().sort({ createdAt: -1 }).limit(100);
  res.json(msgs);
});

app.post('/api/messages', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
  const m = new Message({ text: text.trim() });
  await m.save();
  res.status(201).json(m);
});

// Update a message
app.put('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text required' });
  }

  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      { text: text.trim() },
      { new: true } // return updated doc
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(updatedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete a message
app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Message.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});




// health
app.get('/', (req, res) => res.send('API is running'));

// Start
app.listen(PORT, () => console.log(`🚀 Backend listening on http://localhost:${PORT}`));


