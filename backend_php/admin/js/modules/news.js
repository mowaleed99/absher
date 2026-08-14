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
        container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">${window.t('messages.no_news_published')} </td></tr>`;
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
                ` : `<span style="color: var(--text-muted); font-size: 0.8rem;">${window.t('messages.no_image')}</span>`}
            </td>
            <td style="font-weight: bold; color: var(--accent-amber);">${item.title}</td>
            <td style="max-width: 400px; white-space: normal; word-break: break-word; line-height: 1.5; color: var(--text-muted); font-size: 0.9rem;">${item.content}</td>
            <td>${item.date || item.created_at || window.t('status.now')}</td>
            <td>
                <button class="btn" style="background: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid #60a5fa; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-left: 5px;"
                        onclick="window.openEditNewsModalGlobal && window.openEditNewsModalGlobal(${item.id})">
                    <i class="fa-solid fa-pen-to-square"></i> ${window.t('buttons.edit', 'تعديل')}
                </button>
                <button class="btn" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer;"
                        onclick="window.handleDeleteNewsGlobal && window.handleDeleteNewsGlobal(${item.id})">
                    <i class="fa-solid fa-trash-can"></i> ${window.t('buttons.delete')}
                </button>
            </td>
        </tr>
    `).join('');
}

export async function handleAddNews(e) {
    e.preventDefault();
    const titleAr = document.getElementById('newsTitleAr').value.trim();
    const titleEn = document.getElementById('newsTitleEn').value.trim();
    const contentAr = document.getElementById('newsContentAr').value.trim();
    const contentEn = document.getElementById('newsContentEn').value.trim();
    const imageUrl = document.getElementById('newsImage')?.value?.trim() || '';

    if (!titleAr || !contentAr) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: titleAr, title_ar: titleAr, title_en: titleEn,
                content: contentAr, content_ar: contentAr, content_en: contentEn,
                image_url: imageUrl
            })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('newsModal');
            resetNewsForm();
            showToast(result.message || window.t('messages.news_added'));
        } else {
            showToast(window.t('status.error') + ': ' + (result.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast(window.t('messages.conn_error'));
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
        title: window.t('dialog.delete_news_title'),
        message: window.t('dialog.delete_news_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
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
            showToast(result.message || window.t('messages.news_deleted'));
        } else {
            showToast(window.t('status.error') + ': ' + (result.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast(window.t('messages.conn_error'));
    }
}

export function initNewsModule() {
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', handleAddNews);
    }
    const editNewsForm = document.getElementById('editNewsForm');
    if (editNewsForm) {
        editNewsForm.addEventListener('submit', handleUpdateNews);
    }
    window.handleDeleteNewsGlobal = handleDeleteNews;
    window.openEditNewsModalGlobal = openEditNewsModal;

    // Reset form when the modal is explicitly closed (X button or Cancel)
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-action="closeModal"][data-modal="newsModal"]');
        if (closeBtn) resetNewsForm();
    });
}

export function openEditNewsModal(id) {
    const news = appData.news.find(n => String(n.id) === String(id));
    if (!news) return;
    
    document.getElementById('editNewsId').value = news.id;
    document.getElementById('editNewsTitleAr').value = news.title_ar || news.title || '';
    document.getElementById('editNewsTitleEn').value = news.title_en || '';
    document.getElementById('editNewsContentAr').value = news.content_ar || news.content || '';
    document.getElementById('editNewsContentEn').value = news.content_en || '';
    
    document.getElementById('editNewsImage').value = news.image || '';
    const preview = document.getElementById('editNewsImgPreview');
    if (news.image) {
        preview.src = news.image;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
    
    if (window.openModalGlobal) window.openModalGlobal('editNewsModal');
}

export async function handleUpdateNews(e) {
    e.preventDefault();
    const id = document.getElementById('editNewsId').value;
    const titleAr = document.getElementById('editNewsTitleAr').value.trim();
    const titleEn = document.getElementById('editNewsTitleEn').value.trim();
    const contentAr = document.getElementById('editNewsContentAr').value.trim();
    const contentEn = document.getElementById('editNewsContentEn').value.trim();
    const image = document.getElementById('editNewsImage').value.trim();

    if (!titleAr || !contentAr) {
        showToast(window.t('messages.fill_required'));
        return;
    }

    const payload = {
        id: parseInt(id, 10),
        title: titleAr,
        title_ar: titleAr,
        title_en: titleEn,
        content: contentAr,
        content_ar: contentAr,
        content_en: contentEn,
        image: image || null
    };

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=update_news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('editNewsModal');
            showToast(window.t('messages.news_added', 'تم تحديث الخبر بنجاح'));
        } else {
            showToast(data.message || 'خطأ في التحديث');
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}
