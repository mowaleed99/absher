import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

function resolveImgUrl(url) {
    if (!url) return '';
    if (url.startsWith('uploads/')) return '../' + url;
    if (url.startsWith('assets/')) return '../../' + url;
    return url;
}

export function renderNews() {
    const container = document.getElementById('newsTableBody');
    if (!container) return;

    if (!appData.news || appData.news.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">لا يوجد أخبار أو تنبيهات منشورة حالياً </td></tr>`;
        return;
    }

    const sorted = [...appData.news].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
        return timeB - timeA;
    });

    container.innerHTML = sorted.map((item, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>
                ${resolveImgUrl(item.image_url) ? `
                    <img src="${resolveImgUrl(item.image_url)}"
                         onerror="this.style.display='none'"
                         style="width: 60px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);">
                ` : `<span style="color: var(--text-muted); font-size: 0.8rem;">لا توجد صورة</span>`}
            </td>
            <td style="font-weight: bold; color: var(--accent-amber);">${item.title}</td>
            <td style="max-width: 400px; white-space: normal; word-break: break-word; line-height: 1.5; color: var(--text-muted); font-size: 0.9rem;">${item.content}</td>
            <td>${item.date || item.created_at || 'الآن'}</td>
            <td>
                <button class="btn" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer;"
                        onclick="window.handleDeleteNewsGlobal && window.handleDeleteNewsGlobal(${item.id})">
                    <i class="fa-solid fa-trash-can"></i> حذف
                </button>
            </td>
        </tr>
    `).join('');
}

export async function handleAddNews(e) {
    e.preventDefault();
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const imageUrl = document.getElementById('newsImage')?.value?.trim() || '';

    if (!title || !content) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, image_url: imageUrl })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('newsModal');
            resetNewsForm();
            showToast(result.message || 'تم نشر الخبر بنجاح!');
        } else {
            showToast('خطأ: ' + (result.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast('خطأ في الاتصال بالخادم');
    }
}

function resetNewsForm() {
    const form = document.getElementById('newsForm');
    if (form) form.reset();
    // Reset any image preview
    const prev = document.getElementById('newsImgPreview');
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
    const hiddenImg = document.getElementById('newsImage');
    if (hiddenImg) hiddenImg.value = '';
}

export async function handleDeleteNews(id) {
    const confirmed = await window.showConfirmDialog({
        title: 'تأكيد حذف الخبر',
        message: 'هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً؟',
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            showToast(result.message || 'تم حذف الخبر بنجاح ️');
        } else {
            showToast('خطأ: ' + (result.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast('خطأ في الاتصال بالخادم');
    }
}

export function initNewsModule() {
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', handleAddNews);
    }
    window.handleDeleteNewsGlobal = handleDeleteNews;

    // Reset form when the modal is explicitly closed (X button or Cancel)
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-action="closeModal"][data-modal="newsModal"]');
        if (closeBtn) resetNewsForm();
    });
}
