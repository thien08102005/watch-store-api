const Order = require('../models/order.model');
const Product = require('../models/product.model');

class OrderController {
  async createOrder(req, res) {
    try {
      const { items, totalPrice, shippingAddress } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm.' });
      }
      if (!shippingAddress || !shippingAddress.recipient || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.district || !shippingAddress.ward || !shippingAddress.detail || !shippingAddress.payment) {
        return res.status(400).json({ success: false, message: 'Thông tin giao hàng không đầy đủ.' });
      }

      const user = req.user;
      const orderDate = new Date().toLocaleString('vi-VN');
      const timestamp = Date.now();

      const order = await Order.create({
        userId: user.id,
        userEmail: user.email,
        userName: req.body.userName || user.email,
        items,
        totalPrice: Number(totalPrice) || 0,
        shippingAddress,
        status: 'Đã đặt hàng',
        timestamp,
        orderDate
      });

      return res.status(201).json({ success: true, message: 'Đặt hàng thành công.', data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const orders = await Order.find().sort({ timestamp: -1 }).lean();
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRevenueReport(req, res) {
    try {
      const { year } = req.query;
      const filter = {};
      if (year) {
        const start = new Date(`${year}-01-01T00:00:00.000Z`).getTime();
        const end = new Date(`${year}-12-31T23:59:59.999Z`).getTime();
        filter.timestamp = { $gte: start, $lte: end };
      }

      const orders = await Order.find(filter).lean();
      const revenueByMonth = Array(12).fill(0);
      const yearsSet = new Set();

      orders.forEach(order => {
        const timestamp = Number(order.timestamp) || Date.parse(order.orderDate || '');
        const date = Number.isFinite(timestamp) ? new Date(timestamp) : new Date(order.createdAt);
        if (date && !Number.isNaN(date.getTime())) {
          const month = date.getMonth();
          const orderYear = date.getFullYear();
          yearsSet.add(orderYear);
          revenueByMonth[month] += Number(order.totalPrice) || 0;
        }
      });

      return res.status(200).json({ success: true, data: {
        years: Array.from(yearsSet).sort((a, b) => b - a),
        year: Number(year) || null,
        revenueByMonth
      }});
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();
