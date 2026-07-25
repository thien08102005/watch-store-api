require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/user.model');

const [emailArg, roleArg] = process.argv.slice(2);
const allowedRoles = ['manager', 'staff', 'customer'];
const email = (emailArg || '').trim().toLowerCase();
const role = (roleArg || '').trim().toLowerCase();

async function setUserRole() {
  if (!email || !allowedRoles.includes(role)) {
    console.error('Cách dùng: node scripts/set-user-role.js <email> <manager|staff|customer>');
    process.exitCode = 1;
    return;
  }

  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ChronosWatchDB';
    await mongoose.connect(uri);

    const user = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.error(`Không tìm thấy tài khoản: ${email}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Đã đặt vai trò ${role} cho ${user.email}.`);
  } catch (error) {
    console.error(`Không thể cập nhật vai trò: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

setUserRole();
