const mongoose = require('mongoose');
(async () => {
  const uri = 'mongodb://localhost:27017/chronos_db';
  try {
    await mongoose.connect(uri);
    const Product = require('./src/models/product.model');
    const filter = { name: "Movado Classic Men's" };
    const update = { imageUrl: "Image/MovadoClassicMen's.webp" };
    const result = await Product.findOneAndUpdate(filter, update, { new: true, lean: true });
    if (!result) {
      console.error('Không tìm thấy sản phẩm với tên:', filter.name);
      process.exit(1);
    }
    console.log('Cập nhật thành công sản phẩm:');
    console.log({ _id: result._id, name: result.name, imageUrl: result.imageUrl });
    await mongoose.disconnect();
  } catch (error) {
    console.error('Lỗi cập nhật:', error.message);
    process.exit(1);
  }
})();
