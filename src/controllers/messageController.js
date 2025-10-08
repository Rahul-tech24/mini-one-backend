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
        if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
        const m = new Message({ text: text.trim(), author: req.user._id });
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
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
        if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });
        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (!msg.author.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        msg.text = text.trim();
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
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (!msg.author.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        await msg.remove();
        res.json({ message: 'Message deleted' });
    } catch (err) {
        next(err);
    }
};
