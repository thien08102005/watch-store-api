const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // Tài khoản tự đăng ký luôn là khách hàng. Vai trò nội bộ chỉ do quản lý cấp.
  role: {
    type: String,
    enum: ['manager', 'staff', 'customer'],
    default: 'customer'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
