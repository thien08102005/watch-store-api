const AUTH_STORAGE_KEY = 'chronos_user';
const CART_STORAGE_KEY = 'chronos_cart';
const WISHLIST_STORAGE_KEY = 'chronos_wishlist';
const ORDER_HISTORY_KEY = 'chronos_order_history';
const API_BASE_URL = 'http://localhost:5000/api';
let currentAuthMode = 'login';

const FALLBACK_BRANDS = [
    { name: 'Movado' },
    { name: 'Bering' },
    { name: 'Omega' },
    { name: 'Tissot' },
    { name: 'Citizen' },
    { name: 'Longines' },
    { name: 'Enicar' },
    { name: 'Gucci' },
    { name: 'Mido' },
    { name: 'Alfex' },
    { name: 'Grovana' },
    { name: 'Rado' },
    { name: 'Tommy Hilfiger' },
    { name: 'Lacoste' },
    { name: 'Bulova' },
    { name: 'Caravelle' },
    { name: 'Calvin Klein' },
    { name: 'Seiko' },
    { name: 'Casio' },
    { name: 'Scuderia Ferrari' },
    { name: 'Raymond Weil' },
    { name: 'Coach' }
];

function getBrandOptions() {
    const brands = window.brands && Array.isArray(window.brands) ? window.brands : FALLBACK_BRANDS;
    return brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
}

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

async function handleGoogleAuthResponse(response) {
    try {
        if (!response?.credential) {
            return { ok: false, message: 'Không nhận được thông tin từ Google.' };
        }

        const serverResponse = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await serverResponse.json();
        if (!serverResponse.ok || !data.success) {
            return { ok: false, message: data.message || 'Đăng nhập Google thất bại.' };
        }

        saveCurrentUser({ name: data.user.name, email: data.user.email, role: data.user.role, token: data.token });
        return { ok: true, message: 'Đăng nhập Google thành công!' };
    } catch (error) {
        return { ok: false, message: 'Không thể kết nối tới server.' };
    }
}

