const Message = require('../models/Message');
const mongoose = require('mongoose');
exports.getMessages = async (req, res, next) => {
    try {
        const msgs = await Message.find().sort({ createdAt: -1 }).limit(100).populate('author', 'username');
        res.json(msgs);
    } catch (err) {
        next(err);
    }
};
exports.createMessage = async (req, res, next) => {
    try {
        const { text } = req.body;
        
        // Enhanced validation
        if (!text) {
            return res.status(400).json({ error: 'Message text is required' });
        }
        
        const textTrimmed = text.trim();
        if (!textTrimmed) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        if (textTrimmed.length > 1000) {
            return res.status(400).json({ error: 'Message must be less than 1000 characters' });
        }
        
        if (textTrimmed.length < 1) {
            return res.status(400).json({ error: 'Message must be at least 1 character' });
        }
        
        const m = new Message({ text: textTrimmed, author: req.user._id });
        await m.save();
        await m.populate('author', 'username');
        res.status(201).json(m);
    } catch (err) {
        next(err);
    }
};
exports.updateMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        
        // Enhanced validation
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid message ID' });
        }
        
        if (!text) {
            return res.status(400).json({ error: 'Message text is required' });
        }
        
        const textTrimmed = text.trim();
        if (!textTrimmed) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        if (textTrimmed.length > 1000) {
            return res.status(400).json({ error: 'Message must be less than 1000 characters' });
        }
        
        if (textTrimmed.length < 1) {
            return res.status(400).json({ error: 'Message must be at least 1 character' });
        }
        
        const msg = await Message.findById(id);
        if (!msg) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        if (!msg.author.equals(req.user._id)) {
            return res.status(403).json({ error: 'You can only edit your own messages' });
        }
        
        msg.text = textTrimmed;
        await msg.save();
        await msg.populate('author', 'username');
        res.json(msg);
    } catch (err) {
        next(err);
    }
};
exports.deleteMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Enhanced validation
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid message ID' });
        }
        
        const msg = await Message.findById(id);
        if (!msg) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        if (!msg.author.equals(req.user._id)) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }
        
        await Message.findByIdAndDelete(id);
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        next(err);
    }
};
