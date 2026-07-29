const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  detail: { type: String, required: true },
  payment: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  userName: { type: String, required: true, trim: true },
  items: { type: [orderItemSchema], default: [] },
  totalPrice: { type: Number, required: true },
  shippingAddress: { type: shippingAddressSchema, required: true },
  status: { type: String, default: 'Đã đặt hàng' },
  timestamp: { type: Number, required: true },
  orderDate: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
