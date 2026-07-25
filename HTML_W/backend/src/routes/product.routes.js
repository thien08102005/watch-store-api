const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/', productController.getProducts);
router.post('/', verifyToken, authorizeRoles('manager', 'staff'), productController.createProduct.bind(productController));

module.exports = router;
