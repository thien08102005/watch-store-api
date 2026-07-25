const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) return res.status(401).json({ success: false, message: 'Chưa cung cấp Token!' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Token không hợp lệ!' });
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập chức năng này.'
    });
  }
  next();
};

module.exports = { verifyToken, authorizeRoles };
