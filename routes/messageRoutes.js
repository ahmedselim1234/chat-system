const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth');
const { getMessages, deleteMessage } = require('../controllers/messageController');

router.use(protect);

router.get('/:roomId', getMessages);
router.delete('/:messageId', deleteMessage);

module.exports = router;
