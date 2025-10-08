const mongoose = require('mongoose');


const MessageSchema = new mongoose.Schema({
text: { type: String, required: true, trim: true, maxlength: 1000 },
author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });


MessageSchema.index({ createdAt: -1 });


module.exports = mongoose.model('Message', MessageSchema);
