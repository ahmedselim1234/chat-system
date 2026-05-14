const Message = require('../models/Message');
const Room = require('../models/Room');

exports.getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const isMember = room.members.some((m) => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this room' });
    }

    const total = await Message.countDocuments({ room: roomId });
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', '_id username avatar');

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        messages,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const roomId = message.room.toString();
    await message.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('message_deleted', { messageId: req.params.messageId, roomId });
    }

    res.json({ success: true, data: { message: 'Message deleted' } });
  } catch (err) {
    next(err);
  }
};
