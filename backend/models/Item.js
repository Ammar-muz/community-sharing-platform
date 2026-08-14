const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  pricePerDay: { type: Number },
  location: { type: String },
  images: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  available: { type: Boolean, default: true },
  blockedDates: [{ type: Date }],
  createdAt: { type: Date, default: Date.now }
});

// UPDATE BLOCKED DATES
router.put('/:id/blocked-dates', auth, async (req, res) => {
  try {
    const { blockedDates } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { blockedDates },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = mongoose.model('Item', itemSchema);
