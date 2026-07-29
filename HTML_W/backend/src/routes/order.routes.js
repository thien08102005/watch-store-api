const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, orderController.createOrder.bind(orderController));
router.get('/', verifyToken, authorizeRoles('manager', 'staff'), orderController.getOrders.bind(orderController));
router.get('/revenue', verifyToken, authorizeRoles('manager', 'staff'), orderController.getRevenueReport.bind(orderController));

module.exports = router;
