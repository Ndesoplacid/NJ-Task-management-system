import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, please log in' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_sign_key_change_me_in_production');

    // Get user from database (exclude password field)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session expired or not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Middleware Error] ${error.message}`);
    return res.status(401).json({ success: false, message: 'Session invalid or token expired' });
  }
};
