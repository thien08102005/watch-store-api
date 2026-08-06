const Cart = require('../models/cart.model');

class CartController {
  async getCart(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });
      const cart = await Cart.findOne({ userId: user.id }).lean() || { items: [] };
      return res.status(200).json({ success: true, data: cart.items });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async addItem(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });
      const { productId, name, price, quantity = 1, image } = req.body;
      if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

      const cart = await Cart.findOneAndUpdate(
        { userId: user.id },
        { $setOnInsert: { userId: user.id }, $set: { updatedAt: Date.now() } },
        { upsert: true, new: true }
      );

      const idx = (cart.items || []).findIndex(i => i.productId === productId);
      if (idx >= 0) {
        cart.items[idx].quantity = (Number(cart.items[idx].quantity) || 0) + Number(quantity || 1);
      } else {
        cart.items.push({ productId, name, price: Number(price) || 0, quantity: Number(quantity) || 1, image });
      }

      await cart.save();
      return res.status(200).json({ success: true, data: cart.items });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateItem(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });
      const { productId, quantity } = req.body;
      if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

      const cart = await Cart.findOne({ userId: user.id });
      if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng trống.' });

      const idx = (cart.items || []).findIndex(i => i.productId === productId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ.' });

      if (Number(quantity) <= 0) {
        cart.items.splice(idx, 1);
      } else {
        cart.items[idx].quantity = Number(quantity);
      }
      cart.updatedAt = Date.now();
      await cart.save();
      return res.status(200).json({ success: true, data: cart.items });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async clearCart(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });
      await Cart.findOneAndUpdate({ userId: user.id }, { $set: { items: [], updatedAt: Date.now() } }, { upsert: true });
      return res.status(200).json({ success: true, message: 'Đã xóa giỏ hàng.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Merge client-side items into server cart (used after login)
  async mergeCart(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });
      const { items } = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'items array required' });

      const cart = await Cart.findOneAndUpdate(
        { userId: user.id },
        { $setOnInsert: { userId: user.id }, $set: { updatedAt: Date.now() } },
        { upsert: true, new: true }
      );

      const map = {};
      (cart.items || []).forEach(i => { map[i.productId] = (map[i.productId] || 0) + (i.quantity || 0); });
      items.forEach(i => { map[i.productId] = (map[i.productId] || 0) + (Number(i.quantity) || 0); });

      cart.items = Object.keys(map).map(pid => ({ productId: pid, quantity: map[pid] }));
      await cart.save();
      return res.status(200).json({ success: true, data: cart.items });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CartController();