function loadGoogleSdk() {
    if (window.google?.accounts?.id) {
        return Promise.resolve();
    }

    if (document.getElementById('google-gsi-script')) {
        return new Promise((resolve) => {
            const check = () => {
                if (window.google?.accounts?.id) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

function initGoogleAuthUI() {
    const container = document.getElementById('google-login-container');
    const clientId = window.GOOGLE_CLIENT_ID || '';

    if (!container) return;

    const button = document.getElementById('google-login-button');
    if (button) {
        button.textContent = clientId ? 'Đang tải Google login...' : 'Google login chưa cấu hình';
        button.disabled = !clientId;
    }

    if (!clientId) {
        return;
    }

    loadGoogleSdk().then(() => {
        if (!window.google?.accounts?.id) return;
        if (container.dataset.initialized === 'true') return;

        const button = document.getElementById('google-login-button');
        if (button) {
            button.style.display = 'none';
        }

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
                const result = await handleGoogleAuthResponse(response);
                const messageEl = document.getElementById('auth-message');
                if (messageEl) {
                    messageEl.textContent = result.message;
                    messageEl.style.color = result.ok ? '#2c7a2c' : '#c0392b';
                }
                if (result.ok) {
                    updateAuthUI();
                    setTimeout(hideAuthModal, 700);
                }
            }
        });

        container.dataset.initialized = 'true';
        window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: '100%'
        });
    });
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
        .auth-social {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
        }
        .auth-social-divider {
            text-align: center;
            color: #888;
            font-size: 12px;
            position: relative;
        }
        .auth-social-divider::before,
        .auth-social-divider::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 35%;
            height: 1px;
            background: #ddd;
        }
        .auth-social-divider::before { left: 0; }
        .auth-social-divider::after { right: 0; }
        .google-button {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background: #fff;
            color: #444;
            font-weight: 700;
            cursor: not-allowed;
        }
        .google-button:disabled {
            opacity: 0.7;
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
            <div class="auth-social">
                <div class="auth-social-divider">hoặc</div>
                <div id="google-login-container"></div>
                <button type="button" id="google-login-button" class="google-button">Đang tải Google login...</button>
            </div>
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
        'Ba Đình': ['Phúc Xá', 'Trúc Bạch', 'Ngọc Hà', 'Liễu Giai', 'Đội Cấn', 'Quán Thánh', 'Cống Vị'],
        'Cầu Giấy': ['Dịch Vọng', 'Nghĩa Đô', 'Yên Hòa', 'Quan Hoa', 'Xuân Phương', 'Mỹ Đình', 'Cầu Giấy'],
        'Hoàng Mai': ['Hoàng Liệt', 'Định Công', 'Mai Động', 'Cổ Nhuế', 'Hoàng Liệt', 'Thành Công', 'Cục Lộc'],
        'Hai Bà Trưng': ['Bà Triệu', 'Tràng Tiền', 'Cửa Đông', 'Hàng Bạc', 'Hàng Ngoài', 'Hàng Điếu', 'Thanh Cương'],
        'Đống Đa': ['Văn Chương', 'Trúc Bạch', 'Phúc Tân', 'Lý Nam Đế', 'Hàng Bông', 'Quan Nhân', 'Giảng Võ'],
        'Tây Hồ': ['Tây Hồ', 'Phúc Thọ', 'Quảng An', 'Nhật Tân', 'Phú Thượng', 'Sài Đông', 'Ciputra'],
        'Bắc Từ Liêm': ['Phương Canh', 'Sài Đông', 'Cầu Diễn', 'Mỗ Lao', 'Tuần', 'Thượng Cát', 'Xuân Phương'],
        'Nam Từ Liêm': ['Mỹ Đình', 'Tây Mỗ', 'Dương Nội', 'Phú Lương', 'Cầu Diễn', 'Nam Từ Liêm'],
        'Hà Đông': ['Phong Châu', 'An Dương', 'Vạn Phúc', 'Viên', 'Kim Giang', 'Vĩnh Hưng', 'An Dương'],
        'Thanh Xuân': ['Khương Thượng', 'Khương Đình', 'Khương Mai', 'Khuất Duy Tiến', 'Thạch Bàn', 'Vĩnh Phúc', 'Hạ Đình']
    },
    'TP. Hồ Chí Minh': {
        'Quận 1': ['Bến Nghé', 'Bến Thành', 'Cầu Ông Lãnh', 'Nguyễn Hữu Cảnh', 'Tôn Đức Thắng', 'Tôn Thất Đạm'],
        'Quận 3': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 4': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17', 'Phường 18'],
        'Quận 5': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'Quận 6': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
        'Quận 7': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17', 'Phường 18', 'Phường 19'],
        'Quận 8': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'Quận 9': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13'],
        'Quận 10': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'Quận 11': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'Quận 12': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
        'TP. Thủ Đức': ['An Phú', 'Linh Trung', 'Thảo Điền', 'An Lợi Đông', 'Bình Thọ', 'Bình An', 'Cát Lái', 'Hiệp Phú', 'Phú Hữu', 'Saigon Hi-Tech Park', 'Saigon Pearl', 'Tân Hưng', 'Tân Phú', 'Tân Tạo'],
        'Bình Thạnh': ['Thạnh Lộc', 'Thạnh Mỹ Lợi', 'Thạnh Toàn', 'An Lạc', 'An Phú', 'An Khánh', 'Bình Trưng Đông', 'Bình Trưng Tây', 'Bình Chiểu'],
        'Gò Vấp': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'],
        'Tân Phú': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
        'Tân Bình': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
        'Phú Nhuận': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17']
    },
    'Hải Phòng': {
        'Hồng Bàng': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8'],
        'Ngô Quyền': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9'],
        'Lê Chân': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12'],
        'Kiến An': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7'],
        'Thủy Nguyên': ['Đông Hải', 'Quảng Hưng', 'Nông Cống', 'An Dương', 'Yết Kiêu', 'Bạch Đằng', 'Vĩnh Khê'],
        'Vân Đồn': ['Cái Rằng', 'Quảng Nham', 'Yên Hưng', 'Quảng Tây', 'Bạch Long Vỹ', 'Quan Lạn'],
        'Cát Hải': ['Cát Hải', 'Cát Bà', 'Hải Sơn', 'Quảng Yên']
    },
    'Đà Nẵng': {
        'Hải Châu': ['Bình Hiên', 'Hòa Cường Bắc', 'Hòa Thuận Đông', 'Thạch Thang', 'Hòa Thuận Tây', 'Hòa Cường Nam', 'Nam Dương', 'Bình Thạnh'],
        'Sơn Trà': ['An Hải Bắc', 'Mân Thái', 'Phước Mỹ', 'An Hải Đông', 'Thọ Quang', 'An Hải Tây'],
        'Thanh Khê': ['Tân Chính', 'Thanh Bình', 'Thạch Thang', 'Hòa An', 'Hòa Khánh Tây', 'Hòa Khánh Đông'],
        'Liên Chiểu': ['Liên Chiểu', 'Hoà Hiệp Bắc', 'Hoà Hiệp Nam', 'Chánh Mỹ', 'Ngũ Hành Sơn', 'Khuê Mỹ'],
        'Ngũ Hành Sơn': ['Mỹ Ân', 'Khuê Mỹ', 'Hoà Bình', 'Phước Mỹ', 'Nại Hiên Đông', 'Nại Hiên Tây'],
        'Cẩm Lệ': ['Hòa An', 'Hòa Vang', 'Hòa Xuân', 'Hòa Khương', 'Trường Xuân', 'Hòa Phong']
    },
    'Quảng Nam': {
        'Hội An': ['Cẩm Phô', 'Cẩm Châu', 'Cẩm Hà', 'Tân Hội', 'Tân An', 'Tân Cương'],
        'Tam Kỳ': ['Cửa Côn', 'Tân Cương', 'Quế Sơn', 'Điện Ngọc', 'Điện Phong', 'Mộ Đức'],
        'Duy Xuyên': ['Duy Hải', 'Duy Phú', 'Duy Sơn', 'Duy Xuyên', 'Duy Phước', 'Duy Vinh'],
        'Thăng Bình': ['Bình Hòa', 'Bình Dương', 'Bình Phú', 'Bình Định', 'Bình Mỹ'],
        'Bình Sơn': ['Bình Hòa', 'Bình Dương', 'Bình Phú', 'Bình Sơn', 'Bình Tây'],
        'Phú Ninh': ['Phú Sơn', 'Phú Thượng', 'Phú Tân', 'Phú Phong', 'Phú Mỹ'],
        'Nước Ngoài': ['An Phú', 'An Ninh', 'An Chính', 'An Lạc', 'An Mỹ'],
        'Núi Thành': ['Núi Thành', 'Núi Sơn', 'Núi Cơ', 'Núi Thịnh']
    },
    'Quảng Ngãi': {
        'Quảng Ngãi': ['Hồng Phong', 'Lê Hồng Phong', 'Trần Hưng Đạo', 'Phan Bội Châu', 'Lý Tự Trọng'],
        'Bình Sơn': ['Bình Hòa', 'Bình Dương', 'Bình Phú', 'Bình Sơn', 'Bình Tây'],
        'Tư Nghĩa': ['Túy Phước', 'Tư Sơn', 'Tây Sơn', 'Tư Phương', 'Tư Vinh'],
        'Mộ Đức': ['Mộ Đức', 'Mộ Sơn', 'Mộ Phú', 'Mộ Hòa'],
        'Lý Sơn': ['An Phú', 'Tân Lân'],
        'Nghĩa Hành': ['Nghĩa An', 'Nghĩa Sơn', 'Nghĩa Mỹ']
    },
    'Bình Định': {
        'Qui Nhơn': ['Hoài Thanh', 'Hoài Nhơn', 'Trần Hưng Đạo', 'Nguyễn Huệ', 'Lê Lợi', 'Ngô Mây'],
        'An Nhơn': ['Nhơn Hòa', 'Nhơn Phú', 'Nhơn Lý', 'Nhơn Mỹ', 'Nhơn Phương'],
        'Phù Cát': ['Phù Cát', 'Phù Hòa', 'Phù Mỹ', 'Phù Sơn', 'Phù Tân'],
        'Vạn Ninh': ['Vạn Tường', 'Vạn Hòa', 'Vạn Mỹ', 'Vạn Phong'],
        'Hoài Ân': ['Hoài Thanh', 'Hoài Hoa', 'Hoài Phú'],
        'Hoài Nhơn': ['Hoài Xuân', 'Hoài Ân', 'Hoài Đức']
    },
    'Phú Yên': {
        'Tuy Hòa': ['Phú Nhuận', 'Phú Hài', 'Hòa Tú', 'Hòa Xuân', 'Hòa Hiệp', 'Phú Lạc'],
        'Sông Cầu': ['Sông Cầu', 'Đông Tác', 'Tây Tác', 'Tân Tạo', 'Tân Thắng'],
        'Đồng Xuân': ['Chư Sê', 'Chư Đông', 'Chư Nam', 'Chư Quảng', 'Chư Hu'],
        'Tây Hòa': ['Tây Sơn', 'Tây Hòa', 'Tây Phú', 'Tây An'],
        'Phú Hoà': ['Phú Lâm', 'Phú Tài', 'Phú Sơn', 'Phú Thạnh'],
        'An Tường': ['An Lạc', 'An Tường', 'An Thịnh', 'An Hòa']
    },
    'Khánh Hòa': {
        'Nha Trang': ['Vạn Thọ', 'Xương Huân', 'Phương Sài', 'Phương Mai', 'Vạn Yên', 'Vạn Hạnh'],
        'Cam Ranh': ['Cam Lâm', 'Cam Phúc Tây', 'Cam Phúc Đông', 'Cam Tân', 'Cam Xuyên'],
        'Khánh Vĩnh': ['Khánh Sơn', 'Khánh Hòa', 'Khánh Nhạc', 'Khánh An', 'Khánh Phú'],
        'Nha Phu': ['Nha Phu', 'Phú Long', 'Phú Hải'],
        'Diên Khánh': ['Diên Phương', 'Diên Thắng', 'Diên Hải', 'Diên Lâm'],
        'Thường Hải': ['Thường An', 'Thường Phú', 'Thường Sơn']
    },
    'Ninh Thuận': {
        'Phan Rang - Tháp Chàm': ['Hòa Xương', 'Hòa Hợp', 'Hòa Long', 'Hòa Tân', 'Hòa Mỹ'],
        'Tuy Phong': ['Phong Nhai', 'Phong Tiến', 'Phong Đông', 'Phong Mỹ', 'Phong Phú'],
        'Ninh Hải': ['Sơn Hải', 'Sơn Lâm', 'Sơn Phụng', 'Sơn Tây', 'Sơn Lộc'],
        'Ninh Sơn': ['Ninh Mỹ', 'Ninh An', 'Ninh Lộc', 'Ninh Phương'],
        'Thuận Bắc': ['Thuận Tây', 'Thuận Bắc', 'Thuận Nam'],
        'Thuận Nam': ['Thuận Phong', 'Thuận Lâm', 'Thuận Phú']
    },
    'Bình Thuận': {
        'Phan Thiết': ['Phú Hài', 'Phú Thọ', 'Xuân Dương', 'Xuân Hòa', 'Xuân An'],
        'La Gi': ['Lạc Dương', 'Lạc Sơn', 'Lạc Thủy', 'Lạc Hòa', 'Lạc Phương'],
        'Tuy Phong': ['Phong Nhai', 'Phong Tiến', 'Phong Dương', 'Phong Sơn', 'Phong Mỹ'],
        'Hàm Tân': ['Hàm Minh', 'Hàm Liên', 'Hàm Kiệm', 'Hàm Sơn'],
        'Đức Linh': ['Đức An', 'Đức Thắng', 'Đức Phú'],
        'Tánh Linh': ['Tánh Lương', 'Tánh Phú', 'Tánh Long']
    },
    'Long An': {
        'Tân An': ['Phú Hòa', 'Phú Mỹ', 'Tân Tạo', 'Tân Thạnh', 'Tân Sơn'],
        'Mỹ Tho': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7'],
        'Cần Đước': ['Cần Kiệm', 'Cần Thạnh', 'Cần Hạ', 'Cần Nước Mặn', 'Cần An'],
        'Tân Hưng': ['Tân Hòa', 'Tân Thắng', 'Tân Phú', 'Tân Lộc'],
        'Vĩnh Hưng': ['Vĩnh Thiện', 'Vĩnh Thạnh', 'Vĩnh Mỹ', 'Vĩnh Hòa'],
        'Mộc Hóa': ['Mộc Tín', 'Mộc Hóa', 'Mộc Thái']
    },
    'Tiền Giang': {
        'Mỹ Tho': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7'],
        'Gò Công': ['Hòa Mỹ', 'Hòa Phú', 'Hòa Tân', 'Hòa An', 'Hòa Sơn'],
        'Cái Bè': ['Nhơn Thạnh', 'Tân Mỹ', 'Tân Phong', 'Tân Thành'],
        'Cai Lậy': ['Cai Hồng', 'Cai Sơn', 'Cai Tây'],
        'Chợ Gạo': ['Chợ Gạo', 'Lý Nhân', 'Hoa Lư'],
        'Tân Phú': ['Tân Phú Đông', 'Tân Phú Tây', 'Tân Phú Nam']
    },
    'Bến Tre': {
        'Bến Tre': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7'],
        'Châu Thành': ['Thạnh Hóa', 'Thạnh Phú', 'Thạnh Tâm', 'Thạnh Sơn', 'Thạnh An'],
        'Ba Tri': ['Bình Đại', 'Bình Phú', 'Bình Tâm', 'Bình Thạnh'],
        'Chợ Lách': ['Bình Thắng', 'Bình Thạnh', 'Bình Phúc'],
        'Mỏ Cày Nam': ['Mỏ Cày Bắc', 'Mỏ Cày Nam', 'Mỏ Cày Tây'],
        'Thạnh Phú': ['Thạnh Hữu', 'Thạnh Mỹ', 'Thạnh Dương']
    },
    'Trà Vinh': {
        'Trà Vinh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8'],
        'Duyên Hải': ['Tân Phú Đông', 'Tân Phú Tây', 'Duyên Hải Bắc', 'Duyên Hải Nam'],
        'Càng Long': ['Thị trấn Càng Long', 'Cái Dương', 'Gia Phú', 'Mỹ Tân', 'Mỹ Hiệp'],
        'Châu Thành': ['Thị trấn Châu Thành', 'Tân Hương', 'Trầu Quả', 'Tân Quới', 'Tân Thắng'],
        'Cầu Kè': ['Thị trấn Cầu Kè', 'Long Hồ', 'Long Sơn', 'Long Mỹ', 'Long Thạnh'],
        'Tiểu Cần': ['Thị trấn Tiểu Cần', 'Lợi Bình Nhân', 'Nhân Mỹ', 'Phú Hữu'],
        'Cầu Ngang': ['Thị trấn Cầu Ngang', 'Hòa Bình', 'Hòa Long', 'Hòa Sơn', 'Hòa An'],
        'Trà Cú': ['Thị trấn Trà Cú', 'Thái Hòa', 'Lộc Phú', 'Khánh Phú', 'Thôn Thạnh']
    },
    'Vĩnh Long': {
        'Vĩnh Long': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8'],
        'Mang Thít': ['Tân Hòa', 'Tân Hạ', 'Tân Xuyên', 'Tân Phương', 'Tân Sơn'],
        'Bình Minh': ['Bình Tân', 'Bình Phú', 'Bình Long', 'Bình An', 'Bình Sơn'],
        'Long Hồ': ['Long Sơn', 'Long Hòa', 'Long Trì', 'Long Lâm'],
        'Tam Bình': ['Tân Lộc', 'Tân Hòa', 'Tân Sơn'],
        'Trà On': ['Trà Sơn', 'Trà Lâm', 'Trà Ôn']
    },
    'Đồng Tháp': {
        'Cao Lãnh': ['Tân Thạnh', 'Tân Quy', 'Tân Châu', 'Tân Sơn', 'Tân An'],
        'Sa Đéc': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7'],
        'Thanh Bình': ['Tân Hòa', 'Tân Thạnh', 'Tân Sơn', 'Tân Lộc'],
        'Hồng Ngu': ['Tân Quy', 'Tân Hợp', 'Tân Tạo'],
        'Châu Thành': ['Châu Sơn', 'Châu Hòa', 'Châu An'],
        'Tân Hưng': ['Tân Hòa', 'Tân Thạnh', 'Tân Phúc']
    },
    'An Giang': {
        'Long Xuyên': ['Mỹ Bình', 'Mỹ Xuyên', 'Mỹ Phú', 'Mỹ Hòa', 'Mỹ An'],
        'Châu Đốc': ['Châu Văn Liêm', 'Phú Khánh', 'Phú Mỹ', 'Phú Hòa', 'Phú Sơn'],
        'Tân Châu': ['An Bình', 'An Châu', 'An Phú', 'An Mỹ', 'An Hòa'],
        'Phú Tân': ['Phú Lạc', 'Phú Hòa', 'Phú Sơn'],
        'Chợ Mới': ['An Thoại', 'An Mỹ', 'An Phú'],
        'Tịnh Biên': ['Tịnh Sơn', 'Tịnh Hòa', 'Tịnh Dân']
    },
    'Kiên Giang': {
        'Rạch Giá': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6'],
        'Hà Tiên': ['Mũi Né', 'Tân Hiệp', 'Tân Thành', 'Tân Phú', 'Tân Sơn'],
        'Phú Quốc': ['An Thới', 'Hòa An', 'Cửa Cạn', 'Hòa Hải', 'Dương Tơ'],
        'Gò Quao': ['Gò Quao', 'Gò Hộp'],
        'An Minh': ['An Sơn', 'An Hòa', 'An Phú'],
        'Vĩnh Thuận': ['Vĩnh Hòa', 'Vĩnh Sơn', 'Vĩnh Lộc']
    },
    'Cần Thơ': {
        'Ninh Kiều': ['An Khánh', 'An Nghiệp', 'Cái Khế', 'An Hoà', 'An Bình'],
        'Bình Thủy': ['An Thới', 'Bình Thủy', 'Trà An', 'Bình Minh', 'Bình Phú'],
        'Cờ Đỏ': ['Tân Phú', 'Tân Thạnh', 'Tân Phong', 'Tân Lộc', 'Tân Hoàng'],
        'Thốt Nốt': ['Tân Kỳ', 'Tân Lợi', 'Tân Phương', 'Tân Hòa', 'Tân Sơn']
    },
    'Hậu Giang': {
        'Vị Thanh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6'],
        'Ngã Năm': ['Tân Hòa', 'Tân Thạnh', 'Tân Long', 'Tân Phương', 'Tân Sơn'],
        'Châu Thành': ['Bình Hòa', 'Bình Phú', 'Bình Tâm', 'Bình An', 'Bình Sơn'],
        'Phụng Hiệp': ['Phụng Hiệp A', 'Phụng Hiệp B'],
        'Vị Thủy': ['Vị Sơn', 'Vị Hòa', 'Vị Trung']
    },
    'Sóc Trăng': {
        'Sóc Trăng': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6'],
        'Bạc Liêu': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5'],
        'Long Phú': ['Tân Hòa', 'Tân Thạnh', 'Tân Long'],
        'Mỹ Tú': ['Mỹ Sơn', 'Mỹ Hòa', 'Mỹ Lâm'],
        'Kế Sách': ['Kế Sơn', 'Kế Hòa', 'Kế An'],
        'Trần Đề': ['Trần Sơn', 'Trần Hòa', 'Trần Lâm']
    },
    'Bạc Liêu': {
        'Bạc Liêu': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5'],
        'Hồng Dân': ['Tân Hòa', 'Tân Thạnh', 'Tân Phong', 'Tân Lộc', 'Tân Sơn'],
        'Phước Long': ['Tân Hòa', 'Tân Thạnh', 'Tân Lợi', 'Tân Sơn', 'Tân Phương'],
        'Giá Rai': ['Giá Sơn', 'Giá Hòa', 'Giá Lân'],
        'Vĩnh Lợi': ['Vĩnh Hòa', 'Vĩnh Sơn', 'Vĩnh Phương'],
        'Ba Úc': ['Ba Sơn', 'Ba Hòa', 'Ba Lâm']
    },
    'Cà Mau': {
        'Cà Mau': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5'],
        'U Minh': ['Tân Hòa', 'Tân Thạnh', 'Tân Hiệp', 'Tân Sơn', 'Tân Phương'],
        'Năm Căn': ['Tân Hòa', 'Tân Thạnh', 'Tân Phước', 'Tân Sơn', 'Tân An'],
        'Đầm Dơi': ['Đầm Sơn', 'Đầm Hòa', 'Đầm Lâm'],
        'Gành Hào': ['Gành Sơn', 'Gành Hòa', 'Gành Phương'],
        'Thới Bình': ['Thới Sơn', 'Thới Hòa', 'Thới Lâm']
    }
};

