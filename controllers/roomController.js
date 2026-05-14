const Room = require('../models/Room');
const Message = require('../models/Message');

exports.getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isPrivate: false }).populate('createdBy', 'username');
    res.json({ success: true, data: { rooms } });
  } catch (err) {
    next(err);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const { name, description, isPrivate } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const room = await Room.create({
      name,
      description,
      isPrivate: isPrivate || false,
      createdBy: req.user.id,
      members: [req.user.id],
    });

    res.status(201).json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
};

exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('members', 'username avatar isOnline');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
};

exports.joinRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.user.id } },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
};

exports.leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: req.user.id } },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, data: { message: 'Left room successfully' } });
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Message.deleteMany({ room: room._id });
    await room.deleteOne();

    res.json({ success: true, data: { message: 'Room deleted' } });
  } catch (err) {
    next(err);
  }
};
