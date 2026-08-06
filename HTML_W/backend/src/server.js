const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const connectDB = require('./config/db');
const seedData = require('../seed');
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const cartRoutes = require('./routes/cart.routes');
const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());

// 3. Tích hợp Swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 4. Khai báo Route
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// 5. Chạy Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedData.seedIfEmpty();

  app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}`);
    console.log(`Tài liệu API: http://localhost:${PORT}/api-docs`);
  });
};

startServer();