function fillSelect(select, values, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>${values.map((value) => `<option value="${value}">${value}</option>`).join('')}`;
}

function getOrderHistory(user = null) {
    try {
        const currentUser = user || getCurrentUser();
        if (!currentUser) return [];
        const allOrders = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
        if (['manager', 'staff'].includes(currentUser.role)) {
            return allOrders;
        }
        return allOrders.filter(order => order.userEmail === currentUser.email);
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử mua hàng:', error);
        return [];
    }
}

function saveOrderToHistory(orderData) {
    try {
        const user = getCurrentUser();
        if (!user) return null;
        const allOrders = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
        const newOrder = {
            id: 'ORD' + Date.now().toString().slice(-6),
            userEmail: user.email,
            userName: user.name || user.email,
            orderDate: new Date().toLocaleString('vi-VN'),
            timestamp: Date.now(),
            status: 'Đã đặt hàng',
            ...orderData
        };
        allOrders.unshift(newOrder);
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(allOrders));
        return newOrder;
    } catch (error) {
        console.error('Lỗi khi lưu đơn hàng:', error);
        return null;
    }
}

function showOrderHistory(container, user = null) {
    const orders = getOrderHistory(user);
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px;">
                <div style="font-size: 48px; margin-bottom: 12px; color: #ccc;">📦</div>
                <h4 style="margin-bottom: 8px; color: #333;">Chưa có lịch sử đơn hàng</h4>
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Hãy chọn các sản phẩm yêu thích và tiến hành đặt hàng!</p>
                <a href="products.html" style="display: inline-block; padding: 10px 24px; background: #000; color: #d4af37; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px;">Khám phá sản phẩm</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <h4 style="margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #d4af37; padding-bottom: 8px; font-size: 16px;">📦 Lịch sử mua hàng (${orders.length} đơn)</h4>
        <div style="display: flex; flex-direction: column; gap: 14px; max-height: 60vh; overflow-y: auto; padding-right: 5px;">
            ${orders.map(order => {
                const addr = order.shippingAddress || {};
                const fullAddr = [addr.detail, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');
                const priceText = order.totalPrice && order.totalPrice > 0
                    ? order.totalPrice.toLocaleString('vi-VN') + ' VNĐ'
                    : 'Liên hệ';
                const paymentLabel = addr.payment === 'COD'
                    ? '💵 COD (Thanh toán khi nhận)'
                    : '🏦 Chuyển khoản ngân hàng';

                return `
                    <div style="background: #fdfdfd; border: 1px solid #e0e0e0; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 10px;">
                            <div>
                                <strong style="color: #000; font-size: 15px;">Mã đơn: #${order.id}</strong>
                                <span style="display: block; font-size: 12px; color: #888; margin-top: 2px;">📅 ${order.orderDate}</span>
                            </div>
                            <span style="background: #e8f5e9; color: #2c7a2c; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                                ${order.status || 'Đã đặt hàng'}
                            </span>
                        </div>
                        <div style="font-size: 14px; line-height: 1.6; color: #333;">
                            <p style="margin: 4px 0;"><strong>Sản phẩm:</strong> ${order.productName || 'Sản phẩm'}</p>
                            <p style="margin: 4px 0;"><strong>Tổng tiền:</strong> <span style="color: #d4af37; font-weight: bold;">${priceText}</span></p>
                            <p style="margin: 4px 0;"><strong>Người nhận:</strong> ${addr.recipient || order.userName || 'N/A'} (${addr.phone || 'N/A'})</p>
                            <p style="margin: 4px 0;"><strong>Địa chỉ:</strong> ${fullAddr || 'N/A'}</p>
                            <p style="margin: 4px 0;"><strong>Thanh toán:</strong> ${paymentLabel}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function formatMonthLabel(month) {
    const labels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return labels[month - 1] || `Tháng ${month}`;
}

function getRevenueByYearMonth(orders) {
    return orders.reduce((acc, order) => {
        const timestamp = Number(order.timestamp) || Date.parse(order.orderDate || '');
        const date = Number.isFinite(timestamp) ? new Date(timestamp) : new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const amount = Number(order.totalPrice) || (Array.isArray(order.items)
            ? order.items.reduce((subSum, item) => subSum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0)
            : 0);
        if (!acc[year]) acc[year] = Array(12).fill(0);
        acc[year][month - 1] += amount;
        return acc;
    }, {});
}

function renderRevenueChart(canvas, monthlyRevenue, highlightedMonths = []) {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width = 760;
    const height = canvas.height = 320;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    const padding = 48;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max(1, ...monthlyRevenue);
    const step = Math.ceil(maxValue / 5);
    const barWidth = chartWidth / 12 * 0.7;
    const barGap = chartWidth / 12 * 0.3;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i += 1) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText(((5 - i) * step).toLocaleString('vi-VN'), 8, y + 4);
    }

    monthlyRevenue.forEach((value, index) => {
        const x = padding + index * (barWidth + barGap) + barGap / 2;
        const barHeight = maxValue ? (value / maxValue) * chartHeight : 0;
        const y = padding + chartHeight - barHeight;
        ctx.fillStyle = highlightedMonths.includes(index + 1) ? '#d4af37' : '#a3a3a3';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(index + 1, x + barWidth / 2, height - 16);
    });

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding, padding / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(width - padding + 10, padding + chartHeight);
    ctx.stroke();
}

