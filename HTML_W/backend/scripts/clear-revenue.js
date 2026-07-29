const connectDB = require('../src/config/db');
const Revenue = require('../src/models/revenue.model');

(async () => {
  try {
    await connectDB();
    const result = await Revenue.deleteMany({});
    console.log('Deleted revenue count:', result.deletedCount);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing revenue:', err);
    process.exit(1);
  }
})();
