const AUTH_STORAGE_KEY = 'chronos_user';
const CART_STORAGE_KEY = 'chronos_cart';
const WISHLIST_STORAGE_KEY = 'chronos_wishlist';
const API_BASE_URL = 'http://localhost:5000/api';
let currentAuthMode = 'login';

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('Không đọc được thông tin đăng nhập:', error);
        return null;
    }
}

function getCartItems() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveCartItems(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function getWishlistItems() {
    try {
        return JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveWishlistItems(items) {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

function getCartCount() {
    return getCartItems().reduce((total, item) => total + (item.quantity || 0), 0);
}

function getWishlistCount() {
    return getWishlistItems().length;
}

function addToCart(productId, productName) {
    const cart = getCartItems();
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
    } else {
        cart.push({ id: productId, name: productName, quantity: 1 });
    }
    saveCartItems(cart);
    updateHeaderCounts();
}

function toggleWishlist(productId, productName) {
    const wishlist = getWishlistItems();
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    if (existingIndex >= 0) {
        wishlist.splice(existingIndex, 1);
        saveWishlistItems(wishlist);
        updateHeaderCounts();
        return { added: false, name: productName };
    }
    wishlist.push({ id: productId, name: productName });
    saveWishlistItems(wishlist);
    updateHeaderCounts();
    return { added: true, name: productName };
}

function isInWishlist(productId) {
    return getWishlistItems().some(item => item.id === productId);
}

function updateHeaderCounts() {
    const cartCountEl = document.getElementById('cart-count');
    const wishlistCountEl = document.getElementById('wishlist-count');
    const user = getCurrentUser();
    const cartCount = user ? getCartCount() : 0;
    const wishlistCount = user ? getWishlistCount() : 0;

    if (cartCountEl) {
        cartCountEl.textContent = cartCount;
        cartCountEl.style.display = cartCount > 0 ? 'inline-flex' : 'none';
    }
    if (wishlistCountEl) {
        wishlistCountEl.textContent = wishlistCount;
        wishlistCountEl.style.display = wishlistCount > 0 ? 'inline-flex' : 'none';
    }
}

function saveCurrentUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function resetAuthForm() {
    const nameInput = document.getElementById('auth-name');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const confirmPasswordInput = document.getElementById('auth-confirm-password');
    const messageEl = document.getElementById('auth-message');

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.style.color = '#2c7a2c';
    }
}

async function loginUser(email, password) {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            return { ok: false, message: data.message || 'Đăng nhập thất bại.' };
        }

        saveCurrentUser({ name: data.user.name, email: data.user.email, role: data.user.role, token: data.token });
        return { ok: true, message: 'Đăng nhập thành công!' };
    } catch (error) {
        return { ok: false, message: 'Không thể kết nối tới server.' };
    }
}

async function registerUser(name, email, password) {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email: normalizedEmail, password })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            return { ok: false, message: data.message || 'Đăng ký thất bại.' };
        }

        saveCurrentUser({ name: data.user.name, email: data.user.email, role: data.user.role, token: data.token });
        return { ok: true, message: 'Đăng ký tài khoản thành công!' };
    } catch (error) {
        return { ok: false, message: 'Không thể kết nối tới server.' };
    }
}

