const mongoose = require('mongoose');


async function connectDB(uri) {
if (!uri) throw new Error('MONGO_URI is required');
await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (err) => console.error('MongoDB connection error', err));
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
return mongoose.connection;
}


module.exports = connectDB;