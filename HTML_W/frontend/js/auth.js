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

        saveCurrentUser({ name: data.user.name, email: data.user.email, token: data.token });
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

        saveCurrentUser({ name: data.user.name, email: data.user.email, token: data.token });
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

function updateUserIcon(user) {
    const userIcon = document.getElementById('user-icon');
    if (!userIcon) return;
    const icon = userIcon.querySelector('i');
    if (icon) {
        icon.className = user ? 'fas fa-user-check' : 'far fa-user';
    }
    userIcon.style.color = user ? '#d4af37' : '#fff';
    userIcon.title = user ? `Đã đăng nhập: ${user.email}` : 'Đăng nhập';
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
                const confirmLogout = window.confirm('Bạn muốn đăng xuất khỏi hệ thống?');
                if (confirmLogout) {
                    clearCurrentUser();
                    resetAuthForm();
                    setAuthMode('login');
                    updateAuthUI();
                    alert('Đã đăng xuất');
                }
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
    if (!requireLogin('mua ngay')) {
        return;
    }
    alert(`Đã đăng nhập. Bạn có thể tiếp tục mua "${productName}".`);
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
