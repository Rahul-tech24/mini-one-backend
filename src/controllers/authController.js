const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, sendTokenAsCookie } = require('../utils/token');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Enhanced validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    
    // Username validation
    const usernameTrimmed = username.trim();
    if (usernameTrimmed.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (usernameTrimmed.length > 50) {
      return res.status(400).json({ error: 'Username must be less than 50 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usernameTrimmed)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }
    
    // Email validation
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must be less than 128 characters' });
    }

    const existing = await User.findOne({ $or: [{ email: emailTrimmed }, { username: usernameTrimmed }] });
    if (existing) {
      return res.status(409).json({ error: 'User with that email or username already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ username: usernameTrimmed, email: emailTrimmed, passwordHash });
    await user.save();

    const token = signToken(user);
    sendTokenAsCookie(res, token);
    res.status(201).json({ id: user._id, username: user.username, email: user.email });
  } catch (err) { 
    if (err.code === 11000) {
      return res.status(409).json({ error: 'User with that email or username already exists' });
    }
    next(err); 
  }
};

exports.login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    // Enhanced validation
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }
    
    const emailOrUsernameTrimmed = emailOrUsername.trim();
    if (!emailOrUsernameTrimmed) {
      return res.status(400).json({ error: 'Email/username cannot be empty' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ 
      $or: [
        { email: emailOrUsernameTrimmed.toLowerCase() }, 
        { username: emailOrUsernameTrimmed }
      ] 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    sendTokenAsCookie(res, token);
    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err) { 
    next(err); 
  }
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