function injectAuthStyles() {
    if (document.getElementById('auth-style')) return;

    const style = document.createElement('style');
    style.id = 'auth-style';
    style.textContent = `
        .auth-modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
        }
        .auth-modal.active {
            display: flex;
        }
        .auth-modal-box {
            background: #fff;
            width: 100%;
            max-width: 420px;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            position: relative;
        }
        .auth-modal-box h3 {
            margin-bottom: 8px;
            color: #111;
        }
        .auth-modal-box p {
            margin-bottom: 16px;
            color: #666;
            font-size: 14px;
        }
        .auth-close-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            border: none;
            background: transparent;
            font-size: 20px;
            cursor: pointer;
            color: #666;
        }
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .auth-form input {
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        .auth-form button {
            padding: 10px 14px;
            border: none;
            border-radius: 8px;
            background: #d4af37;
            color: #000;
            font-weight: 600;
            cursor: pointer;
        }
        .auth-form button:hover {
            background: #b9951f;
        }
        .auth-toggle {
            margin-top: 10px;
            text-align: center;
        }
        .icon-button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        .icon-button:hover {
            background: rgba(255,255,255,0.1);
        }
        .icon-count {
            position: absolute;
            top: -6px;
            right: -6px;
            min-width: 18px;
            height: 18px;
            background: #d4af37;
            color: #000;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            padding: 0 4px;
        }
        .auth-toggle button {
            background: transparent;
            border: none;
            color: #3b5998;
            cursor: pointer;
            font-size: 13px;
        }
        .auth-message {
            font-size: 13px;
            color: #2c7a2c;
            min-height: 18px;
        }
        .auth-logout {
            display: inline-block;
            margin-top: 8px;
            color: #c0392b;
            cursor: pointer;
            font-size: 13px;
        }
        .user-role-badge {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.2;
            color: #111;
            background: #d4af37;
        }
        .role-panel-box { max-width: 620px; max-height: 85vh; overflow-y: auto; }
        .role-panel-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 18px 0; }
        .role-panel-actions button, .role-form button { padding: 10px 14px; border: 0; border-radius: 8px; cursor: pointer; background: #d4af37; color: #111; font-weight: 700; }
        .role-panel-actions .secondary { background: #ececec; }
        .role-form { display: grid; gap: 10px; }
        .role-form input, .role-form select { padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; }
        .role-panel-message { min-height: 20px; margin-top: 10px; font-size: 14px; }
        .staff-list { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        .staff-list th, .staff-list td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
        .checkout-box { max-width: 560px; }
        .address-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .address-grid .full-width { grid-column: 1 / -1; }
        .address-grid label { display: grid; gap: 6px; font-size: 13px; color: #444; }
        .address-grid input, .address-grid select { padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font: inherit; }
        .checkout-submit { width: 100%; margin-top: 16px; padding: 11px; border: 0; border-radius: 8px; background: #d4af37; color: #111; font-weight: 700; cursor: pointer; }
    `;
    document.head.appendChild(style);
}

