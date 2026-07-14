const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// SEND MESSAGE
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, itemId, message } = req.body;
    if (!receiverId || !message) {
      return res.status(400).json({ msg: 'receiverId and message are required' });
    }
    const newMessage = new Message({
      sender: req.user.id,
      receiver: receiverId,
      item: itemId || null,
      message
    });
    await newMessage.save();
    const populated = await Message.findById(newMessage._id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('item', 'title');
    res.json(populated);
  } catch (err) {
    console.log('Message send error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET MY CONVERSATIONS
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .populate('item', 'title images')
    .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.log('Conversations error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET UNREAD COUNT
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET MESSAGES WITH A SPECIFIC USER
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .populate('item', 'title images')
    .sort({ createdAt: 1 });
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, read: false },
      { read: true }
    );
    res.json(messages);
  } catch (err) {
    console.log('Get messages error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;