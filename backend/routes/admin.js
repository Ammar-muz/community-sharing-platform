const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

// GET all users
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET all items
router.get('/items', auth, requireAdmin, async (req, res) => {
  try {
    const items = await Item.find().populate('owner', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET all bookings
router.get('/bookings', auth, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('item', 'title pricePerDay category images')
      .populate('renter', 'name email')
      .populate('owner', 'name email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE item
router.delete('/items/:id', auth, requireAdmin, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE user
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;