require('dotenv').config(); // Lấy cấu hình từ file .env
const mongoose = require('mongoose');
const Product = require('./src/models/product.model'); // Trỏ chuẩn về file model của bạn

// Danh sách sản phẩm thực tế (5 Nam, 5 Nữ)
const sampleProducts = [
    // --- 5 ĐỒNG HỒ NAM ---
    {
        name: "Rolex Submariner Steel",
        brand: "Rolex",
        category: "Nam",
        price: 285000000,
        size: "41 mm",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Rolex_Submariner.jpg/320px-Rolex_Submariner.jpg",
        description: "Mã: 126610LN | Loại máy: Cơ tự động | Mặt kính: Kính Sapphire | Chống nước: 300m | Hàng hiếm"
    },
    {
        name: "Omega Seamaster Aqua Terra",
        brand: "Omega",
        category: "Nam",
        price: 52000000,
        size: "41 mm",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Omega_Seamaster_Professional.jpg/320px-Omega_Seamaster_Professional.jpg",
        description: "Mã: 231.10.42.21.03.001 | Loại máy: Automatic | Mặt kính: Kính Sapphire | Chống nước: 150m"
    },
    {
        name: "TAG Heuer Carrera Steel",
        brand: "TAG Heuer",
        category: "Nam",
        price: 38000000,
        size: "39 mm",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/TAG_Heuer_Carrera.jpg/320px-TAG_Heuer_Carrera.jpg",
        description: "Mã: CBN2010.BA0642 | Loại máy: Automatic | Chức năng: Chronograph | Chống nước: 100m"
    },
    {
        name: "Breitling Avenger Automatic",
        brand: "Breitling",
        category: "Nam",
        price: 42000000,
        size: "42 mm",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Breitling_Avenger.jpg/320px-Breitling_Avenger.jpg",
        description: "Mã: A32390 | Loại máy: Automatic Chronograph | Mặt kính: Sapphire | Chống nước: 300m"
    },
    {
        name: "IWC Pilot Chronograph",
        brand: "IWC",
        category: "Nam",
        price: 48000000,
        size: "43 mm",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/IWC_Pilot_Watch.jpg/320px-IWC_Pilot_Watch.jpg",
        description: "Mã: IW388101 | Loại máy: Automatic | Chức năng: Chronograph | Dây da cao cấp | Chống nước: 60m"
    },

    // --- 5 ĐỒNG HỒ NỮ ---
    {
        name: "Cartier Ballon Bleu 33mm",
        brand: "Cartier",
        category: "Nữ",
        price: 68000000,
        size: "33 mm",
        imageUrl: "https://images.chrono24.com/images/newsroom/cartier-ballon-bleu-de-cartier-stainless-steel-rose-gold-w69009z3.jpg",
        description: "Mã: W69009Z3 | Loại máy: Quartz | Thiết kế: Iconic Ballon | Mặt kính: Sapphire | Chống nước: 30m"
    },
    {
        name: "Longines DolceVita Steel",
        brand: "Longines",
        category: "Nữ",
        price: 22000000,
        size: "23.3 x 37 mm",
        imageUrl: "https://images.chrono24.com/images/newsroom/longines-dolcevita-steel-silver-dial-l5766.jpg",
        description: "Mã: L5766.4 | Loại máy: Quartz | Thiết kế: Vintage | Mặt kính: Sapphire | Chống nước: 30m"
    },
    {
        name: "Chopard Happy Diamonds",
        brand: "Chopard",
        category: "Nữ",
        price: 125000000,
        size: "30 mm",
        imageUrl: "https://images.chrono24.com/images/newsroom/chopard-happy-diamonds-gold-with-diamonds.jpg",
        description: "Mã: 274189 | Loại máy: Quartz | Thiết kế: Đá kim cương vàng | Mặt kính: Sapphire | Sang trọng"
    },
    {
        name: "Tissot PRX Steel",
        brand: "Tissot",
        category: "Nữ",
        price: 18500000,
        size: "35 mm",
        imageUrl: "https://images.chrono24.com/images/newsroom/tissot-prx-stainless-steel-silver-dial-t137.207.11.351.00.jpg",
        description: "Mã: T137.207.11.351.00 | Loại máy: Quartz | Thiết kế: Modern Sport | Chống nước: 100m | Bền bỉ"
    },
    {
        name: "Citizen Eco-Drive 30mm",
        brand: "Citizen",
        category: "Nữ",
        price: 12500000,
        size: "30 mm",
        imageUrl: "https://images.chrono24.com/images/newsroom/citizen-eco-drive-stainless-steel-silver-dial-em0814-52a.jpg",
        description: "Mã: EM0814-52A | Loại máy: Eco-Drive (Năng lượng mặt trời) | Mặt kính: Sapphire | Chống nước: 100m"
    }
];

const connectDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chronos_db';
        await mongoose.connect(uri);
        console.log('Kết nối MongoDB thành công để Seed dữ liệu!');
    } catch (err) {
        console.error('Lỗi kết nối MongoDB:', err);
        throw err;
    }
};

const seedDB = async () => {
    await connectDatabase();
    try {
        await Product.deleteMany({});
        console.log('Đã xóa dữ liệu cũ...');

        await Product.insertMany(sampleProducts);
        console.log('Đã thêm thành công 10 sản phẩm (5 nam, 5 nữ) vào Database!');
    } catch (err) {
        console.error('Lỗi khi seed dữ liệu:', err);
        throw err;
    } finally {
        await mongoose.connection.close();
        console.log('Đã đóng kết nối cơ sở dữ liệu.');
    }
};

const seedIfEmpty = async () => {
    await connectDatabase();
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            console.log('Dữ liệu rỗng, tiến hành seed dữ liệu mẫu...');
            await Product.insertMany(sampleProducts);
            console.log('Đã seed dữ liệu mẫu thành công.');
        } else {
            console.log(`Đã có ${count} sản phẩm, không cần seed thêm.`);
        }
    } catch (err) {
        console.error('Lỗi khi kiểm tra/seed dữ liệu:', err);
        throw err;
    } finally {
        // Không đóng kết nối ở đây khi chạy cùng server.
        if (process.env.SEED_ONLY === 'true') {
            await mongoose.connection.close();
        }
    }
};

if (require.main === module) {
    process.env.SEED_ONLY = 'true';
    seedDB().catch(err => process.exit(1));
}

module.exports = { seedDB, seedIfEmpty };