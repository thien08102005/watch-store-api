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
    const API_BASE_URL = 'http://localhost:5000/api';

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

        let product = allProducts.find(p => p._id === productId);

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
        const currentUser = window.CHRONOS_AUTH?.getCurrentUser?.() || null;
        const isStaff = currentUser?.role === 'staff';
        const isManager = currentUser?.role === 'manager';
        const isAdmin = isManager || isStaff;

        const container = document.getElementById('product-detail-content');
        container.innerHTML = `
            <div class="product-image-box">
                <img id="detail-image" src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=500'">
            </div>
            <div class="product-info-box">
                <h1 id="detail-title">${product.name}</h1>
                <div class="rating-stars">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i> 5 đánh giá
                </div>

                <div class="spec-item"><strong>Mã SP:</strong> <span id="detail-sku">${sku}</span></div>
                <div class="spec-item"><strong>Thương hiệu:</strong> <span id="detail-brand">${brand}</span></div>
                <div class="spec-item"><strong>Size:</strong> <span id="detail-size">${size}</span></div>
                <div class="spec-item"><strong>Tình trạng:</strong> Mới 100% chính hãng</div>
                <div class="spec-item"><strong>Giới tính:</strong> <span id="detail-category">${product.category || 'Unisex'}</span></div>
                <div class="spec-item"><strong>Số lượng tồn:</strong> <span id="detail-stock">${product.stock != null ? product.stock : 'Đang cập nhật'}</span></div>
                <div class="spec-item"><strong>Đã bán:</strong> <span id="detail-sold">${product.sold != null ? product.sold : 0}</span></div>
                <div class="spec-item"><strong>Chi tiết:</strong> <span id="detail-specs">${specs}</span></div>

                <div class="price-box">
                    <span class="current-price" id="detail-price">${product.price.toLocaleString('vi-VN')} đ</span>
                    <span class="old-price" id="detail-old-price">${oldPrice.toLocaleString('vi-VN')} đ</span>
                    <span class="sale-tag">SALE: 20%</span>
                </div>

                <div class="action-buttons">
                    ${isManager ? `
                        <button class="admin-edit-btn" type="button" id="admin-edit-toggle">Sửa sản phẩm</button>
                        <button class="btn-delete-product" data-action="delete-product" data-product-id="${product._id}">Xóa sản phẩm</button>
                    ` : isStaff ? `
                        <button class="admin-edit-btn" type="button" id="admin-edit-toggle">Sửa sản phẩm</button>
                    ` : `
                        <button class="btn-buy-now" data-action="buy-now" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)} data-product-price="${product.price || 0}">Mua Ngay</button>
                        <button class="btn-add-cart-detail" data-action="add-cart" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)} ${product.stock === 0 ? 'disabled' : ''}>Thêm Vào Giỏ</button>
                        <button class="btn-wishlist-detail ${isInWishlist ? 'active' : ''}" data-action="toggle-wishlist" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)}>
                            ${isInWishlist ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                        </button>
                    `}
                </div>

                ${isAdmin ? `
                <form class="admin-edit-form" id="admin-edit-form" style="display:none;">
                    <input name="name" value="${(product.name || '').replace(/"/g, '&quot;')}" required>
                    <select name="brand" required>
                        <option value="">Chọn thương hiệu</option>
                        <option value="Movado" ${product.brand === 'Movado' ? 'selected' : ''}>Movado</option>
                        <option value="Omega" ${product.brand === 'Omega' ? 'selected' : ''}>Omega</option>
                        <option value="Tissot" ${product.brand === 'Tissot' ? 'selected' : ''}>Tissot</option>
                        <option value="Casio" ${product.brand === 'Casio' ? 'selected' : ''}>Casio</option>
                        <option value="Longines" ${product.brand === 'Longines' ? 'selected' : ''}>Longines</option>
                        <option value="Citizen" ${product.brand === 'Citizen' ? 'selected' : ''}>Citizen</option>
                        <option value="Seiko" ${product.brand === 'Seiko' ? 'selected' : ''}>Seiko</option>
                        <option value="Rolex" ${product.brand === 'Rolex' ? 'selected' : ''}>Rolex</option>
                    </select>
                    <input name="price" type="number" min="1" value="${product.price || ''}" required>
                    <input name="stock" type="number" min="0" value="${product.stock ?? 0}" required>
                    <select name="category" required>
                        <option value="Nam" ${product.category === 'Nam' ? 'selected' : ''}>Đồng hồ Nam</option>
                        <option value="Nữ" ${product.category === 'Nữ' ? 'selected' : ''}>Đồng hồ Nữ</option>
                    </select>
                    <input name="size" value="${(product.size || '').replace(/"/g, '&quot;')}">
                    <input name="imageUrl" value="${(product.imageUrl || '').replace(/"/g, '&quot;')}" required>
                    <textarea name="description" rows="3">${(product.description || '').replace(/"/g, '&quot;')}</textarea>
                    <input name="rating" type="number" min="0" max="5" step="0.1" value="${product.rating ?? 5}">
                    <button type="submit">Lưu thay đổi</button>
                </form>` : ''}

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
                } else if (action === 'delete-product') {
                    const user = window.CHRONOS_AUTH?.getCurrentUser?.();
                    if (!user || !user.token) {
                        alert('Bạn cần đăng nhập với quyền quản lý để xóa sản phẩm.');
                        return;
                    }
                    if (!confirm('Bạn có chắc muốn xóa sản phẩm này? Hành động không thể hoàn tác.')) return;
                    (async () => {
                        try {
                            const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${user.token}` }
                            });
                            const result = await res.json();
                            if (!res.ok) throw new Error(result.message || 'Không thể xóa sản phẩm.');
                            alert('Xóa sản phẩm thành công.');
                            window.location.href = 'products.html';
                        } catch (err) {
                            alert(err.message || 'Lỗi khi xóa sản phẩm.');
                        }
                    })();
                }
            });
        });

        const editToggle = document.getElementById('admin-edit-toggle');
        const editForm = document.getElementById('admin-edit-form');
        if (editToggle && editForm) {
            editToggle.addEventListener('click', () => {
                editForm.style.display = editForm.style.display === 'none' ? 'grid' : 'none';
            });

            editForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const user = window.CHRONOS_AUTH?.getCurrentUser?.();
                if (!user?.token) {
                    alert('Bạn cần đăng nhập lại để chỉnh sửa.');
                    return;
                }

                const payload = Object.fromEntries(new FormData(editForm).entries());
                payload.price = Number(payload.price);
                payload.stock = Number(payload.stock);
                payload.rating = Number(payload.rating || 5);

                try {
                    const response = await fetch(`http://localhost:5000/api/products/${product._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${user.token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật sản phẩm.');
                    alert('Cập nhật sản phẩm thành công.');
                    const updatedSpecs = data.data.description || specs;
                    document.getElementById('detail-title').textContent = data.data.name || product.name;
                    document.getElementById('detail-brand').textContent = data.data.brand || '';
                    document.getElementById('detail-size').textContent = data.data.size || '';
                    document.getElementById('detail-category').textContent = data.data.category || 'Unisex';
                    document.getElementById('detail-stock').textContent = data.data.stock != null ? data.data.stock : 'Đang cập nhật';
                    document.getElementById('detail-price').textContent = Number(data.data.price || 0).toLocaleString('vi-VN') + ' đ';
                    document.getElementById('detail-old-price').textContent = Math.round((data.data.price || 0) * 1.25).toLocaleString('vi-VN') + ' đ';
                    document.getElementById('detail-specs').textContent = updatedSpecs;
                    const detailImage = document.getElementById('detail-image');
                    if (detailImage && data.data.imageUrl) detailImage.src = data.data.imageUrl;
                    product = {
                        ...product,
                        ...data.data,
                        description: updatedSpecs
                    };
                    specs = updatedSpecs;
                    editForm.style.display = 'none';
                } catch (error) {
                    alert(error.message);
                }
            });
        }

    } catch (error) {
        console.error('Lỗi tải chi tiết sản phẩm:', error);
        document.getElementById('product-detail-content').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Đã xảy ra lỗi khi kết nối đến máy chủ.</p>';
    }
});