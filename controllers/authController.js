const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');

const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ token, user: userId, expiresAt });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username or email already taken' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await saveRefreshToken(user._id, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await saveRefreshToken(user._id, refreshToken);

    res.json({
      success: true,
      data: {
        user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const accessToken = generateAccessToken(user);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
