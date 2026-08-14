import { populateAptUniversitiesCheckboxes } from './modules/universities.js';
import { populateAptLocationSelect } from './modules/districts.js';

let toastTimer = null;

/**
 * withLoading(triggerEl, asyncFn)
 * Disables a button/submit-element while an async operation runs.
 * Prevents double-clicks/submissions on slow networks.
 */
export async function withLoading(triggerEl, asyncFn) {
    if (!triggerEl || triggerEl.dataset.loading === 'true') return;
    const origText    = triggerEl.innerHTML;
    const origDisabled = triggerEl.disabled;
    triggerEl.dataset.loading = 'true';
    triggerEl.disabled = true;
    triggerEl.style.opacity = '0.65';
    triggerEl.style.cursor  = 'wait';
    try {
        await asyncFn();
    } finally {
        triggerEl.dataset.loading = '';
        triggerEl.disabled = origDisabled;
        triggerEl.innerHTML = origText;
        triggerEl.style.opacity = '';
        triggerEl.style.cursor  = '';
    }
}


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

export function showConfirmDialog({ title, message, confirmText, cancelText, variant = 'primary' }) {
    if (!confirmText) confirmText = window.t('dialog.confirm_ok');
    if (!cancelText) cancelText = window.t('dialog.confirm_cancel');
    return new Promise((resolve) => {
        const triggeringElement = document.activeElement;

        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'confirmDialogOverlay';
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '2100'; // above normal modals

        // Pick icon and colors based on variant
        let iconClass = 'fa-solid fa-triangle-exclamation';
        let iconColor = 'var(--accent-amber)';
        let confirmBtnStyle = 'background: var(--primary); color: white; border: none;';
        
        if (variant === 'danger') {
            iconClass = 'fa-solid fa-trash-can';
            iconColor = '#ef4444';
            confirmBtnStyle = 'background: #ef4444; color: white; border: none;';
        } else if (variant === 'success') {
            iconClass = 'fa-solid fa-circle-check';
            iconColor = 'var(--accent-green)';
            confirmBtnStyle = 'background: var(--accent-green); color: white; border: none;';
        } else if (variant === 'warning') {
            iconClass = 'fa-solid fa-circle-exclamation';
            iconColor = 'var(--accent-amber)';
            confirmBtnStyle = 'background: var(--accent-amber); color: var(--bg-sidebar); border: none; font-weight: bold;';
        }

        const isEn = localStorage.getItem('admin_lang') === 'en';
        const dir = isEn ? 'ltr' : 'rtl';
        const textAlign = isEn ? 'left' : 'right';
        const flexAlign = isEn ? 'row-reverse' : 'row'; // buttons order: cancel, confirm

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 460px; transform: scale(0.95); transition: transform 0.2s ease; border-radius: 20px;">
                <div class="modal-header" style="direction: ${dir}; border-bottom: 1px solid var(--border-color); padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; color: var(--text-main); font-weight: 700;">
                        <i class="${iconClass}" style="color: ${iconColor}; font-size: 1.3rem;"></i>
                        <span>${title}</span>
                    </h3>
                    <button class="close-btn" style="background: none; border: none; color: var(--text-muted); font-size: 1.3rem; cursor: pointer;" title="${window.t('buttons.close')}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding: 1.5rem; direction: ${dir}; text-align: ${textAlign}; color: var(--text-main); font-size: 0.95rem; line-height: 1.6;">
                    <p style="margin: 0;">${message}</p>
                </div>
                <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; direction: ${dir}; flex-direction: ${flexAlign}; background: rgba(0,0,0,0.15); border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                    <button class="btn btn-secondary confirm-cancel" style="padding: 0.6rem 1.2rem; border-radius: 10px; font-size: 0.85rem; font-weight: 700;">${cancelText}</button>
                    <button class="btn confirm-ok" style="${confirmBtnStyle} padding: 0.6rem 1.2rem; border-radius: 10px; font-size: 0.85rem; font-weight: 700;">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Force reflow
        overlay.offsetHeight;
        overlay.classList.add('active');
        const box = overlay.querySelector('.modal-box');
        if (box) box.style.transform = 'scale(1)';

        const confirmBtn = overlay.querySelector('.confirm-ok');
        const cancelBtn = overlay.querySelector('.confirm-cancel');
        const closeBtn = overlay.querySelector('.close-btn');

        let resolved = false;

        const handleClose = (result) => {
            if (resolved) return;
            resolved = true;
            
            // Disable buttons immediately to prevent duplicate clicks
            confirmBtn.disabled = true;
            cancelBtn.disabled = true;
            if (closeBtn) closeBtn.disabled = true;
            
            // Animate exit
            overlay.classList.remove('active');
            if (box) box.style.transform = 'scale(0.95)';
            
            // Clean up elements after transition
            setTimeout(() => {
                overlay.remove();
                document.removeEventListener('keydown', handleKeyDown);
                
                // Restore focus
                if (triggeringElement && typeof triggeringElement.focus === 'function') {
                    triggeringElement.focus();
                }
                
                resolve(result);
            }, 200);
        };

        confirmBtn.addEventListener('click', () => {
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + window.t('buttons.saving');
            handleClose(true);
        });

        cancelBtn.addEventListener('click', () => handleClose(false));
        if (closeBtn) closeBtn.addEventListener('click', () => handleClose(false));

        // Close on clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                handleClose(false);
            }
        });

        // Close on Escape, confirm on Enter
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose(false);
            } else if (e.key === 'Enter') {
                if (document.activeElement === cancelBtn || document.activeElement === closeBtn) {
                    return;
                }
                e.preventDefault();
                confirmBtn.click();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Initial focus on Cancel button
        setTimeout(() => {
            if (cancelBtn) cancelBtn.focus();
        }, 50);
    });
}

