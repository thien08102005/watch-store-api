require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/product.model');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch-store')
  .then(async () => {
    console.log('\n📊 KIỂM TRA STOCK & SOLD:\n');
    const products = await Product.find().limit(10);
    products.forEach(p => {
      const status = p.stock === 0 ? '❌ STOCK = 0 (DISABLE)' : '✅ CÓ STOCK';
      console.log(`${p.name}\n  → Stock: ${p.stock}, Sold: ${p.sold} ${status}\n`);
    });
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  });
