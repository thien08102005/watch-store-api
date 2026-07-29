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
      const { name, brand, price, category, size, imageUrl, rating, description, stock } = req.body;
      const numericPrice = Number(price);
      const numericStock = stock !== undefined ? Number(stock) : 0;
      if (!name || !brand || !category || !imageUrl || !Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericStock) || numericStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đủ tên, hãng, giá, loại, ảnh sản phẩm và tồn kho hợp lệ.'
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
        stock: numericStock,
        sold: 0,
        ...(rating !== undefined && { rating: Number(rating) }),
        createdBy: req.user.id
      });
      return res.status(201).json({ success: true, message: 'Đã thêm sản phẩm.', data: product });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, brand, price, category, size, imageUrl, rating, description, stock } = req.body;
      const numericPrice = price !== undefined ? Number(price) : undefined;
      const numericStock = stock !== undefined ? Number(stock) : undefined;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Thiếu mã sản phẩm.' });
      }

      if (name !== undefined && !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Tên sản phẩm không được để trống.' });
      }
      if (brand !== undefined && !String(brand).trim()) {
        return res.status(400).json({ success: false, message: 'Hãng sản phẩm không được để trống.' });
      }
      if (category !== undefined && !String(category).trim()) {
        return res.status(400).json({ success: false, message: 'Loại sản phẩm không được để trống.' });
      }
      if (imageUrl !== undefined && !String(imageUrl).trim()) {
        return res.status(400).json({ success: false, message: 'Đường dẫn hình ảnh không được để trống.' });
      }
      if (numericPrice !== undefined && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
        return res.status(400).json({ success: false, message: 'Giá sản phẩm phải là số lớn hơn 0.' });
      }
      if (numericStock !== undefined && (!Number.isFinite(numericStock) || numericStock < 0)) {
        return res.status(400).json({ success: false, message: 'Tồn kho phải là số không âm.' });
      }

      const Product = require('../models/product.model');
      const updatePayload = {};
      if (name !== undefined) updatePayload.name = String(name).trim();
      if (brand !== undefined) updatePayload.brand = String(brand).trim();
      if (price !== undefined) updatePayload.price = numericPrice;
      if (category !== undefined) updatePayload.category = String(category).trim();
      if (size !== undefined) updatePayload.size = String(size).trim();
      if (imageUrl !== undefined) updatePayload.imageUrl = String(imageUrl).trim();
      if (description !== undefined) updatePayload.description = String(description).trim();
      if (stock !== undefined) updatePayload.stock = numericStock;
      if (rating !== undefined) updatePayload.rating = Number(rating);

      const updatedProduct = await Product.findByIdAndUpdate(id, updatePayload, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật.' });
      }

      return res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công.', data: updatedProduct });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async sellProduct(req, res) {
    try {
      const { id } = req.params;
      const quantity = Number(req.body.quantity || 1);
      if (!id || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng bán phải là số nguyên dương.' });
      }

      const Product = require('../models/product.model');
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity, sold: quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({ success: false, message: 'Sản phẩm không tồn tại hoặc số lượng tồn không đủ.' });
      }

      return res.status(200).json({ success: true, message: 'Cập nhật số lượng đã bán thành công.', data: updatedProduct });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();
