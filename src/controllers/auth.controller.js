const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

class AuthController {
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

      res.status(201).json({ success: true, message: 'Đăng ký thành công.', token, user: { id: user._id, name: user.name, email: user.email } });
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

      res.status(200).json({ success: true, message: 'Đăng nhập thành công.', token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();
