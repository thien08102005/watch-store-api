const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  rating: { type: Number, default: 5.0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);