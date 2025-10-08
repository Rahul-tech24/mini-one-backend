const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// =========================
// 🔥 CORS CONFIG
// =========================
const allowedOrigins = process.env.CLIENT_ORIGINS?.split(',').map(o => o.trim()) || [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman/curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn('❌ CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight OPTIONS manually for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// =========================
// 🔒 SECURITY & LOGGING
// =========================
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// =========================
// ⚙️ RATE LIMITER
// =========================
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// =========================
// 🚀 ROUTES
// =========================
app.use('/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Health routes
app.get('/', (req, res) => res.send('API is running'));
app.get('/health', (req, res) => res.json({ ok: true }));

// =========================
// ❌ 404 HANDLER
// =========================
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// =========================
// 🧩 ERROR HANDLER
// =========================
app.use(errorHandler);

module.exports = app;
