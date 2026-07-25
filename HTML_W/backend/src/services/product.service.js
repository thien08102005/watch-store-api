const Product = require('../models/product.model');

class ProductService {
  async getAllProducts(queryCategory, queryBrand) {
    const query = {};
    if (queryCategory) query.category = queryCategory;
    if (queryBrand) query.brand = { $regex: new RegExp(`^${queryBrand}$`, 'i') };
    return await Product.find(query);
  }
}

module.exports = new ProductService();