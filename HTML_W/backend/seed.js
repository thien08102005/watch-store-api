require('dotenv').config(); // Lấy cấu hình từ file .env
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./src/models/product.model'); // Trỏ chuẩn về file model của bạn
const User = require('./src/models/user.model');

const demoUsers = [
    { name: 'Admin', email: 'admin@chronos.local', role: 'manager' },
    { name: 'Nhân viên', email: 'nhanvien@chronos.local', role: 'staff' },
    { name: 'Khách hàng', email: 'khachhang@chronos.local', role: 'customer' }
];

const seedDemoUsers = async () => {
    const password = await bcrypt.hash('123', 10);
    for (const demoUser of demoUsers) {
        await User.updateOne(
            { email: demoUser.email },
            { $set: { ...demoUser, password } },
            { upsert: true }
        );
    }
    console.log('Đã kiểm tra/tạo 3 tài khoản mẫu phân quyền.');
};

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
    },
    {
        name: "Bering Classic Men's",
        brand: "Bering",
        category: "Nam",
        price: 13967679,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Bering",
        description: "Mã: BRG-001 | Đồng hồ nam phong cách classic | Chống nước: 50m"
    },
    {
        name: "Omega Classic Men's",
        brand: "Omega",
        category: "Nam",
        price: 21417059,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Omega",
        description: "Mã: OME-002 | Đồng hồ classic sang trọng | Chống nước: 50m"
    },
    {
        name: "Tissot Classic Men's",
        brand: "Tissot",
        category: "Nam",
        price: 18117980,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Tissot",
        description: "Mã: TIS-003 | Đồng hồ classic thời thượng | Chống nước: 50m"
    },
    {
        name: "Citizen Classic Men's",
        brand: "Citizen",
        category: "Nam",
        price: 21916704,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Citizen",
        description: "Mã: CIT-004 | Đồng hồ nam phong cách hiện đại | Chống nước: 50m"
    },
    {
        name: "Longines Classic Men's",
        brand: "Longines",
        category: "Nam",
        price: 14366138,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Longines",
        description: "Mã: LON-005 | Đồng hồ nam tinh tế | Chống nước: 50m"
    },
    {
        name: "Enicar Classic Men's",
        brand: "Enicar",
        category: "Nam",
        price: 24139273,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Enicar",
        description: "Mã: ENI-006 | Đồng hồ nam cổ điển | Chống nước: 50m"
    },
    {
        name: "Gucci Classic Men's",
        brand: "Gucci",
        category: "Nam",
        price: 14504366,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Gucci",
        description: "Mã: GUC-007 | Đồng hồ nam sang trọng | Chống nước: 50m"
    },
    {
        name: "Mido Classic Men's",
        brand: "Mido",
        category: "Nam",
        price: 21002854,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Mido",
        description: "Mã: MID-008 | Đồng hồ nam tinh xảo | Chống nước: 50m"
    },
    {
        name: "Alfex Classic Men's",
        brand: "Alfex",
        category: "Nam",
        price: 18985586,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Alfex",
        description: "Mã: ALF-009 | Đồng hồ nam phong cách hiện đại | Chống nước: 50m"
    },
    {
        name: "Grovana Classic Men's",
        brand: "Grovana",
        category: "Nam",
        price: 4932821,
        size: "40 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Grovana",
        description: "Mã: GRO-010 | Đồng hồ nam thanh lịch | Chống nước: 50m"
    },
    {
        name: "Rado Classic Women's",
        brand: "Rado",
        category: "Nữ",
        price: 6089735,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Rado",
        description: "Mã: RAD-011 | Đồng hồ nữ thanh lịch | Chống nước: 30m"
    },
    {
        name: "Tommy Hilfiger Classic Women's",
        brand: "Tommy Hilfiger",
        category: "Nữ",
        price: 5005265,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Tommy%20Hilfiger",
        description: "Mã: TOM-012 | Đồng hồ nữ thời trang | Chống nước: 30m"
    },
    {
        name: "Lacoste Classic Women's",
        brand: "Lacoste",
        category: "Nữ",
        price: 4766718,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Lacoste",
        description: "Mã: LAC-013 | Đồng hồ nữ tinh tế | Chống nước: 30m"
    },
    {
        name: "Bulova Classic Women's",
        brand: "Bulova",
        category: "Nữ",
        price: 2467150,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Bulova",
        description: "Mã: BUL-014 | Đồng hồ nữ thanh lịch | Chống nước: 30m"
    },
    {
        name: "Caravelle Classic Women's",
        brand: "Caravelle",
        category: "Nữ",
        price: 17788574,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Caravelle",
        description: "Mã: CAR-015 | Đồng hồ nữ cao cấp | Chống nước: 30m"
    },
    {
        name: "Calvin Klein Classic Women's",
        brand: "Calvin Klein",
        category: "Nữ",
        price: 9841435,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Calvin%20Klein",
        description: "Mã: CK-016 | Đồng hồ nữ hiện đại | Chống nước: 30m"
    },
    {
        name: "Seiko Classic Women's",
        brand: "Seiko",
        category: "Nữ",
        price: 6102775,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Seiko",
        description: "Mã: SEI-017 | Đồng hồ nữ bền bỉ | Chống nước: 30m"
    },
    {
        name: "Casio Classic Women's",
        brand: "Casio",
        category: "Nữ",
        price: 4258751,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Casio",
        description: "Mã: CAS-018 | Đồng hồ nữ tiện dụng | Chống nước: 30m"
    },
    {
        name: "Scuderia Ferrari Classic Women's",
        brand: "Scuderia Ferrari",
        category: "Nữ",
        price: 16093536,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Scuderia%20Ferrari",
        description: "Mã: FER-019 | Đồng hồ nữ thể thao | Chống nước: 30m"
    },
    {
        name: "Raymond Weil Classic Women's",
        brand: "Raymond Weil",
        category: "Nữ",
        price: 6706415,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Raymond%20Weil",
        description: "Mã: RW-020 | Đồng hồ nữ sang trọng | Chống nước: 30m"
    },
    {
        name: "Coach Classic Women's",
        brand: "Coach",
        category: "Nữ",
        price: 11680644,
        size: "30 mm",
        imageUrl: "https://via.placeholder.com/500x500.png?text=Coach",
        description: "Mã: COA-021 | Đồng hồ nữ thời trang | Chống nước: 30m"
    }
];

const connectDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ChronosWatchDB';
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
        await seedDemoUsers();
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
        await seedDemoUsers();
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
