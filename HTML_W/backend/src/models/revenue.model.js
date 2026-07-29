const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  amount: { type: Number, default: 0 }
}, { timestamps: true });

revenueSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Revenue', revenueSchema);
