const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');

const initSocket = (io) => {
  // Auth guard on every connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    // Mark user online
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    io.emit('user_online', { userId: socket.userId });

    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
    });

    socket.on('send_message', async ({ roomId, content }) => {
      try {
        if (!content || !roomId) {
          return socket.emit('error', { message: 'roomId and content are required' });
        }

        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const isMember = room.members.some((m) => m.toString() === socket.userId);
        if (!isMember) return socket.emit('error', { message: 'Not a member of this room' });

        const message = await Message.create({
          content,
          sender: socket.userId,
          room: roomId,
        });

        const populated = await message.populate('sender', '_id username avatar');
        io.to(roomId).emit('new_message', populated);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('typing_start', ({ roomId }) => {
      socket.to(roomId).emit('user_typing', { userId: socket.userId, username: socket.username });
    });

    socket.on('typing_stop', ({ roomId }) => {
      socket.to(roomId).emit('user_stopped_typing', { userId: socket.userId });
    });

    socket.on('mark_read', async ({ roomId, messageId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: { user: socket.userId, readAt: new Date() } },
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', async () => {
      const lastSeen = new Date();
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen });
      io.emit('user_offline', { userId: socket.userId, lastSeen });
    });
  });
};

module.exports = initSocket;