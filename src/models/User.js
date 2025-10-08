const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
username: { type: String, required: true, trim: true, unique: true, minlength: 3, maxlength: 50 },
email: { type: String, required: true, trim: true, unique: true, lowercase: true },
passwordHash: { type: String, required: true }
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);