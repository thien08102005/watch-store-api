const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, orderController.createOrder.bind(orderController));
router.put('/:id/approve', verifyToken, authorizeRoles('manager', 'staff'), orderController.approveOrder.bind(orderController));
router.get('/mine', verifyToken, orderController.getMyOrders.bind(orderController));
router.get('/', verifyToken, authorizeRoles('manager', 'staff'), orderController.getOrders.bind(orderController));
router.get('/revenue', verifyToken, authorizeRoles('manager', 'staff'), orderController.getRevenueReport.bind(orderController));
router.get('/revenue/monthly', verifyToken, authorizeRoles('manager', 'staff'), orderController.getMonthlyRevenue.bind(orderController));
router.get('/revenue/export', verifyToken, authorizeRoles('manager', 'staff'), orderController.exportRevenue.bind(orderController));

module.exports = router;
