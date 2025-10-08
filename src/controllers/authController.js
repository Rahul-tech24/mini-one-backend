const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, sendTokenAsCookie } = require('../utils/token');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'password must be 6+ chars' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'User with that email or username already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ username, email, passwordHash });
    await user.save();

    const token = signToken(user);
    sendTokenAsCookie(res, token);
    res.status(201).json({ id: user._id, username: user.username, email: user.email });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) return res.status(400).json({ error: 'emailOrUsername and password required' });

    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(400).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    sendTokenAsCookie(res, token);
    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME || 'mini_one_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies[process.env.COOKIE_NAME || 'mini_one_token']) token = req.cookies[process.env.COOKIE_NAME || 'mini_one_token'];
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(200).json({ user: null });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_me');
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(200).json({ user: null });
    res.json({ user });
  } catch (err) {
    console.error('me error', err);
    res.status(200).json({ user: null });
  }
};