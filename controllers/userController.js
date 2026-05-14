const User = require('../models/User');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('_id username avatar isOnline lastSeen');
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