function createAuthModal() {
    if (document.getElementById('auth-modal')) {
        return document.getElementById('auth-modal');
    }

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-box">
            <button class="auth-close-btn" type="button" aria-label="Đóng">×</button>
            <h3 id="auth-title">Đăng nhập để tiếp tục</h3>
            <p data-auth-message>Đăng nhập để mua hàng hoặc thêm sản phẩm vào giỏ.</p>
            <form class="auth-form" id="auth-form">
                <input type="text" id="auth-name" placeholder="Họ tên" style="display:none;">
                <input type="email" id="auth-email" placeholder="Email" required>
                <input type="password" id="auth-password" placeholder="Mật khẩu" required>
                <input type="password" id="auth-confirm-password" placeholder="Nhập lại mật khẩu" required style="display:none;">
                <button type="submit" id="auth-submit-btn">Đăng nhập</button>
            </form>
            <div class="auth-toggle">
                <button type="button" id="auth-toggle-btn">Chưa có tài khoản? Đăng ký</button>
            </div>
            <div class="auth-message" id="auth-message"></div>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

function setAuthMode(mode) {
    currentAuthMode = mode;
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const nameInput = document.getElementById('auth-name');
    const confirmPasswordInput = document.getElementById('auth-confirm-password');

    if (mode === 'register') {
        if (title) title.textContent = 'Đăng ký tài khoản';
        if (submitBtn) submitBtn.textContent = 'Đăng ký';
        if (toggleBtn) toggleBtn.textContent = 'Đã có tài khoản? Đăng nhập';
        if (nameInput) nameInput.style.display = 'block';
        if (confirmPasswordInput) {
            confirmPasswordInput.style.display = 'block';
            confirmPasswordInput.required = true;
        }
        if (nameInput) nameInput.required = true;
    } else {
        if (title) title.textContent = 'Đăng nhập để tiếp tục';
        if (submitBtn) submitBtn.textContent = 'Đăng nhập';
        if (toggleBtn) toggleBtn.textContent = 'Chưa có tài khoản? Đăng ký';
        if (nameInput) nameInput.style.display = 'none';
        if (confirmPasswordInput) {
            confirmPasswordInput.style.display = 'none';
            confirmPasswordInput.required = false;
        }
        if (nameInput) nameInput.required = false;
    }
}

function showAuthModal(message = 'Đăng nhập để mua hàng hoặc thêm sản phẩm vào giỏ.', mode = 'login') {
    const modal = createAuthModal();
    const messageEl = modal.querySelector('[data-auth-message]');
    if (messageEl) {
        messageEl.textContent = message;
    }
    resetAuthForm();
    setAuthMode(mode);
    modal.classList.add('active');
    const emailInput = document.getElementById('auth-email');
    if (emailInput) {
        setTimeout(() => emailInput.focus(), 50);
    }
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function getRoleLabel(role) {
    return { manager: 'Quản lý', staff: 'Nhân viên', customer: 'Khách hàng' }[role] || 'Khách hàng';
}

function closeRolePanel() {
    document.getElementById('role-panel-modal')?.remove();
}

function logoutUser() {
    clearCurrentUser();
    resetAuthForm();
    setAuthMode('login');
    closeRolePanel();
    updateAuthUI();
    alert('Đã đăng xuất');
}

const SHIPPING_ADDRESS_KEY = 'chronos_shipping_address';
const addressData = {
    'Hà Nội': {
        'Ba Đình': ['Phúc Xá', 'Trúc Bạch', 'Ngọc Hà'],
        'Cầu Giấy': ['Dịch Vọng', 'Nghĩa Đô', 'Yên Hòa'],
        'Hoàng Mai': ['Hoàng Liệt', 'Định Công', 'Mai Động']
    },
    'TP. Hồ Chí Minh': {
        'Quận 1': ['Bến Nghé', 'Bến Thành', 'Cầu Ông Lãnh'],
        'Quận 3': ['Phường 1', 'Phường 6', 'Phường 7'],
        'TP. Thủ Đức': ['An Phú', 'Linh Trung', 'Thảo Điền']
    },
    'Đà Nẵng': {
        'Hải Châu': ['Bình Hiên', 'Hòa Cường Bắc', 'Hòa Thuận Đông'],
        'Sơn Trà': ['An Hải Bắc', 'Mân Thái', 'Phước Mỹ']
    },
    'Cần Thơ': {
        'Ninh Kiều': ['An Khánh', 'An Nghiệp', 'Cái Khế'],
        'Bình Thủy': ['An Thới', 'Bình Thủy', 'Trà An']
    }
};

function fillSelect(select, values, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>${values.map((value) => `<option value="${value}">${value}</option>`).join('')}`;
}

function showCheckoutModal(productName = 'sản phẩm') {
    if (!requireLogin('mua ngay')) return;
    document.getElementById('checkout-modal')?.remove();
    const savedAddress = JSON.parse(localStorage.getItem(SHIPPING_ADDRESS_KEY) || 'null') || {};
    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'auth-modal active';
    modal.innerHTML = `<div class="auth-modal-box checkout-box">
        <button class="auth-close-btn" type="button" aria-label="Đóng">×</button>
        <h3>Địa chỉ giao hàng</h3>
        <p>Sản phẩm: <strong>${productName}</strong></p>
        <form id="shipping-address-form">
            <div class="address-grid">
                <label>Họ tên người nhận<input name="recipient" required value="${savedAddress.recipient || ''}" placeholder="Nhập họ tên"></label>
                <label>Số điện thoại<input name="phone" required pattern="[0-9]{9,11}" value="${savedAddress.phone || ''}" placeholder="Ví dụ: 0901234567"></label>
                <label>Tỉnh/Thành phố<select name="city" id="shipping-city" required></select></label>
                <label>Quận/Huyện<select name="district" id="shipping-district" required disabled></select></label>
                <label class="full-width">Phường/Xã<select name="ward" id="shipping-ward" required disabled></select></label>
                <label class="full-width">Địa chỉ cụ thể<input name="detail" required value="${savedAddress.detail || ''}" placeholder="Số nhà, tên đường"></label>
            </div>
            <button class="checkout-submit" type="submit">Xác nhận đặt hàng</button>
            <div class="role-panel-message" id="shipping-message"></div>
        </form>
    </div>`;
    document.body.appendChild(modal);
    const form = modal.querySelector('#shipping-address-form');
    const city = modal.querySelector('#shipping-city');
    const district = modal.querySelector('#shipping-district');
    const ward = modal.querySelector('#shipping-ward');
    const message = modal.querySelector('#shipping-message');
    fillSelect(city, Object.keys(addressData), 'Chọn Tỉnh/Thành phố');
    const updateDistricts = () => {
        fillSelect(district, Object.keys(addressData[city.value] || {}), 'Chọn Quận/Huyện');
        district.disabled = !city.value;
        fillSelect(ward, [], 'Chọn Phường/Xã');
        ward.disabled = true;
    };
    const updateWards = () => {
        fillSelect(ward, addressData[city.value]?.[district.value] || [], 'Chọn Phường/Xã');
        ward.disabled = !district.value;
    };
    city.addEventListener('change', updateDistricts);
    district.addEventListener('change', updateWards);
    if (savedAddress.city && addressData[savedAddress.city]) {
        city.value = savedAddress.city; updateDistricts(); district.value = savedAddress.district || ''; updateWards(); ward.value = savedAddress.ward || '';
    }
    modal.querySelector('.auth-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const shippingAddress = Object.fromEntries(new FormData(form).entries());
        localStorage.setItem(SHIPPING_ADDRESS_KEY, JSON.stringify(shippingAddress));
        message.textContent = `Đã xác nhận giao ${productName} tới ${shippingAddress.detail}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}.`;
        message.style.color = '#2c7a2c';
    });
}

async function submitProductFromPanel(form, messageEl) {
    const user = getCurrentUser();
    const product = Object.fromEntries(new FormData(form).entries());
    product.price = Number(product.price);
    product.rating = Number(product.rating || 5);
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(product)
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Không thể thêm sản phẩm.');
    form.reset();
    messageEl.textContent = `Đã thêm sản phẩm: ${data.data.name}`;
    messageEl.style.color = '#2c7a2c';
}

async function showStaffManagement(content, user) {
    content.innerHTML = `
        <h4>Quản lý nhân viên</h4>
        <form class="role-form" id="staff-create-form">
            <input name="name" placeholder="Họ tên nhân viên" required>
            <input name="email" type="email" placeholder="Email" required>
            <input name="password" type="password" placeholder="Mật khẩu" required>
            <button type="submit">Tạo nhân viên</button>
        </form>
        <div class="role-panel-message"></div>
        <div id="staff-list-container"></div>`;
    const message = content.querySelector('.role-panel-message');
    const list = content.querySelector('#staff-list-container');
    const loadList = async () => {
        const response = await fetch(`${API_BASE_URL}/auth/users`, { headers: { Authorization: `Bearer ${user.token}` } });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải danh sách tài khoản.');
        const users = data.users.filter((item) => item.role !== 'manager');
        list.innerHTML = users.length
            ? `<table class="staff-list"><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th></tr></thead><tbody>${users.map((item) => `<tr><td>${item.name}</td><td>${item.email}</td><td>${getRoleLabel(item.role)}</td></tr>`).join('')}</tbody></table>`
            : '<p>Chưa có nhân viên hoặc khách hàng.</p>';
    };
    try { await loadList(); } catch (error) { message.textContent = error.message; message.style.color = '#c0392b'; }
    content.querySelector('#staff-create-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/users/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()))
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tạo nhân viên.');
            event.currentTarget.reset();
            message.textContent = `Đã tạo nhân viên: ${data.user.name}`;
            message.style.color = '#2c7a2c';
            await loadList();
        } catch (error) { message.textContent = error.message; message.style.color = '#c0392b'; }
    });
}

function showRolePanel(user) {
    if (!['manager', 'staff'].includes(user.role)) {
        if (window.confirm(`Bạn đang đăng nhập với vai trò ${getRoleLabel(user.role)}. Bạn muốn đăng xuất?`)) logoutUser();
        return;
    }
    closeRolePanel();
    const modal = document.createElement('div');
    modal.id = 'role-panel-modal';
    modal.className = 'auth-modal active';
    const managerControls = user.role === 'manager'
        ? '<button type="button" data-action="staff">Quản lý nhân viên</button>'
        : '';
    modal.innerHTML = `<div class="auth-modal-box role-panel-box">
        <button class="auth-close-btn" type="button" aria-label="Đóng">×</button>
        <h3>Bảng điều khiển ${getRoleLabel(user.role)}</h3>
        <p>Chọn chức năng bạn được cấp quyền sử dụng.</p>
        <div class="role-panel-actions"><button type="button" data-action="product">Thêm sản phẩm</button>${managerControls}<button type="button" class="secondary" data-action="logout">Đăng xuất</button></div>
        <div id="role-panel-content"></div></div>`;
    document.body.appendChild(modal);
    const content = modal.querySelector('#role-panel-content');
    modal.querySelector('.auth-close-btn').addEventListener('click', closeRolePanel);
    modal.addEventListener('click', (event) => { if (event.target === modal) closeRolePanel(); });
    modal.querySelector('[data-action="product"]').addEventListener('click', () => {
        content.innerHTML = `<h4>Thêm sản phẩm</h4><form class="role-form" id="product-create-form">
            <input name="name" placeholder="Tên sản phẩm" required><input name="brand" placeholder="Thương hiệu" required>
            <input name="price" type="number" min="1" placeholder="Giá (VNĐ)" required>
            <select name="category" required><option value="Nam">Đồng hồ Nam</option><option value="Nữ">Đồng hồ Nữ</option></select>
            <input name="imageUrl" type="url" placeholder="Link hình ảnh" required>
            <input name="rating" type="number" min="0" max="5" step="0.1" value="5"><button type="submit">Lưu sản phẩm</button>
            </form><div class="role-panel-message"></div>`;
        const form = content.querySelector('#product-create-form');
        const message = content.querySelector('.role-panel-message');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            try { await submitProductFromPanel(form, message); }
            catch (error) { message.textContent = error.message; message.style.color = '#c0392b'; }
        });
    });
    modal.querySelector('[data-action="staff"]')?.addEventListener('click', () => showStaffManagement(content, user));
    modal.querySelector('[data-action="logout"]').addEventListener('click', logoutUser);
}

function updateUserIcon(user) {
    const userIcon = document.getElementById('user-icon');
    if (!userIcon) return;
    const icon = userIcon.querySelector('i');
    if (icon) {
        icon.className = user ? 'fas fa-user-check' : 'far fa-user';
    }
    userIcon.style.color = user ? '#d4af37' : '#fff';
    const oldBadge = userIcon.querySelector('.user-role-badge');
    if (oldBadge) oldBadge.remove();

    const roleLabels = {
        manager: 'Quản lý',
        staff: 'Nhân viên',
        customer: 'Khách hàng'
    };
    const roleLabel = roleLabels[user?.role] || roleLabels.customer;
    if (user) {
        const badge = document.createElement('span');
        badge.className = 'user-role-badge';
        badge.textContent = roleLabel;
        userIcon.appendChild(badge);
    }
    userIcon.title = user ? `Đã đăng nhập: ${user.email} (${roleLabel})` : 'Đăng nhập';
}

function updateAuthUI() {
    const user = getCurrentUser();
    updateUserIcon(user);
    updateHeaderCounts();
}

function bindAuthEvents() {
    injectAuthStyles();
    const modal = createAuthModal();
    const form = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const closeBtn = modal.querySelector('.auth-close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', hideAuthModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideAuthModal();
            }
        });
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setAuthMode(currentAuthMode === 'login' ? 'register' : 'login');
            resetAuthForm();
        });
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('auth-name')?.value.trim() || '';
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-password').value.trim();
            const confirmPassword = document.getElementById('auth-confirm-password')?.value.trim() || '';
            const messageEl = document.getElementById('auth-message');
            const isRegisterMode = currentAuthMode === 'register';

            if (!email || !password) {
                if (messageEl) {
                    messageEl.textContent = 'Vui lòng nhập đủ email và mật khẩu.';
                    messageEl.style.color = '#c0392b';
                }
                return;
            }

            if (isRegisterMode && !name) {
                if (messageEl) {
                    messageEl.textContent = 'Vui lòng nhập họ tên.';
                    messageEl.style.color = '#c0392b';
                }
                return;
            }

            if (isRegisterMode) {
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
                if (!passwordRegex.test(password)) {
                    if (messageEl) {
                        messageEl.textContent = 'Mật khẩu phải từ 8 ký tự trở lên, gồm cả chữ và số.';
                        messageEl.style.color = '#c0392b';
                    }
                    return;
                }

                if (password !== confirmPassword) {
                    if (messageEl) {
                        messageEl.textContent = 'Mật khẩu nhập lại không khớp.';
                        messageEl.style.color = '#c0392b';
                    }
                    return;
                }
            }

            let result;
            if (isRegisterMode) {
                result = await registerUser(name, email, password);
            } else {
                result = await loginUser(email, password);
            }

            if (messageEl) {
                messageEl.textContent = result.message;
                messageEl.style.color = result.ok ? '#2c7a2c' : '#c0392b';
            }

            console.log('AUTH RESULT', result);
            if (!result.ok) {
                try { alert(result.message); } catch (e) { }
            }

            if (result.ok) {
                resetAuthForm();
                updateAuthUI();
                setTimeout(hideAuthModal, 700);
            }
        });
    }

    const userIcon = document.getElementById('user-icon');
    if (userIcon) {
        userIcon.addEventListener('click', (event) => {
            event.preventDefault();
            const user = getCurrentUser();
            if (user) {
                showRolePanel(user);
            } else {
                showAuthModal();
            }
        });
    }

    const wishlistIcon = document.getElementById('wishlist-icon');
    if (wishlistIcon) {
        wishlistIcon.addEventListener('click', (event) => {
            event.preventDefault();
            if (!requireLogin('xem danh sách yêu thích')) {
                return;
            }
            window.location.href = 'wishlist.html';
        });
    }

    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (event) => {
            event.preventDefault();
            if (!requireLogin('xem giỏ hàng')) {
                return;
            }
            window.location.href = 'cart.html';
        });
    }

    updateAuthUI();
}

function requireLogin(actionName = 'thực hiện thao tác này') {
    const user = getCurrentUser();
    if (user) {
        return true;
    }
    showAuthModal(`Bạn cần đăng nhập trước khi ${actionName}.`);
    return false;
}

function handleProtectedBuyNow(productName = 'sản phẩm') {
    showCheckoutModal(productName);
}

function handleProtectedAddToCart(productId, productName = 'sản phẩm') {
    if (!requireLogin('thêm vào giỏ hàng')) {
        return;
    }
    addToCart(productId, productName);
    alert(`Đã thêm "${productName}" vào giỏ hàng.`);
}

function handleToggleWishlist(productId, productName = 'sản phẩm', buttonElement = null) {
    if (!requireLogin('thêm hoặc xóa yêu thích')) {
        return null;
    }
    const result = toggleWishlist(productId, productName);
    if (buttonElement) {
        buttonElement.textContent = result.added ? 'Bỏ yêu thích' : 'Thêm yêu thích';
        buttonElement.classList.toggle('active', result.added);
    }
    if (result.added) {
        alert(`Đã thêm "${result.name}" vào yêu thích.`);
    } else {
        alert(`Đã xóa "${result.name}" khỏi yêu thích.`);
    }
    return result;
}

window.CHRONOS_AUTH = {
    getCurrentUser,
    requireLogin,
    handleProtectedBuyNow,
    showCheckoutModal,
    handleProtectedAddToCart,
    handleToggleWishlist,
    getCartCount,
    getWishlistCount,
    isInWishlist,
    updateHeaderCounts
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAuthEvents);
} else {
    bindAuthEvents();
}
