const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth');
const {
  getRooms,
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
  deleteRoom,
} = require('../controllers/roomController');

router.use(protect);

router.get('/', getRooms);
router.post('/', createRoom);
router.get('/:id', getRoomById);
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);
router.delete('/:id', deleteRoom);

module.exports = router;
