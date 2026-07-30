import { LOGIN_URL, setAdminToken } from './state.js';
import { loadDashboardData } from './api.js';

function getToken() {
    return localStorage.getItem('adminToken') || null;
}

export async function checkAuth() {
    if (!getToken()) {
        showLoginOverlay();
        return false;
    }
    return true;
}

export function showLoginOverlay() {
    if (document.getElementById('loginOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'loginOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#111827;z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:#1f2937;padding:30px;border-radius:12px;width:300px;text-align:center;">
            <h2 style="color:white;margin-bottom:15px;">تسجيل الدخول للإدارة</h2>
            <input type="text" id="adminIdent" placeholder="اسم المستخدم أو الإيميل" style="width:100%;padding:10px;margin-bottom:15px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;">
            <input type="password" id="adminPass" placeholder="كلمة المرور" style="width:100%;padding:10px;margin-bottom:15px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;">
            <button data-action="doAdminLogin" class="btn btn-primary" style="width:100%;padding:10px;background:#fbbf24;color:black;font-weight:bold;border-radius:6px;cursor:pointer;">دخول</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

export async function doAdminLogin() {
    const ident = document.getElementById('adminIdent').value.trim();
    const pass = document.getElementById('adminPass').value;
    const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: ident, password: pass })
    });
    const data = await res.json();
    if (data.status === 'success' || data.success) {
        const token = data.data ? data.data.token : data.token;
        setAdminToken(token);
        document.getElementById('loginOverlay').remove();
        loadDashboardData();
    } else {
        window.showToastGlobal('بيانات الدخول خاطئة!');
    }
}

export async function authFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        showLoginOverlay();
        return null;
    }
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, options);
    if (res.status === 401) {
        setAdminToken(null);
        showLoginOverlay();
        return null;
    }
    return res;
}

export function initAuthModule() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (btn && btn.getAttribute('data-action') === 'doAdminLogin') {
            doAdminLogin();
        }
    });
}
