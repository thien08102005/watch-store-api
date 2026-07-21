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
}

module.exports = new ProductController();