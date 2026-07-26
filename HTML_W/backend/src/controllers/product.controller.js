const productService = require('../services/product.service');

class ProductController {
  async getProducts(req, res) {
    try {
      const { category, brand } = req.query;
      const products = await productService.getAllProducts(category, brand);
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createProduct(req, res) {
    try {
      const { name, brand, price, category, size, imageUrl, rating, description } = req.body;
      const numericPrice = Number(price);
      if (!name || !brand || !category || !imageUrl || !Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đủ tên, hãng, giá, loại và ảnh sản phẩm.'
        });
      }

      const Product = require('../models/product.model');
      const product = await Product.create({
        name: name.trim(),
        brand: brand.trim(),
        price: numericPrice,
        category: category.trim(),
        size: (size || '').trim(),
        imageUrl: imageUrl.trim(),
        description: (description || '').trim(),
        ...(rating !== undefined && { rating: Number(rating) }),
        createdBy: req.user.id
      });
      return res.status(201).json({ success: true, message: 'Đã thêm sản phẩm.', data: product });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();
