

// Navigation & Tabs
const ALLOWED_TABS = ['stats', 'chats', 'requests', 'apartments', 'services', 'universities', 'districts', 'reviews', 'students', 'news', 'notifications', 'offers', 'feedback'];

export function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            if (window.location.hash !== `#${tabId}`) {
                window.location.hash = tabId;
            } else {
                switchTab(tabId); // in case we're already there but want to force refresh UI
            }
        });
    });

    window.addEventListener('hashchange', () => {
        let hashTab = window.location.hash.replace('#', '');
        if (!ALLOWED_TABS.includes(hashTab)) {
            hashTab = 'stats';
        }
        switchTab(hashTab);
    });

    // Handle initial load
    let initialTab = window.location.hash.replace('#', '');
    if (!ALLOWED_TABS.includes(initialTab)) {
        initialTab = 'stats';
    }
    switchTab(initialTab);
}

export function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const activePane = document.getElementById(`tab-${tabId}`);

    if (activeNav) activeNav.classList.add('active');
    if (activePane) activePane.classList.add('active');
}

// Theme Toggle
