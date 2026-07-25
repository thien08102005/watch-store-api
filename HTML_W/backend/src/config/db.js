const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ChronosWatchDB';
    await mongoose.connect(uri);
    console.log('Đã kết nối thành công với MongoDB!');
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;