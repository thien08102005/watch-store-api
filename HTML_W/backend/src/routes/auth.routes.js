const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google', authController.googleLogin.bind(authController));
router.get('/me', verifyToken, authController.getProfile.bind(authController));
router.get('/users', verifyToken, authorizeRoles('manager'), authController.getUsers.bind(authController));
router.post('/users/staff', verifyToken, authorizeRoles('manager'), authController.createStaff.bind(authController));
router.patch('/users/:id/role', verifyToken, authorizeRoles('manager'), authController.updateRole.bind(authController));

module.exports = router;