export function showPromptDialog({ title, message, defaultValue = '', placeholder = '' }) {
    return new Promise((resolve) => {
        const triggeringElement = document.activeElement;

        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'promptDialogOverlay';
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '2100'; // above normal modals

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 460px; transform: scale(0.95); transition: transform 0.2s ease; border-radius: 20px;">
                <div class="modal-header" style="direction: rtl; border-bottom: 1px solid var(--border-color); padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; color: var(--text-main); font-weight: 700;">
                        <i class="fa-solid fa-pen-to-square" style="color: var(--primary); font-size: 1.3rem;"></i>
                        <span>${title}</span>
                    </h3>
                    <button class="close-btn" style="background: none; border: none; color: var(--text-muted); font-size: 1.3rem; cursor: pointer;" title="${window.t('buttons.close')}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding: 1.5rem; direction: rtl; text-align: right; color: var(--text-main); font-size: 0.95rem; display: flex; flex-direction: column; gap: 10px;">
                    <label style="margin: 0; font-weight: 600;">${message}</label>
                    <input type="text" id="promptDialogInput" style="width: 100%; padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-main); font-size: 0.95rem; box-sizing: border-box;">
                </div>
                <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; direction: rtl; background: rgba(0,0,0,0.15); border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                    <button class="btn btn-secondary prompt-cancel" style="padding: 0.6rem 1.2rem; border-radius: 10px; font-size: 0.85rem; font-weight: 700;">${window.t('buttons.cancel')}</button>
                    <button class="btn prompt-ok" style="background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 10px; font-size: 0.85rem; font-weight: 700;">${window.t('dialog.confirm_ok')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Force reflow
        overlay.offsetHeight;
        overlay.classList.add('active');
        const box = overlay.querySelector('.modal-box');
        if (box) box.style.transform = 'scale(1)';

        const inputEl = overlay.querySelector('#promptDialogInput');
        const confirmBtn = overlay.querySelector('.prompt-ok');
        const cancelBtn = overlay.querySelector('.prompt-cancel');
        const closeBtn = overlay.querySelector('.close-btn');

        // Set default value and placeholder
        if (inputEl) {
            inputEl.value = defaultValue;
            inputEl.placeholder = placeholder;
        }

        let resolved = false;

        const handleClose = (resultValue) => {
            if (resolved) return;
            resolved = true;
            
            // Disable inputs immediately to prevent duplicate submissions
            confirmBtn.disabled = true;
            cancelBtn.disabled = true;
            if (closeBtn) closeBtn.disabled = true;
            if (inputEl) inputEl.disabled = true;
            
            // Animate exit
            overlay.classList.remove('active');
            if (box) box.style.transform = 'scale(0.95)';
            
            // Clean up elements after transition
            setTimeout(() => {
                overlay.remove();
                document.removeEventListener('keydown', handleKeyDown);
                
                // Restore focus
                if (triggeringElement && typeof triggeringElement.focus === 'function') {
                    triggeringElement.focus();
                }
                
                resolve(resultValue);
            }, 200);
        };

        confirmBtn.addEventListener('click', () => {
            handleClose(inputEl.value);
        });

        cancelBtn.addEventListener('click', () => handleClose(null));
        if (closeBtn) closeBtn.addEventListener('click', () => handleClose(null));

        // Close on clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                handleClose(null);
            }
        });

        // Close on Escape, confirm on Enter
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                confirmBtn.click();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Initial focus and selection on input field
        setTimeout(() => {
            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            }
        }, 50);
    });
}
