const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE_NAME } = require('../utils/token');


const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';


module.exports = async function authMiddleware(req, res, next) {
try {
let token = null;
if (req.cookies && req.cookies[COOKIE_NAME]) token = req.cookies[COOKIE_NAME];
if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
token = req.headers.authorization.split(' ')[1];
}
if (!token) return res.status(401).json({ error: 'Unauthorized' });


const decoded = jwt.verify(token, JWT_SECRET);
const user = await User.findById(decoded.id).select('-passwordHash');
if (!user) return res.status(401).json({ error: 'Unauthorized' });
req.user = user;
next();
} catch (err) {
console.error('Auth middleware error', err);
return res.status(401).json({ error: 'Unauthorized' });
}
};
