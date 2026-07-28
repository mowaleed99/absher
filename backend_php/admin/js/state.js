export const API_URL = '../api/admin_api.php';
export const LOGIN_URL = '../api/admin/login.php';

export let adminToken = localStorage.getItem('adminToken') || null;
export function setAdminToken(token) {
    adminToken = token;
    if (token) localStorage.setItem('adminToken', token);
    else localStorage.removeItem('adminToken');
}

export let appData = {
    apartments: [],
    services: [],
    students: [],
    requests: [],
    chats: [],
    reviews: [],
    news: [],
    notifications: [],
    universities: [],
    districts: [],
    housing_offers: [],
    application_feedback: []
};

export function setAppData(data) {
    appData = data;
}

export let currentLang = localStorage.getItem('lang') || 'ar';
export function setCurrentLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
}