function showSalesRevenue(container, user = null) {
    const orders = getOrderHistory(user);
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px;">
                <div style="font-size: 48px; margin-bottom: 12px; color: #ccc;">📈</div>
                <h4 style="margin-bottom: 8px; color: #333;">Chưa có đơn hàng để tính doanh thu</h4>
                <p style="color: #666; font-size: 14px;">Tất cả doanh thu sẽ hiển thị ở đây khi có đơn hàng.</p>
            </div>
        `;
        return;
    }

    const revenueByYear = getRevenueByYearMonth(orders);
    const years = Object.keys(revenueByYear).map(Number).sort((a, b) => b - a);
    const currentYear = years[0] || new Date().getFullYear();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const availableYears = years.length ? years : [currentYear];
    const selectedYear = currentYear;
    const selectedMonthA = currentMonth;
    const selectedMonthB = previousMonth;

    container.innerHTML = `
        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 14px; padding: 24px; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
            <h4 style="margin-top: 0; margin-bottom: 20px; font-size: 18px;">📈 Báo cáo doanh thu</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; align-items: flex-end;">
                <div style="min-width: 180px;">
                    <label style="display: block; margin-bottom: 6px; color: #555; font-size: 13px;">Năm</label>
                    <select id="revenue-year-select" style="width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 10px; outline: none;">
                        ${availableYears.map(year => `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${year}</option>`).join('')}
                    </select>
                </div>
                <div style="min-width: 180px;">
                    <label style="display: block; margin-bottom: 6px; color: #555; font-size: 13px;">So sánh tháng</label>
                    <select id="revenue-compare-month-a" style="width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 10px; outline: none;">
                        ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === selectedMonthA ? 'selected' : ''}>${formatMonthLabel(i + 1)}</option>`).join('')}
                    </select>
                </div>
                <div style="min-width: 180px;">
                    <label style="display: block; margin-bottom: 6px; color: #555; font-size: 13px;">với tháng</label>
                    <select id="revenue-compare-month-b" style="width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 10px; outline: none;">
                        ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === selectedMonthB ? 'selected' : ''}>${formatMonthLabel(i + 1)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px;">
                <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; min-height: 120px; display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin: 0 0 8px; color: #666;">Doanh thu năm ${selectedYear}</p>
                    <p id="revenue-year-total" style="margin: 0; font-size: 24px; font-weight: 700; color: #111; white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height: 1.2;">0 VNĐ</p>
                </div>
                <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; min-height: 120px; display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin: 0 0 8px; color: #666;">Doanh thu ${formatMonthLabel(selectedMonthA)}</p>
                    <p id="revenue-month-a" style="margin: 0; font-size: 24px; font-weight: 700; color: #111; white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height: 1.2;">0 VNĐ</p>
                </div>
                <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; min-height: 120px; display: flex; flex-direction: column; justify-content: center;">
                    <p style="margin: 0 0 8px; color: #666;">Doanh thu ${formatMonthLabel(selectedMonthB)}</p>
                    <p id="revenue-month-b" style="margin: 0; font-size: 24px; font-weight: 700; color: #111; white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height: 1.2;">0 VNĐ</p>
                </div>
            </div>
            <div style="display: grid; gap: 24px; grid-template-columns: 1fr;">
                <div style="background: #f9f9f9; border-radius: 14px; padding: 18px;">
                    <canvas id="sales-revenue-chart" style="width: 100%; max-width: 100%; height: 320px;"></canvas>
                </div>
                <div id="revenue-comparison-summary" style="background: #fff9e6; border: 1px solid #f0dca8; border-radius: 14px; padding: 18px; color: #333; font-size: 14px;"></div>
            </div>
        </div>
    `;

    const yearSelect = container.querySelector('#revenue-year-select');
    const monthASelect = container.querySelector('#revenue-compare-month-a');
    const monthBSelect = container.querySelector('#revenue-compare-month-b');
    const yearTotalEl = container.querySelector('#revenue-year-total');
    const monthAEl = container.querySelector('#revenue-month-a');
    const monthBEl = container.querySelector('#revenue-month-b');
    const summaryEl = container.querySelector('#revenue-comparison-summary');
    const chartCanvas = container.querySelector('#sales-revenue-chart');

    const updateRevenueView = () => {
        const year = Number(yearSelect.value);
        const monthA = Number(monthASelect.value);
        const monthB = Number(monthBSelect.value);
        const monthlyRevenue = revenueByYear[year] || Array(12).fill(0);
        const totalYear = monthlyRevenue.reduce((sum, value) => sum + value, 0);
        const revenueA = monthlyRevenue[monthA - 1] || 0;
        const revenueB = monthlyRevenue[monthB - 1] || 0;
        const diff = revenueA - revenueB;
        const diffLabel = diff === 0
            ? 'Hai tháng bằng nhau'
            : diff > 0
                ? `Tháng ${monthA} cao hơn tháng ${monthB} ${diff.toLocaleString('vi-VN')} VNĐ`
                : `Tháng ${monthA} thấp hơn tháng ${monthB} ${(Math.abs(diff)).toLocaleString('vi-VN')} VNĐ`;

        yearTotalEl.textContent = `${totalYear.toLocaleString('vi-VN')} VNĐ`;
        monthAEl.textContent = `${revenueA.toLocaleString('vi-VN')} VNĐ`;
        monthBEl.textContent = `${revenueB.toLocaleString('vi-VN')} VNĐ`;
        summaryEl.innerHTML = `
            <h4 style="margin: 0 0 10px 0; font-size: 16px;">So sánh doanh thu</h4>
            <p style="margin: 0 0 6px;">Năm: <strong>${year}</strong></p>
            <p style="margin: 0 0 6px;">${formatMonthLabel(monthA)}: <strong>${revenueA.toLocaleString('vi-VN')} VNĐ</strong></p>
            <p style="margin: 0 0 0 0;">${formatMonthLabel(monthB)}: <strong>${revenueB.toLocaleString('vi-VN')} VNĐ</strong></p>
            <p style="margin: 12px 0 0 0; font-weight: 700; color: #b16a00;">${diffLabel}</p>
        `;
        renderRevenueChart(chartCanvas, monthlyRevenue, [monthA, monthB]);
    };

    yearSelect?.addEventListener('change', updateRevenueView);
    monthASelect?.addEventListener('change', updateRevenueView);
    monthBSelect?.addEventListener('change', updateRevenueView);
    updateRevenueView();
}

