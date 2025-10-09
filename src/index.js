require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');


const PORT = process.env.PORT || 4000;


(async function start() {
try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const server = http.createServer(app);
    server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));


const shutdown = async (signal) => {
console.log(`\nReceived ${signal} — shutting down gracefully`);
server.close(async () => {
const mongoose = require('mongoose');
try { await mongoose.disconnect(); console.log('Mongo disconnected'); } catch (err) { console.error('Error during mongoose disconnect', err); }
process.exit(0);
});


// Force kill after 10s
setTimeout(() => process.exit(1), 10000);
};


process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (err) {
console.error('Failed to start app', err);
process.exit(1);
}
})();