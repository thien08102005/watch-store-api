const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Revenue = require('../models/revenue.model');
const Cart = require('../models/cart.model');
const ExcelJS = require('exceljs');

class OrderController {
  async createOrder(req, res) {
    try {
      let { items, totalPrice, shippingAddress } = req.body || {};
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Không có quyền.' });

      // If client didn't send items, try to use server-side cart
      if (!Array.isArray(items) || items.length === 0) {
        const cart = await Cart.findOne({ userId: user.id }).lean();
        items = (cart && Array.isArray(cart.items)) ? cart.items : [];
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm.' });
      }

      if (!shippingAddress || !shippingAddress.recipient || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.district || !shippingAddress.ward || !shippingAddress.detail || !shippingAddress.payment) {
        return res.status(400).json({ success: false, message: 'Thông tin giao hàng không đầy đủ.' });
      }

      const orderDate = new Date().toLocaleString('vi-VN');
      const timestamp = Date.now();

      // If totalPrice not provided, compute from items
      if (!totalPrice) {
        totalPrice = Array.isArray(items) ? items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0) : 0;
      }

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

      // clear server-side cart after creating order to keep single source of truth
      try {
        await Cart.findOneAndUpdate({ userId: user.id }, { $set: { items: [], updatedAt: Date.now() } }, { upsert: true });
      } catch (e) {
        console.warn('Failed to clear user cart after order:', e && e.message ? e.message : e);
      }

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

  async exportRevenue(req, res) {
    try {
      const { year } = req.query;
      const filter = {};
      if (year) {
        const start = new Date(`${year}-01-01T00:00:00.000Z`).getTime();
        const end = new Date(`${year}-12-31T23:59:59.999Z`).getTime();
        filter.timestamp = { $gte: start, $lte: end };
      }

      // export only approved orders by default
      filter.status = 'Đã duyệt';

      const orders = await Order.find(filter).sort({ timestamp: -1 }).lean();

      const workbook = new ExcelJS.Workbook();

      // Build 'Doanh Thu' summary sheet similar to provided screenshot
      const selectedYear = year ? Number(year) : (new Date().getFullYear());
      let totalRevenue = 0;
      let totalOrders = 0;
      const monthlyRevenue = Array(12).fill(0);
      const monthlyOrders = Array(12).fill(0);
      orders.forEach(o => {
        const ts = Number(o.timestamp) || Date.parse(o.orderDate || '') || 0;
        const d = isFinite(ts) && ts ? new Date(ts) : (o.approvedAt ? new Date(Number(o.approvedAt)) : null);
        const amt = Number(o.totalPrice) || (Array.isArray(o.items) ? o.items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 0)), 0) : 0);
        if (d && d.getFullYear() === selectedYear) {
          const m = d.getMonth();
          monthlyRevenue[m] += amt;
          monthlyOrders[m] += 1;
          totalRevenue += amt;
          totalOrders += 1;
        }
      });

      const summarySheet = workbook.addWorksheet('Doanh Thu');
      summarySheet.columns = [
        { key: 'a', width: 18 },
        { key: 'b', width: 30 },
        { key: 'c', width: 14 },
        { key: 'd', width: 14 },
        { key: 'e', width: 14 },
        { key: 'f', width: 14 },
        { key: 'g', width: 14 },
        { key: 'h', width: 14 },
        { key: 'i', width: 14 },
        { key: 'j', width: 14 }
      ];

      summarySheet.mergeCells('A1', 'J1');
      const title = summarySheet.getCell('A1');
      title.value = `BÁO CÁO DOANH THU NĂM ${selectedYear}`;
      title.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      title.alignment = { horizontal: 'center', vertical: 'middle' };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4B4B' } };
      summarySheet.getRow(1).height = 28;

      summarySheet.getCell('A3').value = 'Năm';
      summarySheet.getCell('B3').value = selectedYear;
      summarySheet.getCell('A4').value = 'Tổng doanh thu năm';
      summarySheet.getCell('B4').value = totalRevenue;
      summarySheet.getCell('B4').numFmt = '#,##0 "VNĐ"';
      summarySheet.getCell('A5').value = 'Số đơn năm';
      summarySheet.getCell('B5').value = totalOrders;
      ['A3','A4','A5'].forEach(c => {
        const cell = summarySheet.getCell(c);
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle' };
      });

