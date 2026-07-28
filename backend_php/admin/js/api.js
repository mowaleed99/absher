import { appData, API_URL } from './state.js';
import { showToast } from './ui.js';
import { renderStats } from './modules/dashboard.js';
import { renderApartments } from './modules/apartments.js';
import { renderServices } from './modules/services.js';
import { renderUniversities, populateAptUniversitiesCheckboxes } from './modules/universities.js';
import { renderDistricts, populateAptLocationSelect } from './modules/districts.js';
import { renderRequests } from './modules/requests.js';
import { renderStudents } from './modules/students.js';
import { renderChats } from './modules/chats.js';
import { renderReviews } from './modules/reviews.js';
import { renderNews } from './modules/news.js';
import { renderNotifications } from './modules/notifications.js';
import { renderOffers, populateOfferApartmentsDropdown } from './modules/offers.js';
import { renderFeedback } from './modules/feedback.js';

function renderAll() {
    renderStats();
    renderApartments();
    renderServices();
    renderUniversities();
    renderDistricts();
    renderRequests();
    renderStudents();
    renderChats();
    renderReviews();
    renderFeedback();
    renderNews();
    renderNotifications();

    renderOffers();

    // Populate dynamic modal dropdowns after data reload
    populateAptUniversitiesCheckboxes();
    populateAptLocationSelect();
    populateOfferApartmentsDropdown();
}

export async function loadDashboardData() {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const res = await window.authFetch(API_URL + '?action=get_all');
        if (!res) return;
        const result = await res.json();

        if (result.status === 'success') {
            // Mutate appData properties in-place so all module imports see updated data
            appData.apartments     = result.apartments     || [];
            appData.services       = result.services       || [];
            appData.students       = result.students       || [];
            appData.requests       = result.requests       || [];
            appData.reviews        = result.reviews        || [];
            appData.chats          = result.chats          || [];
            appData.news           = result.news           || [];
            appData.notifications  = result.notifications  || [];
            appData.universities   = result.universities   || [];
            appData.districts      = result.districts      || [];
            appData.housing_offers = result.housing_offers || [];
            appData.application_feedback = result.application_feedback || [];

            const statusEl = document.getElementById('serverStatus');
            if (statusEl) {
                statusEl.textContent = 'متصل (قاعدة البيانات المباشرة MySQL)';
                statusEl.className = 'status-online';
            }
        } else {
            const statusEl = document.getElementById('serverStatus');
            if (statusEl) {
                statusEl.textContent = 'خطأ في استجابة الخادم';
                statusEl.className = 'status-offline';
            }
        }
    } catch (err) {
        console.error('loadDashboardData error:', err);
        const statusEl = document.getElementById('serverStatus');
        if (statusEl) {
            statusEl.textContent = 'غير متصل';
            statusEl.className = 'status-offline';
        }
    }

    renderAll();
}
