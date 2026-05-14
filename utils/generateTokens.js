const jwt = require('jsonwebtoken');

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES }
  );

module.exports = { generateAccessToken, generateRefreshToken };
