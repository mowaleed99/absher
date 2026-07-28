import os

with open('backend_php/admin/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Define the chunks based on known line numbers or regex
chunks = {
    'state.js': r"(const API_URL.*?)async function checkAuth",
    'auth.js': r"(async function checkAuth.*?)function formatChatMediaUrl",
    'ui.js': r"(function formatChatMediaUrl.*?)let appData =",
    'app.js_init': r"(let appData =.*?)function initNavigation",
    'router.js': r"(function initNavigation.*?)function initThemeToggle",
    'ui_theme.js': r"(function initThemeToggle.*?)async function loadDashboardData",
    'api.js': r"(async function loadDashboardData.*?)function resolveImgUrl",
    'ui_helpers.js': r"(function resolveImgUrl.*?)function renderStats",
    'modules/dashboard.js': r"(function renderStats.*?)function renderApartments",
    'modules/apartments.js': r"(function renderApartments.*?)function renderServices",
    'modules/services.js': r"(function renderServices.*?)function renderRequests",
    # ... this is too manual and error prone.
}
