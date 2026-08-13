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
import { initThemeToggle, initModalDelegation, openModal, closeModal, showToast, showConfirmDialog, showPromptDialog } from './ui.js';
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
    window.showConfirmDialog = showConfirmDialog;
    window.showPromptDialog = showPromptDialog;
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

    // ─── Global Double-Submit Prevention ────────────────────────────────────
    // Runs in CAPTURE phase (before any handler) so it covers ALL forms in the
    // entire admin panel — apartments, services, offers, news, students, etc.
    document.addEventListener('submit', (e) => {
        const form = e.target;
        const btn  = form.querySelector('[type="submit"]:not([data-no-lock])');
        if (!btn || btn.dataset.loading === 'true') return;

        const origHTML    = btn.innerHTML;
        const origDisabled = btn.disabled;

        btn.dataset.loading  = 'true';
        btn.disabled         = true;
        btn.style.opacity    = '0.65';
        btn.style.cursor     = 'wait';

        // Safety unlock after 15 s in case the handler never re-enables it
        const unlock = () => {
            btn.dataset.loading = '';
            btn.disabled        = origDisabled;
            btn.innerHTML       = origHTML;
            btn.style.opacity   = '';
            btn.style.cursor    = '';
        };
        const safetyTimer = setTimeout(unlock, 15000);

        // Unlock when the modal containing this form closes, or on form reset
        const observer = new MutationObserver(() => {
            const modal = form.closest('.modal-overlay');
            if (modal && !modal.classList.contains('active')) {
                clearTimeout(safetyTimer);
                unlock();
                observer.disconnect();
            }
        });
        const modal = form.closest('.modal-overlay');
        if (modal) observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

    }, true); // ← capture phase

    // ─── Global Inline-Button Lock ───────────────────────────────────────────
    // Covers delete / approve / reject / block buttons (not inside forms)
    // that call window functions via onclick or event listeners.
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button:not([type="submit"]):not([data-no-lock]):not([data-action])');
        if (!btn) return;
        // Only protect buttons that look like action buttons (have onclick or are inside a td/action area)
        const hasOnclick = btn.hasAttribute('onclick') || btn.closest('td') || btn.closest('.card-actions') || btn.closest('[class*="action"]');
        if (!hasOnclick) return;
        if (btn.dataset.loading === 'true') {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        btn.dataset.loading = 'true';
        btn.style.opacity   = '0.5';
        btn.style.cursor    = 'wait';
        // Re-enable after 8 s (confirm dialogs / API should be done by then)
        setTimeout(() => {
            btn.dataset.loading = '';
            btn.style.opacity   = '';
            btn.style.cursor    = '';
        }, 8000);
    }, true); // ← capture phase
    // ────────────────────────────────────────────────────────────────────────

    // Check login and load data; start polling every 4 seconds
    const isAuthed = await checkAuth();

    // Remove the loading overlay now that auth state is known
    const authOverlay = document.getElementById('authLoadingOverlay');
    if (authOverlay) authOverlay.remove();

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
