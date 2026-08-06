const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  image: { type: String }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true, unique: true },
  items: { type: [CartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

CartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', CartSchema);
