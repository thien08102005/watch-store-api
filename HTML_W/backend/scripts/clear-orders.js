const connectDB = require('../src/config/db');
const Order = require('../src/models/order.model');

(async () => {
  try {
    await connectDB();
    const result = await Order.deleteMany({});
    console.log('Deleted orders count:', result.deletedCount);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing orders:', err);
    process.exit(1);
  }
})();
