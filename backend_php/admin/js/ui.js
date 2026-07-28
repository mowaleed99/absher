import { populateAptUniversitiesCheckboxes } from './modules/universities.js';
import { populateAptLocationSelect } from './modules/districts.js';

let toastTimer = null;

export function showToast(msg, durationMs = 3500) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast hidden';
        document.body.appendChild(t);
    }
    t.innerText = msg;
    t.classList.remove('hidden');

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        t.classList.add('hidden');
        toastTimer = null;
    }, durationMs);
}

export function formatChatMediaUrl(url) {
    if (!url) return'';
    if (url.startsWith('uploads/')) return'../'+ url;
    return url;
}

export function isEmbeddableVideo(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('drive.google.com');
}

export function getEmbedUrl(url) {
    if (!url) return'';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId ='';
        if (url.includes('v=')) {
            const parts = url.split('v=');
            if (parts.length > 1) videoId = parts[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            const parts = url.split('youtu.be/');
            if (parts.length > 1) videoId = parts[1].split('?')[0];
        } else if (url.includes('embed/')) {
            const parts = url.split('embed/');
            if (parts.length > 1) videoId = parts[1].split('?')[0];
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('drive.google.com')) {
        let driveId ='';
        if (url.includes('/d/')) {
            const parts = url.split('/d/');
            if (parts.length > 1) driveId = parts[1].split('/')[0];
        } else if (url.includes('id=')) {
            const parts = url.split('id=');
            if (parts.length > 1) driveId = parts[1].split('&')[0];
        }
        if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    return url;
}

export function initThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const icon = btn.querySelector('i');
            if (document.body.classList.contains('light-mode')) {
                icon.className ='fa-solid fa-sun';
            } else {
                icon.className ='fa-solid fa-moon';
            }
        });
    }
}

export function resolveImgUrl(url) {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;

    // Normalize slashes
    let clean = url.replace(/\\/g, '/').replace(/^\/+/, '');

    if (clean.startsWith('uploads/')) return '../' + clean;

    // assets/ paths are Flutter-bundle-only — not served by the web server.
    // Return empty so the <img onerror> hides the broken image.
    if (clean.startsWith('assets/')) return '';

    // Default: assume it's a relative upload file path
    return '../uploads/' + clean;
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        resetFormByModalId(modalId);
    }
}

export function resetFormByModalId(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }

    // Modal-specific extra resets (previews, file inputs, hidden inputs, checkboxes, dynamic display)
    if (modalId === 'aptModal') {
        const previews = document.getElementById('aptImgPreviewsContainer');
        if (previews) previews.innerHTML = '';
        const hiddenImg = document.getElementById('aptImage');
        if (hiddenImg) hiddenImg.value = '';
        const fileInput = document.getElementById('aptFileInput');
        if (fileInput) fileInput.value = '';

        // Hide roommate section
        const roommateSec = document.getElementById('roommateSection');
        if (roommateSec) roommateSec.style.display = 'none';

        // Uncheck all university checkboxes and hide time inputs
        const checkboxes = modal.querySelectorAll('.uni-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
            const timeId = cb.getAttribute('data-id');
            const timeInput = document.getElementById(`uni_time_${timeId}`);
            if (timeInput) {
                timeInput.style.display = 'none';
                timeInput.value = '';
            }
        });
    } else if (modalId === 'svcModal') {
        const prev = document.getElementById('svcImgPreview');
        if (prev) { prev.src = ''; prev.style.display = 'none'; }
        const hiddenImg = document.getElementById('svcImg');
        if (hiddenImg) hiddenImg.value = '';
        const fileInput = document.getElementById('svcFileInput');
        if (fileInput) fileInput.value = '';
    } else if (modalId === 'newsModal') {
        const prev = document.getElementById('newsImgPreview');
        if (prev) { prev.src = ''; prev.style.display = 'none'; }
        const hiddenImg = document.getElementById('newsImage');
        if (hiddenImg) hiddenImg.value = '';
        const fileInput = document.getElementById('newsFileInput');
        if (fileInput) fileInput.value = '';
    }
}


export function initModalDelegation() {
    document.body.addEventListener('click', (e) => {
        const openBtn = e.target.closest('[data-action="openModal"]');
        if (openBtn) {
            const modalId = openBtn.getAttribute('data-modal');
            if (modalId === 'aptModal') {
                populateAptUniversitiesCheckboxes();
                populateAptLocationSelect();
            }
            openModal(modalId);
            return;
        }

        const closeBtn = e.target.closest('[data-action="closeModal"]');
        if (closeBtn) {
            const modalId = closeBtn.getAttribute('data-modal');
            closeModal(modalId);
        }
    });
}
