const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth');
const { getUsers, getUserById, updateProfile } = require('../controllers/userController');

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/profile', updateProfile);

module.exports = router;
