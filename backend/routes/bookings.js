const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// CREATE BOOKING
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    const totalPrice = days * item.pricePerDay;

    const booking = new Booking({
      item: itemId,
      renter: req.user.id,
      owner: item.owner,
      startDate,
      endDate,
      totalPrice
    });

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET MY BOOKINGS (as renter)
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user.id })
      .populate('item', 'title pricePerDay images category')
      .populate('owner', 'name email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET BOOKINGS FOR MY ITEMS (as owner)
router.get('/owner', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate('item', 'title pricePerDay images category')
      .populate('renter', 'name email phone');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATE BOOKING STATUS (accept or reject)
router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(booking);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE booking
router.delete('/:id', auth, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
module.exports = router;