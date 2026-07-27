function setupSearch() {
    const searchIcon = document.getElementById('search-icon');
    const searchInput = document.getElementById('header-search-input');

    if (!searchIcon || !searchInput) return;

    searchIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchIcon.contains(e.target) && !searchInput.contains(e.target)) {
            searchInput.classList.remove('active');
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = searchInput.value.trim();
            if (keyword) {
                window.location.href = `products.html?search=${encodeURIComponent(keyword)}`;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupSearch();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.getElementById('product-detail-content').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Không tìm thấy mã sản phẩm!</p>';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/products');
        let data = await response.json();

        let allProducts = [];
        if (Array.isArray(data)) {
            allProducts = data;
        } else if (data.products && Array.isArray(data.products)) {
            allProducts = data.products;
        } else if (data.data && Array.isArray(data.data)) {
            allProducts = data.data;
        }

        const product = allProducts.find(p => p._id === productId);

        if (!product) {
            document.getElementById('product-detail-content').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Sản phẩm không tồn tại hoặc đã bị xóa!</p>';
            return;
        }

        let sku = "CR-" + product._id.slice(-6).toUpperCase();
        let specs = product.description || "Đang cập nhật thông số chi tiết";

        // Lấy thương hiệu và size (nếu sản phẩm thiếu sẽ tự động tách từ tên hoặc dùng giá trị mặc định)
       // Lấy thương hiệu chuẩn xác
        let brand = product.brand;
        if (!brand) {
            const words = product.name.split(' ');
            // Nếu tên sản phẩm bắt đầu bằng "ĐỒNG HỒ NAM" hoặc "ĐỒNG HỒ NỮ", lấy từ thứ 4 làm thương hiệu
            if (words.length >= 4 && words[0].toUpperCase() === 'ĐỒNG') {
                brand = words[3]; // Lấy chữ "LONGINES"
            } else {
                brand = words[0];
            }
        }
        let size = product.size || "40 mm";
        if (product.description && product.description.includes('|')) {
            const parts = product.description.split('|');
            sku = parts[0].replace('Mã:', '').trim();
            specs = parts.slice(1).join('|').trim();
        }

        const oldPrice = Math.round(product.price * 1.25);
        const isInWishlist = window.CHRONOS_AUTH?.isInWishlist(product._id) || false;

        const container = document.getElementById('product-detail-content');
        container.innerHTML = `
            <div class="product-image-box">
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=500'">
            </div>
            <div class="product-info-box">
                <h1>${product.name}</h1>
                <div class="rating-stars">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i> 5 đánh giá
                </div>

                <div class="spec-item"><strong>Mã SP:</strong> ${sku}</div>
                <div class="spec-item"><strong>Thương hiệu:</strong> ${brand}</div>
                <div class="spec-item"><strong>Size:</strong> ${size}</div>
                <div class="spec-item"><strong>Tình trạng:</strong> Mới 100% chính hãng</div>
                <div class="spec-item"><strong>Giới tính:</strong> ${product.category || 'Unisex'}</div>
                <div class="spec-item"><strong>Số lượng tồn:</strong> ${product.stock != null ? product.stock : 'Đang cập nhật'}</div>
                <div class="spec-item"><strong>Đã bán:</strong> ${product.sold != null ? product.sold : 0}</div>
                <div class="spec-item"><strong>Chi tiết:</strong> ${specs}</div>

                <div class="price-box">
                    <span class="current-price">${product.price.toLocaleString('vi-VN')} đ</span>
                    <span class="old-price">${oldPrice.toLocaleString('vi-VN')} đ</span>
                    <span class="sale-tag">SALE: 20%</span>
                </div>

                <div class="action-buttons">
                    <button class="btn-buy-now" data-action="buy-now" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)} data-product-price="${product.price || 0}">Mua Ngay</button>
                    <button class="btn-add-cart-detail" data-action="add-cart" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)} ${product.stock === 0 ? 'disabled' : ''}>Thêm Vào Giỏ</button>
                    <button class="btn-wishlist-detail ${isInWishlist ? 'active' : ''}" data-action="toggle-wishlist" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)}>
                        ${isInWishlist ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                    </button>
                </div>

                <div class="hotline-box">
                    Gọi đặt mua: <strong>0888211322 - 0946325286</strong> (Hỗ trợ 24/7)
                </div>
            </div>
        `;

        const actionButtons = container.querySelectorAll('[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const action = button.dataset.action;
                const productId = button.dataset.productId;
                const productName = button.dataset.productName || 'sản phẩm';
                const productPrice = parseFloat(button.dataset.productPrice) || 0;

                if (action === 'buy-now') {
                    const buyProductId = button.dataset.productId || productId;
                    window.CHRONOS_AUTH?.showCheckoutModal(productName, productPrice, buyProductId, 1);
                } else if (action === 'add-cart') {
                    window.CHRONOS_AUTH?.handleProtectedAddToCart(productId, productName);
                } else if (action === 'toggle-wishlist') {
                    window.CHRONOS_AUTH?.handleToggleWishlist(productId, productName, button);
                }
            });
        });

    } catch (error) {
        console.error('Lỗi tải chi tiết sản phẩm:', error);
        document.getElementById('product-detail-content').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Đã xảy ra lỗi khi kết nối đến máy chủ.</p>';
    }
});