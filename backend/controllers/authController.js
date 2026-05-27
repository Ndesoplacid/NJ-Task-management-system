import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendResetEmail } from '../services/emailService.js';

// Helper to sign JWT and set Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'super_secret_jwt_sign_key_change_me_in_production',
    { expiresIn: '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check email uniqueness
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    sendTokenResponse(user, 217, res); // 201 Created but styled
  } catch (error) {
    console.error(`[Auth Registration Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
};

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(`[Auth Login Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
};

/**
 * @desc    Log out and clear session cookie
 * @route   POST /api/auth/logout
 * @access  Private (but accessible generally)
 */
export const logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // expire in 10 seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(`[Auth Logout Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error during logout' });
  }
};

/**
 * @desc    Get details of currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving user profile' });
  }
};

/**
 * @desc    Generate password reset token & email recovery link
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For developer testing, return direct clear feedback
      return res.status(404).json({ success: false, message: 'No registered user matches that email address' });
    }

    // Generate random 20 byte hexadecimal token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token to store in database securely
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to user model (valid for 10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Construct link pointing to React SPA
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    console.log(`[Auth Recovery] Dispatched reset link: ${resetUrl}`);

    const emailResult = await sendResetEmail({
      to: user.email,
      username: user.username,
      resetUrl,
    });

    if (emailResult.success) {
      res.status(200).json({ success: true, message: 'Password recovery email dispatched successfully' });
    } else {
      // Revert token database entries if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500).json({ success: false, message: 'Failed to send recovery email. Please try again later.' });
    }
  } catch (error) {
    console.error(`[Auth Forgot Password Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error during recovery request' });
  }
};

/**
 * @desc    Reset password using valid unexpired token
 * @route   PUT /api/auth/resetpassword/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Please provide a password of at least 6 characters' });
    }

    // Hash token sent in URL parameter to match DB storage
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password recovery token is invalid or has expired' });
    }

    // Encrypt new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset credentials
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Log the user in automatically after resetting their password!
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(`[Auth Reset Password Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Internal server error during password reset' });
  }
};

export default { register, login, logout, getMe, forgotPassword, resetPassword };
