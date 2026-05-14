const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
