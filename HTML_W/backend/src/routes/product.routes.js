const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/', productController.getProducts);
router.post('/', verifyToken, authorizeRoles('manager', 'staff'), productController.createProduct.bind(productController));
router.put('/:id', verifyToken, authorizeRoles('manager', 'staff'), productController.updateProduct.bind(productController));
router.patch('/:id/sell', verifyToken, productController.sellProduct.bind(productController));

module.exports = router;
