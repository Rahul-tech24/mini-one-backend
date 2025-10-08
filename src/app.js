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


// CORS allowlist from env
const allowedOrigins = process.env.CLIENT_ORIGINS?.split(",").map(o => o.trim()) || [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("❌ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));



app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());


// basic rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);


// Routes
app.use('/auth', authRoutes);
app.use('/api/messages', messageRoutes);


// health
app.get('/', (req, res) => res.send('API is running'));
app.get('/health', (req, res) => res.json({ ok: true }));


// 404
app.use((req, res, next) => res.status(404).json({ error: 'Not found' }));


// central error handler
app.use(errorHandler);


module.exports = app;