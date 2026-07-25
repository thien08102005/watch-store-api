const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

class AuthController {
  buildUserResponse(user) {
    return { id: user._id, name: user.name, email: user.email, role: user.role };
  }

  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = (email || '').toLowerCase().trim();

      if (!name || !normalizedEmail || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký.' });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email đã tồn tại.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email: normalizedEmail, password: hashedPassword });

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d'
      });

      res.status(201).json({ success: true, message: 'Đăng ký thành công.', token, user: this.buildUserResponse(user) });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = (email || '').toLowerCase().trim();

      if (!normalizedEmail || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu email hoặc mật khẩu.' });
      }

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Email chưa được đăng ký.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Mật khẩu không đúng.' });
      }

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d'
      });

      res.status(200).json({ success: true, message: 'Đăng nhập thành công.', token, user: this.buildUserResponse(user) });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
      return res.status(200).json({ success: true, user: this.buildUserResponse(user) });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, users: users.map((user) => this.buildUserResponse(user)) });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createStaff(req, res) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = (email || '').toLowerCase().trim();
      if (!name || !normalizedEmail || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ tên, email và mật khẩu.' });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email đã tồn tại.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email: normalizedEmail, password: hashedPassword, role: 'staff' });
      return res.status(201).json({ success: true, message: 'Đã tạo tài khoản nhân viên.', user: this.buildUserResponse(user) });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateRole(req, res) {
    try {
      const { role } = req.body;
      // Quản lý chỉ phân/cấp lại nhân viên và khách hàng. Vai trò quản lý
      // được khởi tạo bởi hệ thống, không thể tự cấp qua API này.
      const allowedRoles = ['staff', 'customer'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
      }

      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
      return res.status(200).json({ success: true, message: 'Đã cập nhật vai trò.', user: this.buildUserResponse(user) });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();
