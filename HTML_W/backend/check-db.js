const mongoose = require('mongoose');
(async () => {
  const uri = 'mongodb://localhost:27017/ChronosWatchDB';
  try {
    await mongoose.connect(uri);
    console.log('connected to', uri);
    const Product = require('./src/models/product.model');
    const count = await Product.countDocuments();
    console.log('products count:', count);
    const one = await Product.findOne().lean();
    console.log('one product sample:', one ? { _id: one._id, name: one.name, imageUrl: one.imageUrl } : null);
    await mongoose.disconnect();
  } catch (error) {
    console.error('error', error.message);
    process.exit(1);
  }
})();
