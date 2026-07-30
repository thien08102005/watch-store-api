// URL của Backend Node.js
const API_URL = 'http://localhost:5000/api/products';

// Sự kiện chạy ngay khi trang chủ vừa load xong
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedProducts();
    setupSearch();
});

// Hàm gọi API và chỉ lấy 4 sản phẩm đại diện cho trang chủ
async function fetchFeaturedProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        let productsArray = [];
        if (Array.isArray(result)) {
            productsArray = result;
        } else if (result.success && Array.isArray(result.data)) {
            productsArray = result.data;
        } else if (result.products && Array.isArray(result.products)) {
            productsArray = result.products;
        }

        const featuredProducts = productsArray.slice(0, 4);

        let htmlContent = '';
        featuredProducts.forEach(product => {
            const rating = product.rating || 5;
            htmlContent += `
                <div class="product-card" data-product-id="${product._id}" style="cursor: pointer;">
                    <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
                    <img src="${product.imageUrl}" alt="${product.name}">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">${(product.price || 0).toLocaleString('vi-VN')} đ</p>
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" data-action="add-cart" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)} data-product-price="${product.price || 0}">Thêm giỏ</button>
                        <button class="btn-wishlist" data-action="toggle-wishlist" data-product-id="${product._id}" data-product-name=${JSON.stringify(product.name)}>Yêu thích</button>
                    </div>
                </div>
            `;
        });

        productList.innerHTML = htmlContent;

        productList.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.productId;
                if (id) {
                    window.location.href = `product-detail.html?id=${id}`;
                }
            });
        });

        productList.querySelectorAll('button[data-action="add-cart"]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const productId = button.dataset.productId;
                const productName = button.dataset.productName || 'sản phẩm';
                const productPrice = Number(button.dataset.productPrice) || 0;
                window.CHRONOS_AUTH?.handleProtectedAddToCart(productId, productName, 1, productPrice);
            });
        });

        productList.querySelectorAll('button[data-action="toggle-wishlist"]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const productId = button.dataset.productId;
                const productName = button.dataset.productName || 'sản phẩm';
                window.CHRONOS_AUTH?.handleToggleWishlist(productId, productName, button);
            });
        });
    } catch (error) {
        console.error('Lỗi khi gọi API trang chủ:', error);
        productList.innerHTML = '<p style="text-align:center; width: 100%;">Không thể tải sản phẩm lúc này.</p>';
    }
}

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