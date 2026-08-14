import { appData } from '../state.js';
import { showToast, resolveImgUrl } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;

    container.innerHTML = appData.services.map(svc => `
        <div class="item-card">
            <div class="card-img-wrap" style="height:140px; background: #1f2937;">
                <img src="${resolveImgUrl(svc.image_url)}"
                     onerror="this.style.display='none'"
                     alt="Service"
                     style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="card-body">
                <h3 class="card-title">${svc.title}</h3>
                <p class="card-desc" style="margin-bottom:0.5rem;">${svc.description}</p>
                <div style="margin-bottom:0.6rem;"><strong style="color:var(--accent-amber); font-size:0.9rem;">${window.t('services.price_label')}: ${svc.price_points !== undefined ? svc.price_points : 0} ${window.t('services.points_unit')}</strong></div>
                ${(svc.has_form == 1 || svc.has_form === undefined || svc.has_form === true) ? `<div style="margin-bottom:0.8rem;"><span style="background: rgba(37,211,102,0.15); color: #25D366; border: 1px solid #25D366; padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: bold;"> ${window.t('services.has_form_badge')}</span></div>` : ''}
                <div class="card-actions">
                    <button class="btn btn-primary" style="background: rgba(99,102,241,0.2); border: 1px solid #6366f1; color: #a5b4fc;"
                            onclick="window.openEditServiceModalGlobal && window.openEditServiceModalGlobal(${svc.id})">
                        <i class="fa-solid fa-pen-to-square"></i> ${window.t('buttons.edit')}
                    </button>
                    <button class="btn btn-danger" onclick="window.deleteServiceGlobal && window.deleteServiceGlobal(${svc.id})"><i class="fa-solid fa-trash"></i> ${window.t('buttons.delete')}</button>
                    <span style="font-size:0.8rem; color:var(--accent-blue); align-self:center;">${window.t('services.available_badge')} </span>
                </div>
            </div>
        </div>
    `).join('');
}

export async function handleAddService(e) {
    e.preventDefault();
    const hasForm = document.getElementById('svcHasForm')?.checked ? 1 : 0;
    const rawImg = document.getElementById('svcImg').value;
    const pricePointsVal = document.getElementById('svcPricePoints').value;

    if (!/^\d+$/.test(pricePointsVal)) {
        showToast(window.t('validation.service_price_positive'));
        return;
    }

    const newSvc = {
        title: document.getElementById('svcTitleAr').value.trim(),
        title_ar: document.getElementById('svcTitleAr').value.trim(),
        title_en: document.getElementById('svcTitleEn').value.trim(),
        description: document.getElementById('svcDescAr').value.trim(),
        description_ar: document.getElementById('svcDescAr').value.trim(),
        description_en: document.getElementById('svcDescEn').value.trim(),
        image_url: rawImg && rawImg.trim() !== '' ? rawImg : '',
        has_form: hasForm,
        price_points: parseInt(pricePointsVal, 10)
    };

    if (!newSvc.title) {
        showToast(window.t('validation.service_name_required'));
        return;
    }

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSvc)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('svcModal');
            document.getElementById('svcForm').reset();
            document.getElementById('svcImg').value = '';
            const prev = document.getElementById('svcImgPreview');
            if (prev) prev.style.display = 'none';
            showToast(window.t('messages.service_added'));
        } else {
            showToast(window.t('messages.failed_add_service') + ': ' + (data.message || window.t('messages.error_occurred')));
        }
    } catch (err) {
        showToast(window.t('messages.service_conn_error'));
        console.error('Error adding service:', err);
    }
}

export function openEditServiceModal(svcId) {
    const svc = appData.services.find(s => s.id === svcId || s.id === String(svcId));
    if (!svc) {
        showToast(window.t('validation.service_not_found'));
        return;
    }

    document.getElementById('editSvcId').value = svc.id;
    document.getElementById('editSvcTitleAr').value = svc.title_ar || svc.title || '';
    document.getElementById('editSvcTitleEn').value = svc.title_en || '';
    document.getElementById('editSvcDescAr').value = svc.description_ar || svc.description || '';
    document.getElementById('editSvcDescEn').value = svc.description_en || '';
    document.getElementById('editSvcPricePoints').value = svc.price_points !== undefined ? svc.price_points : 0;

    // Set hidden field to existing URL (will be overwritten if user uploads a new image)
    const hiddenImg = document.getElementById('editSvcImg');
    if (hiddenImg) hiddenImg.value = svc.image_url || '';

    // Show existing image in preview
    const prev = document.getElementById('editSvcImgPreview');
    if (prev) {
        if (svc.image_url) {
            prev.src = resolveImgUrl(svc.image_url);
            prev.style.display = 'block';
        } else {
            prev.style.display = 'none';
        }
    }

    // Reset file input
    const fileInput = document.getElementById('editSvcFileInput');
    if (fileInput) fileInput.value = '';

    const hasFormCheckbox = document.getElementById('editSvcHasForm');
    if (hasFormCheckbox) {
        hasFormCheckbox.checked = (svc.has_form == 1 || svc.has_form === true);
    }

    window.openModalGlobal && window.openModalGlobal('editSvcModal');
}

export async function handleUpdateService(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editSvcId').value, 10);
    if (!id) { showToast(window.t('validation.service_id_missing')); return; }

    const pricePointsVal = document.getElementById('editSvcPricePoints').value;
    if (!/^\d+$/.test(pricePointsVal)) {
        showToast(window.t('validation.service_price_positive'));
        return;
    }

    // image_url: read from hidden field (set by upload pipeline or pre-loaded existing URL)
    const imageUrl = document.getElementById('editSvcImg')?.value || '';

    const payload = {
        id,
        title: document.getElementById('editSvcTitleAr').value.trim(),
        title_ar: document.getElementById('editSvcTitleAr').value.trim(),
        title_en: document.getElementById('editSvcTitleEn').value.trim(),
        description: document.getElementById('editSvcDescAr').value.trim(),
        description_ar: document.getElementById('editSvcDescAr').value.trim(),
        description_en: document.getElementById('editSvcDescEn').value.trim(),
        image_url: imageUrl,
        has_form: document.getElementById('editSvcHasForm')?.checked ? 1 : 0,
        price_points: parseInt(pricePointsVal, 10)
    };

    if (!payload.title) { showToast(window.t('validation.service_name_required')); return; }

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=update_service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('editSvcModal');
            showToast(window.t('messages.service_updated'));
        } else {
            showToast(window.t('messages.service_update_failed') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function deleteService(id) {
    const confirmed = await window.showConfirmDialog({
        title: window.t('dialog.delete_service_title'),
        message: window.t('dialog.delete_service_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.service_deleted'));
        } else {
            showToast(window.t('messages.service_delete_failed') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function initServicesModule() {
    const svcForm = document.getElementById('svcForm');
    if (svcForm) {
        svcForm.addEventListener('submit', handleAddService);
    }

    const editSvcForm = document.getElementById('editSvcForm');
    if (editSvcForm) {
        editSvcForm.addEventListener('submit', handleUpdateService);
    }

    window.deleteServiceGlobal = deleteService;
    window.openEditServiceModalGlobal = openEditServiceModal;
}
