const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Revenue = require('../models/revenue.model');

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
        status: 'Chờ duyệt',
        timestamp,
        orderDate
      });

      return res.status(201).json({ success: true, message: 'Đặt hàng thành công.', data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async approveOrder(req, res) {
    try {
      const orderId = req.params.id;
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });
      if (order.status && order.status !== 'Chờ duyệt') return res.status(400).json({ success: false, message: 'Đơn hàng đã được xử lý.' });

      // Kiểm tra tồn kho và cập nhật sản phẩm
      for (const item of order.items) {
        const prod = await Product.findById(item.productId);
        if (!prod) return res.status(400).json({ success: false, message: `Sản phẩm không tồn tại: ${item.name}` });
        if ((prod.stock || 0) < (item.quantity || 0)) {
          return res.status(400).json({ success: false, message: `Tồn kho không đủ cho sản phẩm: ${item.name}` });
        }
      }

      // tất cả ok -> cập nhật tồn kho
      for (const item of order.items) {
        const prod = await Product.findById(item.productId);
        prod.stock = (prod.stock || 0) - (item.quantity || 0);
        prod.sold = (prod.sold || 0) + (item.quantity || 0);
        await prod.save();
      }

      order.status = 'Đã duyệt';
      order.approverName = user.name || user.email || 'Nhân viên';
      order.approvedAt = Date.now();
      await order.save();

      // Update monthly revenue aggregation
      try {
        const approvedTime = order.approvedAt || Date.now();
        const d = new Date(Number(approvedTime));
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-12
        const amount = Number(order.totalPrice) || (Array.isArray(order.items) ? order.items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0) : 0);
        if (amount > 0) {
          await Revenue.findOneAndUpdate(
            { year, month },
            { $inc: { amount } },
            { upsert: true }
          );
        }
      } catch (e) {
        // ignore revenue update failure but log
        console.error('Failed to update revenue aggregation:', e.message || e);
      }

      return res.status(200).json({ success: true, message: 'Duyệt đơn thành công.', data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyOrders(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });
      const orders = await Order.find({ userId: user.id }).sort({ timestamp: -1 }).lean();
      return res.status(200).json({ success: true, data: orders });
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

  async getMonthlyRevenue(req, res) {
    try {
      const { year } = req.query;
      const filter = {};
      if (year) filter.year = Number(year);

      const docs = await Revenue.find(filter).sort({ year: -1, month: 1 }).lean();
      const yearsSet = new Set(docs.map(d => d.year));
      const selectedYear = year ? Number(year) : (docs.length ? docs[0].year : new Date().getFullYear());
      const revenueByMonth = Array(12).fill(0);
      docs.forEach(d => {
        if (d.year === selectedYear) revenueByMonth[(d.month || 1) - 1] = Number(d.amount || 0);
      });

      return res.status(200).json({ success: true, data: {
        years: Array.from(yearsSet).sort((a, b) => b - a),
        year: selectedYear,
        revenueByMonth
      }});
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();