function showCheckoutModal(productName = 'sản phẩm', productPrice = 0, productId = null, quantity = 1) {
    if (!requireLogin('mua ngay')) return;
    document.getElementById('checkout-modal')?.remove();
    const savedAddress = JSON.parse(localStorage.getItem(SHIPPING_ADDRESS_KEY) || 'null') || {};
    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'auth-modal active';
    modal.innerHTML = `<div class="auth-modal-box checkout-box" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <button class="auth-close-btn" type="button" aria-label="Đóng">×</button>
        <h3 id="modal-title">Đặt hàng</h3>
        <div id="modal-content">
            <form id="shipping-address-form">
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">Thông tin sản phẩm</h4>
                    <p style="margin: 5px 0;"><strong>Sản phẩm:</strong> ${productName}</p>
                    <p style="margin: 5px 0;"><strong>Giá:</strong> ${productPrice > 0 ? productPrice.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ'}</p>
                </div>
                <h4>Thông tin giao hàng</h4>
                <div class="address-grid">
                    <label>Họ tên người nhận<input name="recipient" required value="${savedAddress.recipient || ''}" placeholder="Nhập họ tên"></label>
                    <label>Số điện thoại<input name="phone" required pattern="[0-9]{9,11}" value="${savedAddress.phone || ''}" placeholder="Ví dụ: 0901234567"></label>
                    <label>Tỉnh/Thành phố<select name="city" id="shipping-city" required></select></label>
                    <label>Quận/Huyện<select name="district" id="shipping-district" required disabled></select></label>
                    <label class="full-width">Phường/Xã<input name="ward" id="shipping-ward" type="text" required placeholder="Nhập phường/xã" disabled></label>
                    <label class="full-width">Địa chỉ cụ thể<input name="detail" required value="${savedAddress.detail || ''}" placeholder="Số nhà, tên đường"></label>
                </div>
                <h4 style="margin-top: 20px;">Phương thức thanh toán</h4>
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="payment" value="COD" required checked>
                        <span>💵 Thanh toán khi nhận hàng (COD)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="radio" name="payment" value="Transfer" required>
                        <span>🏦 Chuyển khoản ngân hàng</span>
                    </label>
                </div>
                <button class="checkout-submit" type="submit">Xác nhận đặt hàng</button>
            </form>
        </div>
    </div>`;
    document.body.appendChild(modal);
    const form = modal.querySelector('#shipping-address-form');
    const city = modal.querySelector('#shipping-city');
    const district = modal.querySelector('#shipping-district');
    const ward = modal.querySelector('#shipping-ward');
    const modalContent = modal.querySelector('#modal-content');
    const modalTitle = modal.querySelector('#modal-title');
    fillSelect(city, Object.keys(addressData), 'Chọn Tỉnh/Thành phố');
    const updateDistricts = () => {
        fillSelect(district, Object.keys(addressData[city.value] || {}), 'Chọn Quận/Huyện');
        district.disabled = !city.value;
        ward.value = '';
        ward.disabled = true;
    };
    const updateWards = () => {
        ward.disabled = !district.value;
    };
    city.addEventListener('change', updateDistricts);
    district.addEventListener('change', updateWards);
    if (savedAddress.city && addressData[savedAddress.city]) {
        city.value = savedAddress.city; updateDistricts(); district.value = savedAddress.district || ''; updateWards(); ward.value = savedAddress.ward || '';
    }
    modal.querySelector('.auth-close-btn').addEventListener('click', () => modal.remove());
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const shippingAddress = Object.fromEntries(formData.entries());
        localStorage.setItem(SHIPPING_ADDRESS_KEY, JSON.stringify(shippingAddress));

        let displayProductName = productName;
        let itemsList = [];
        if (productName === 'Giỏ hàng') {
            const cartItems = getCartItems();
            if (cartItems.length > 0) {
                displayProductName = cartItems.map(i => `${i.name} (x${i.quantity || 1})`).join(', ');
                itemsList = cartItems.map(i => ({ id: i.id, productId: i.id, name: i.name, quantity: Number(i.quantity) || 1, price: Number(i.price) || 0 }));
            } else {
                displayProductName = 'Giỏ hàng';
            }
        } else {
            itemsList = [{ id: productId, productId, name: productName, quantity: Number(quantity) || 1, price: Number(productPrice) || 0 }];
        }

        // Cập nhật tồn kho và sold trên backend
        const user = getCurrentUser();
        const token = user?.token;
        if (!token) {
            alert('Bạn cần đăng nhập để hoàn tất đơn hàng.');
            return;
        }

        for (const item of itemsList) {
            if (!item.id) continue;
            const response = await fetch(`${API_BASE_URL}/products/${item.id}/sell`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: item.quantity })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                alert(result.message || `Không thể cập nhật số lượng cho sản phẩm ${item.name}.`);
                return;
            }
        }

        // Gửi đơn hàng lên backend
        const backendResponse = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                userName: user.name || user.email,
                items: itemsList,
                totalPrice: itemsList.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0),
                shippingAddress
            })
        });
        const backendResult = await backendResponse.json();
        if (!backendResponse.ok || !backendResult.success) {
            alert(backendResult.message || 'Không thể lưu đơn hàng lên server.');
            return;
        }

        // Lưu lịch sử đơn hàng vào localStorage
        saveOrderToHistory({
            productName: displayProductName,
            items: itemsList,
            totalPrice: itemsList.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0),
            shippingAddress,
            status: backendResult.data?.status || 'Đã đặt hàng',
            orderDate: backendResult.data?.orderDate || new Date().toLocaleString('vi-VN'),
            timestamp: backendResult.data?.timestamp || Date.now()
        });

        // Nếu đặt hàng từ giỏ hàng, xóa sạch giỏ hàng
        if (productName === 'Giỏ hàng') {
            saveCartItems([]);
            updateHeaderCounts();
        }

        // Tạo bảng thông tin đơn hàng
        const orderDate = new Date().toLocaleString('vi-VN');
        const orderHTML = `
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #2c7a2c;">
                <h4 style="color: #2c7a2c; margin-top: 0; text-align: center;">✅ ĐẶT HÀNG THÀNH CÔNG</h4>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #e8f5e9; border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px; font-weight: bold;">Thông tin</td>
                        <td style="padding: 10px; text-align: right;">Chi tiết</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Sản phẩm:</td>
                        <td style="padding: 10px; text-align: right;"><strong>${displayProductName}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Giá tiền:</td>
                        <td style="padding: 10px; text-align: right;"><strong>${productPrice > 0 ? productPrice.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ'}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Người nhận:</td>
                        <td style="padding: 10px; text-align: right;"><strong>${shippingAddress.recipient}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Số điện thoại:</td>
                        <td style="padding: 10px; text-align: right;"><strong>${shippingAddress.phone}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Địa chỉ giao hàng:</td>
                        <td style="padding: 10px; text-align: right;"><strong>${shippingAddress.detail}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">Phương thức thanh toán:</td>
                        <td style="padding: 10px; text-align: right;">
                            <strong style="background: ${shippingAddress.payment === 'COD' ? '#fff3cd' : '#d1ecf1'}; padding: 5px 10px; border-radius: 4px; display: inline-block;">
                                ${shippingAddress.payment === 'COD' ? '💵 COD (Thanh toán khi nhận)' : '🏦 Chuyển khoản ngân hàng'}
                            </strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;">Thời gian đặt:</td>
                        <td style="padding: 10px; text-align: right;"><strong>${orderDate}</strong></td>
                    </tr>
                </table>
                <div style="background: #fff; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #2c7a2c;">
                    <p style="margin: 5px 0; color: #555;"><strong>📋 Ghi chú:</strong></p>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">
                        ${shippingAddress.payment === 'COD'
                            ? '✔ Bạn sẽ thanh toán trực tiếp cho nhân viên giao hàng. Vui lòng chuẩn bị tiền mặt.'
                            : '✔ Vui lòng chuyển khoản theo thông tin tài khoản được gửi qua email/SMS. Đơn hàng sẽ được xác nhận sau khi nhận được thanh toán.'}
                    </p>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="checkout-submit" style="flex: 1; background: #555; color: #fff;" onclick="document.getElementById('checkout-modal')?.remove()">Đóng</button>
                    <button class="checkout-submit" style="flex: 1;" onclick="document.getElementById('checkout-modal')?.remove(); showRolePanel(getCurrentUser());">📦 Lịch sử mua hàng</button>
                </div>
            </div>
        `;

        modalTitle.textContent = 'Xác nhận đơn hàng';
        modalContent.innerHTML = orderHTML;
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