      const monthTableStart = 7;
      summarySheet.getCell(`A${monthTableStart}`).value = 'Tháng';
      summarySheet.getCell(`B${monthTableStart}`).value = 'Tổng doanh thu';
      summarySheet.getCell(`C${monthTableStart}`).value = 'Số đơn';
      summarySheet.getRow(monthTableStart).font = { bold: true };
      summarySheet.getRow(monthTableStart).alignment = { vertical: 'middle', horizontal: 'center' };

      const monthRows = [];
      for (let i = 0; i < 12; i++) {
        if ((monthlyOrders[i] || 0) > 0) {
          monthRows.push({ month: i + 1, revenue: monthlyRevenue[i] || 0, orders: monthlyOrders[i] || 0 });
        }
      }
      if (monthRows.length === 0) {
        const r = monthTableStart + 1;
        summarySheet.getCell(r, 1).value = 'Không có đơn trong năm này';
      } else {
        monthRows.forEach((m, idx) => {
          const r = monthTableStart + 1 + idx;
          summarySheet.getCell(r, 1).value = `Tháng ${m.month}`;
          summarySheet.getCell(r, 2).value = m.revenue;
          summarySheet.getCell(r, 2).numFmt = '#,##0 "VNĐ"';
          summarySheet.getCell(r, 3).value = m.orders;
          summarySheet.getRow(r).alignment = { vertical: 'middle', horizontal: 'left' };
        });
      }

