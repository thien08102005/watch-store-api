const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, cartController.getCart.bind(cartController));
router.post('/items', verifyToken, cartController.addItem.bind(cartController));
router.put('/items', verifyToken, cartController.updateItem.bind(cartController));
router.delete('/', verifyToken, cartController.clearCart.bind(cartController));
router.post('/merge', verifyToken, cartController.mergeCart.bind(cartController));

module.exports = router;
