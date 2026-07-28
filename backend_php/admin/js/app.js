import { initDashboardModule } from './modules/dashboard.js';
import { initApartmentsModule } from './modules/apartments.js';
import { initServicesModule } from './modules/services.js';
import { initStudentsModule } from './modules/students.js';
import { initRequestsModule } from './modules/requests.js';
import { initReviewsModule } from './modules/reviews.js';
import { initFeedbackModule } from './modules/feedback.js';
import { initDistrictsModule } from './modules/districts.js';
import { initUniversitiesModule } from './modules/universities.js';
import { initChatsModule } from './modules/chats.js';
import { initNewsModule } from './modules/news.js';
import { initNotificationsModule } from './modules/notifications.js';
import { initOffersModule } from './modules/offers.js';
import { initAuthModule, authFetch, doAdminLogin, checkAuth } from './auth.js';
import { initUploadsModule } from './uploads.js';
import { initNavigation, switchTab } from './router.js';
import { initThemeToggle, initModalDelegation, openModal, closeModal, showToast } from './ui.js';
import { loadDashboardData } from './api.js';
import { currentLang, setCurrentLang } from './state.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Expose globally so HTML onclick attributes and modules can call them
    window.authFetch        = authFetch;
    window.doAdminLogin     = doAdminLogin;
    window.switchTabGlobal  = switchTab;
    window.openModalGlobal  = openModal;
    window.closeModalGlobal = closeModal;
    window.showToastGlobal  = showToast;
    window.openImageLightboxGlobal = function(url) {
        const imgEl = document.getElementById('lightboxImg');
        const modal = document.getElementById('imageLightboxModal');
        if (imgEl && modal) {
            imgEl.src = url;
            modal.style.display = 'flex';
        }
    };

    // Basic init
    initThemeToggle();
    initModalDelegation();
    initNavigation();
    initAuthModule();
    initUploadsModule();

    // Feature modules init
    initDashboardModule();
    initApartmentsModule();
    initServicesModule();
    initStudentsModule();
    initRequestsModule();
    initReviewsModule();
    initFeedbackModule();
    initDistrictsModule();
    initUniversitiesModule();
    initChatsModule();
    initNewsModule();
    initNotificationsModule();
    initOffersModule();

    // Setup Language Toggle Button listener to prevent un-hooked button bug
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const nextLang = currentLang === 'ar' ? 'en' : 'ar';
            changeLanguage(nextLang);
        });
    }

    // Check login and load data; start polling every 4 seconds
    const isAuthed = await checkAuth();
    if (isAuthed) {
        await loadDashboardData();
        setInterval(loadDashboardData, 4000);
    }
});

export function changeLanguage(lang) {
    setCurrentLang(lang);
    localStorage.setItem('admin_lang', lang);
    location.reload();
}
