// Dữ liệu text cho từng danh mục
const categoryInfo = {
    'Nam': {
        title: 'Đồng hồ nam',
        desc: 'Một chiếc đồng hồ nam không chỉ là công cụ xem giờ, mà còn là tuyên ngôn phong cách của mỗi quý ông. Từ thiết kế tinh tế, chất liệu sang trọng đến độ hoàn thiện tỉ mỉ, mỗi chiếc đồng hồ đều phản ánh gu thẩm mỹ và đẳng cấp riêng.'
    },
    'Nữ': {
        title: 'Đồng hồ nữ',
        desc: 'Đồng hồ nữ tôn vinh vẻ đẹp thanh lịch và tinh tế của phái đẹp. Những cỗ máy thời gian được chế tác như những món trang sức sang trọng, đồng hành cùng bạn trong mọi khoảnh khắc rực rỡ nhất.'
    },
    'Bán chạy': {
        title: 'Sản phẩm bán chạy',
        desc: 'Top những mẫu đồng hồ được yêu thích và săn đón nhiều nhất tại Chronos trong tháng qua.'
    }
};

function setupSearch() {
    const searchIcon = document.getElementById('search-icon');
    const searchInput = document.getElementById('header-search-input');

    if (!searchIcon || !searchInput) return;

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('search')?.trim() || '';
    if (initialQuery) {
        searchInput.value = initialQuery;
    }

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

async function loadCategoryPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const searchQuery = urlParams.get('search')?.trim() || '';
    const brandParam = urlParams.get('brand');
    const brandDecoded = brandParam ? decodeURIComponent(brandParam).replace(/\+/g, ' ').trim() : '';

    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');

    if (searchQuery) {
        pageTitle.textContent = `Kết quả tìm kiếm: "${searchQuery}"`;
        pageDesc.textContent = 'Danh sách sản phẩm phù hợp với từ khóa bạn vừa nhập.';
    } else if (brandDecoded) {
        pageTitle.textContent = `Thương hiệu: ${brandDecoded}`;
        pageDesc.textContent = `Sản phẩm thuộc thương hiệu ${brandDecoded}.`;
    } else {
        const info = categoryInfo[category] || { title: `Đồng hồ ${category || 'đặc sắc'}`, desc: 'Khám phá bộ sưu tập cao cấp tại Chronos.' };
        pageTitle.textContent = info.title;
        pageDesc.textContent = info.desc;
    }

    try {
        let apiUrl = 'http://localhost:5000/api/products';
        if (searchQuery) {
            apiUrl += `?search=${encodeURIComponent(searchQuery)}`;
        } else if (brandDecoded) {
            apiUrl += `?brand=${encodeURIComponent(brandDecoded)}`;
        } else if (category) {
            apiUrl += `?category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(apiUrl);
        const responseData = await response.json();

        let products = [];
        if (Array.isArray(responseData)) {
            products = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
            products = responseData.data;
        } else if (responseData.products && Array.isArray(responseData.products)) {
            products = responseData.products;
        }

        if (searchQuery) {
            const keyword = searchQuery.toLowerCase();
            products = products.filter(product => {
                const searchableText = [
                    product.name,
                    product.brand,
                    product.category,
                    product.description,
                    product.size
                ].filter(Boolean).join(' ').toLowerCase();
                return searchableText.includes(keyword);
            });
        }

        renderProductsGrid(products);
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error);
    }
}

function renderProductsGrid(products) {
    const container = document.getElementById('product-list');

    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 50px;">Không tìm thấy sản phẩm phù hợp.</p>';
        return;
    }

    container.innerHTML = products.map(product => {
        let sku = '';
        let specs = '';
        if (product.description && product.description.includes('|')) {
            const parts = product.description.split('|');
            sku = parts[0].replace('Mã:', '').trim();
            specs = parts.slice(1).join('|').trim();
        } else {
            specs = product.description || 'Đang cập nhật';
        }

        const inWishlist = window.CHRONOS_AUTH?.isInWishlist(product._id);
        return `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${product._id}'">
                <span class="badge-new">NEW</span>
                <img src="${product.imageUrl}" alt="${product.name}">

                <div class="product-name">${product.name}</div>
                <div class="product-sku">${sku}</div>
                <div class="product-specs">${specs}</div>
                <div class="product-price">${(product.price || 0).toLocaleString('vi-VN')}đ</div>

                <div class="product-actions">
                    <button class="btn-add-cart" onclick="event.stopPropagation(); window.CHRONOS_AUTH?.handleProtectedAddToCart('${product._id}', '${product.name}')">
                        Thêm vào giỏ
                    </button>
                    <button class="btn-wishlist ${inWishlist ? 'active' : ''}" onclick="event.stopPropagation(); window.CHRONOS_AUTH?.handleToggleWishlist('${product._id}', '${product.name}', this)">
                        ${inWishlist ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryPage();
    setupSearch();
});