function showProductManagement(content) {
    const brandOptions = getBrandOptions();
    const brandField = `<select name="brand" required><option value="">Chọn thương hiệu</option>${brandOptions}</select>`;

    content.innerHTML = `<h4>Thêm sản phẩm</h4><form class="role-form" id="product-create-form">
            <input name="name" placeholder="Tên sản phẩm" required>
            ${brandField}
            <input name="price" type="number" min="1" placeholder="Giá (VNĐ)" required>
            <input name="stock" type="number" min="0" placeholder="Số lượng tồn kho" required>
            <select name="category" required><option value="Nam">Đồng hồ Nam</option><option value="Nữ">Đồng hồ Nữ</option></select>
            <input name="size" placeholder="Size (ví dụ 40 mm)">
            <input name="imageUrl" type="text" placeholder="URL hoặc đường dẫn ảnh (vd: Image/xxx.webp)" required>
            <textarea name="description" rows="3" placeholder="Chi tiết sản phẩm"></textarea>
            <input name="rating" type="number" min="0" max="5" step="0.1" value="5">
            <button type="submit">Lưu sản phẩm</button>
            </form><div class="role-panel-message"></div>`;

    const form = content.querySelector('#product-create-form');
    const message = content.querySelector('.role-panel-message');
    if (!form || !message) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            await submitProductFromPanel(form, message);
        } catch (error) {
            message.textContent = error.message;
            message.style.color = '#c0392b';
        }
    });
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
    hideAuthModal();
    closeRolePanel();
    const modal = document.createElement('div');
    modal.id = 'role-panel-modal';
    modal.className = 'auth-modal active';

    const isStaffOrManager = ['manager', 'staff'].includes(user.role);
    const managerControls = user.role === 'manager'
        ? '<button type="button" data-action="staff">Quản lý nhân viên</button><button type="button" data-action="revenue">Doanh thu đã bán</button>'
        : '';
    const productControls = isStaffOrManager
        ? '<button type="button" data-action="product">Thêm sản phẩm</button>'
        : '';

    modal.innerHTML = `<div class="auth-modal-box role-panel-box" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <button class="auth-close-btn" type="button" aria-label="Đóng">×</button>
        <h3>Tài khoản: ${user.name || user.email}</h3>
        <p style="margin-top: 4px; color: #666; font-size: 14px;">Vai trò: <strong>${getRoleLabel(user.role)}</strong> (${user.email})</p>
        <div class="role-panel-actions" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; margin-bottom: 16px;">
            <button type="button" data-action="orders" class="primary">📦 Lịch sử mua hàng</button>
            ${productControls}
            ${managerControls}
            <button type="button" class="secondary" data-action="logout">Đăng xuất</button>
        </div>
        <div id="role-panel-content"></div></div>`;
    document.body.appendChild(modal);

    const content = modal.querySelector('#role-panel-content');
    if (!content) {
        console.error('Role panel content container not found.');
        return;
    }

    modal.querySelector('.auth-close-btn')?.addEventListener('click', closeRolePanel);

    // Mặc định hiển thị Lịch sử mua hàng khi mở bảng điều khiển
    showOrderHistory(content, user);

    const actionContainer = modal.querySelector('.role-panel-actions');
    actionContainer?.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : event.target.parentElement;
        const button = target?.closest?.('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'orders') {
            showOrderHistory(content, user);
        } else if (action === 'product') {
            showProductManagement(content);
        } else if (action === 'staff') {
            showStaffManagement(content, user);
        } else if (action === 'revenue') {
            showSalesRevenue(content, user);
        } else if (action === 'logout') {
            logoutUser();
        }
    });
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
    initGoogleAuthUI();
    const form = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const closeBtn = modal.querySelector('.auth-close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', hideAuthModal);
    }

    // Keep auth modal open until the user clicks the explicit close button.

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

function handleProtectedBuyNow(productName = 'sản phẩm', productPrice = 0, productId = null, quantity = 1) {
    showCheckoutModal(productName, productPrice, productId, quantity);
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
    updateHeaderCounts,
    getOrderHistory,
    saveOrderToHistory,
    showOrderHistory,
    showRolePanel
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAuthEvents);
} else {
    bindAuthEvents();
}