      const ordersHeaderRow = monthTableStart + monthRows.length + 3;
      const headers = ['Mã đơn','Ngày đặt','Trạng thái','Người mua','Email','Số điện thoại','Địa chỉ','Tổng tiền','Số sản phẩm','Thanh toán'];
      headers.forEach((h, idx) => {
        const cell = summarySheet.getCell(ordersHeaderRow, idx + 1);
        cell.value = h;
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1DE' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      let r = ordersHeaderRow + 1;
      orders.forEach(o => {
        const orderDateVal = o.timestamp ? new Date(Number(o.timestamp)) : (o.orderDate ? new Date(o.orderDate) : null);
        const total = Number(o.totalPrice) || (Array.isArray(o.items) ? o.items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 0)), 0) : 0);
        const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
        summarySheet.getCell(r,1).value = String(o._id || o.id || '');
        summarySheet.getCell(r,2).value = orderDateVal || (o.orderDate || '');
        summarySheet.getCell(r,3).value = o.status || '';
        summarySheet.getCell(r,4).value = o.userName || '';
        summarySheet.getCell(r,5).value = o.userEmail || '';
        summarySheet.getCell(r,6).value = (o.shippingAddress && (o.shippingAddress.phone || '')) || '';
        summarySheet.getCell(r,7).value = (o.shippingAddress && (o.shippingAddress.detail || '')) || '';
        summarySheet.getCell(r,8).value = total;
        summarySheet.getCell(r,8).numFmt = '#,##0 "VNĐ"';
        summarySheet.getCell(r,9).value = itemsCount;
        summarySheet.getCell(r,10).value = (o.shippingAddress && o.shippingAddress.payment) || '';
        if (orderDateVal) {
          summarySheet.getCell(r,2).numFmt = 'dd/mm/yyyy hh:mm';
        }
        summarySheet.getRow(r).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        r += 1;
      });
      summarySheet.getCell('B3').numFmt = 'General';
      summarySheet.getCell('B4').numFmt = '#,##0 "VNĐ"';
      summarySheet.getCell('B5').numFmt = 'General';
      summarySheet.getColumn(1).width = 35;
      summarySheet.getColumn(2).width = 20;
      summarySheet.getColumn(7).width = 45;
      summarySheet.getColumn(8).width = 18;
      summarySheet.getColumn(9).width = 14;
      summarySheet.getColumn(10).width = 15;
      summarySheet.views = [{ state: 'frozen', ySplit: ordersHeaderRow }];

      // create the standard Revenue sheet as well
      const sheet = workbook.addWorksheet('Revenue');

      sheet.columns = [
        { header: 'Order ID', key: 'id', width: 30 },
        { header: 'Order Date', key: 'orderDate', width: 20 },
        { header: 'Approved At', key: 'approvedAt', width: 20 },
        { header: 'User Email', key: 'userEmail', width: 30 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Total Price', key: 'totalPrice', width: 15 },
        { header: 'Items Count', key: 'itemsCount', width: 12 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      orders.forEach(o => {
        sheet.addRow({
          id: String(o._id || o.id || ''),
          orderDate: o.orderDate || (o.timestamp ? new Date(Number(o.timestamp)).toLocaleString('vi-VN') : ''),
          approvedAt: o.approvedAt ? new Date(Number(o.approvedAt)).toLocaleString('vi-VN') : '',
          userEmail: o.userEmail || '',
          userName: o.userName || '',
          totalPrice: Number(o.totalPrice) || 0,
          itemsCount: Array.isArray(o.items) ? o.items.length : 0,
          status: o.status || ''
        });
      });

      // format header row
      sheet.getRow(1).font = { bold: true };

      // detailed items sheet
      const itemsSheet = workbook.addWorksheet('Order Items');
      itemsSheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 30 },
        { header: 'Product ID', key: 'productId', width: 30 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Subtotal', key: 'subtotal', width: 15 }
      ];

      orders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const pid = it.productId || it.id || '';
            const name = it.name || it.productName || '';
            const price = Number(it.price) || 0;
            const qty = Number(it.quantity) || 0;
            itemsSheet.addRow({ orderId: String(o._id || o.id || ''), productId: pid, name, price, quantity: qty, subtotal: price * qty });
          });
        }
      });
      // style items sheet
      itemsSheet.getRow(1).font = { bold: true };
      itemsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      itemsSheet.columns.forEach(col => { col.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }; });
      itemsSheet.getColumn('price').numFmt = '#,##0 "VNĐ"';
      itemsSheet.getColumn('subtotal').numFmt = '#,##0 "VNĐ"';
      itemsSheet.getColumn('quantity').numFmt = '0';
      itemsSheet.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
      itemsSheet.views = [{ state: 'frozen', ySplit: 1 }];
      itemsSheet.autoFilter = { from: 'A1', to: 'F1' };

      // product summary sheet: aggregate quantity and revenue per product
      const prodSheet = workbook.addWorksheet('Product Summary');
      prodSheet.columns = [
        { header: 'Product ID', key: 'productId', width: 30 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Total Quantity', key: 'totalQty', width: 15 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 18 },
        { header: 'Orders Count', key: 'ordersCount', width: 14 }
      ];

      const prodMap = {};
      orders.forEach(o => {
        const seenInOrder = new Set();
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const pid = it.productId || it.id || '';
            if (!pid) return;
            const name = it.name || it.productName || '';
            const price = Number(it.price) || 0;
            const qty = Number(it.quantity) || 0;
            if (!prodMap[pid]) prodMap[pid] = { name, totalQty: 0, totalRevenue: 0, ordersCount: 0 };
            prodMap[pid].totalQty += qty;
            prodMap[pid].totalRevenue += price * qty;
            if (!seenInOrder.has(pid)) {
              prodMap[pid].ordersCount += 1;
              seenInOrder.add(pid);
            }
          });
        }
      });

      // sort products by totalRevenue desc
      const prodRows = Object.keys(prodMap).map(pid => ({ productId: pid, name: prodMap[pid].name, totalQty: prodMap[pid].totalQty, totalRevenue: prodMap[pid].totalRevenue, ordersCount: prodMap[pid].ordersCount }));
      prodRows.sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0));
      prodRows.forEach(r => prodSheet.addRow(r));
      prodSheet.getRow(1).font = { bold: true };
      prodSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      prodSheet.columns.forEach(col => { col.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }; });
      prodSheet.getColumn('totalRevenue').numFmt = '#,##0 "VNĐ"';
      prodSheet.getColumn('totalQty').numFmt = '0';
      prodSheet.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
      prodSheet.views = [{ state: 'frozen', ySplit: 1 }];
      prodSheet.autoFilter = { from: 'A1', to: 'E1' };

      // add totals row if there are data rows
      const startRow = 2;
      const endRow = prodSheet.rowCount;
      if (endRow >= startRow) {
        const totalRow = prodSheet.addRow(['Tổng', '', null, null, null]);
        totalRow.getCell(3).value = { formula: `SUM(C${startRow}:C${endRow})` };
        totalRow.getCell(4).value = { formula: `SUM(D${startRow}:D${endRow})` };
        totalRow.getCell(5).value = { formula: `SUM(E${startRow}:E${endRow})` };
        totalRow.font = { bold: true };
        totalRow.getCell(4).numFmt = '#,##0 "VNĐ"';
      }

      const fileName = `revenue${year ? '_' + year : ''}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();
