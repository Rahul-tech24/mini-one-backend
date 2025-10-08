const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';
const COOKIE_NAME = process.env.COOKIE_NAME || 'mini_one_token';


function signToken(user) {
return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}


function sendTokenAsCookie(res, token) {
const cookieOptions = {
httpOnly: true,
secure: process.env.NODE_ENV === 'production',
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
maxAge: 7 * 24 * 60 * 60 * 1000
};
res.cookie(COOKIE_NAME, token, cookieOptions);
}


module.exports = { signToken, sendTokenAsCookie, COOKIE_NAME };