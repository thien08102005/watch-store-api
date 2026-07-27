const Product = require('../models/product.model');

class ProductService {
  async getAllProducts(queryCategory, queryBrand) {
    const query = {};
    const isBestSeller = queryCategory && queryCategory.toString().toLowerCase().replace(/\s+/g, '') === 'bánchạy';

    if (!isBestSeller && queryCategory) {
      query.category = queryCategory;
    }
    if (queryBrand) {
      query.brand = { $regex: new RegExp(`^${queryBrand}$`, 'i') };
    }
    if (isBestSeller) {
      query.sold = { $gt: 0 };
    }

    const products = await Product.find(query);
    if (isBestSeller) {
      return products.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }
    return products;
  }
}

module.exports = new ProductService();