import { appData } from '../state.js';
import { showToast, resolveImgUrl } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function getOfferStatus(ho) {
    if (parseInt(ho.is_active) !== 1) return 'disabled';
    const now = new Date();
    if (ho.starts_at && new Date(ho.starts_at) > now) return 'scheduled';
    if (ho.expires_at && new Date(ho.expires_at) <= now) return 'expired';
    return 'active';
}

export function renderOffers() {
    const container = document.getElementById('offersList');
    if (!container) return;

    const searchVal = (document.getElementById('offerSearchInput')?.value || '').trim().toLowerCase();

    // Sort offers by display_order
    const sortedOffers = [...(appData.housing_offers || [])].sort((a, b) => parseInt(a.display_order) - parseInt(b.display_order));

    const filtered = sortedOffers.filter(ho => {
        const apt = appData.apartments.find(a => a.id === parseInt(ho.apartment_id) || a.id === String(ho.apartment_id));
        const aptTitle = apt ? (apt.title || '').toLowerCase() : '';
        const titleMatch = (ho.title || '').toLowerCase().includes(searchVal);
        const descMatch = (ho.description || '').toLowerCase().includes(searchVal);
        const aptMatch = aptTitle.includes(searchVal) || ho.apartment_id.toString() === searchVal;
        return !searchVal || titleMatch || descMatch || aptMatch;
    });

    const statusLabels = {
        active: window.t('offers.status.active'),
        scheduled: window.t('offers.status.scheduled'),
        expired: window.t('offers.status.expired'),
        disabled: window.t('offers.status.disabled')
    };

    const statusColors = {
        active: '#25D366',
        scheduled: '#38bdf8',
        expired: '#ef4444',
        disabled: '#9ca3af'
    };

    const statusBg = {
        active: 'rgba(37, 211, 102, 0.15)',
        scheduled: 'rgba(56, 189, 248, 0.15)',
        expired: 'rgba(239, 68, 68, 0.15)',
        disabled: 'rgba(156, 163, 175, 0.15)'
    };

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-tags" style="font-size: 3rem; margin-bottom: 12px; color: var(--accent-amber);"></i>
                <p>${window.t('offers.no_offers')}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(ho => {
        const status = getOfferStatus(ho);
        const label = statusLabels[status];
        const color = statusColors[status];
        const bg = statusBg[status];

        // Find linked apartment details
        const apt = appData.apartments.find(a => a.id === parseInt(ho.apartment_id) || a.id === String(ho.apartment_id));
        const aptTitle = apt ? apt.title : window.t('offers.unknown_apartment');
        const aptFirstImg = apt && Array.isArray(apt.images) ? apt.images[0] : (apt ? apt.images : '');

        // Resolve display image (fallback to apartment first image if offer image is empty)
        const displayImg = ho.image_url || aptFirstImg;

        // Calculate discount percentage
        const orig = parseFloat(ho.original_price);
        const off = parseFloat(ho.offer_price);
        const discount = orig > 0 ? Math.round(((orig - off) / orig) * 100) : 0;

        return `
        <div class="item-card" data-offer-id="${ho.id}">
            <div class="card-img-wrap" style="height: 140px; background: #1f2937; position: relative;">
                <img src="${resolveImgUrl(displayImg)}"
                     onerror="this.style.display='none'"
                     alt="Offer Image"
                     style="width: 100%; height: 100%; object-fit: cover;">
                <span class="price-tag" style="background: var(--accent-red); font-size: 0.9rem; font-weight: 800;">
                    ${ho.offer_price} $
                </span>
                ${ho.badge_text ? `<span style="position: absolute; top: 10px; right: 10px; background: var(--accent-amber); color: var(--text-dark); padding: 4px 10px; border-radius: 8px; font-weight: bold; font-size: 0.78rem;"><i class="fa-solid fa-fire"></i> ${ho.badge_text}</span>` : ''}
            </div>
            <div class="card-body">
                <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    <span style="background: ${bg}; color: ${color}; border: 1px solid ${color}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">
                        ${label}
                    </span>
                    <span style="background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid #6366f1; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">
                         ${window.t('offers.discount', {percent: discount})}
                    </span>
                </div>
                <h3 class="card-title">${ho.title}</h3>
                <p class="card-loc" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">
                    <i class="fa-solid fa-building" style="color: var(--accent-amber);"></i> ${window.t('offers.apartment_label')}: <strong>#${ho.apartment_id} - ${aptTitle}</strong>
                </p>
                <div style="margin: 6px 0; font-size: 0.85rem; color: var(--text-main);">
                    ${window.t('offers.original_price')}: <span style="text-decoration: lineThrough; color: var(--text-muted);">${ho.original_price} $</span> 
                </div>
                ${ho.starts_at ? `<p style="margin: 4px 0; font-size: 0.78rem; color: var(--text-muted);"><i class="fa-solid fa-calendar-check"></i> ${window.t('offers.starts')}: ${ho.starts_at}</p>` : ''}
                ${ho.expires_at ? `<p style="margin: 4px 0; font-size: 0.78rem; color: var(--text-muted);"><i class="fa-solid fa-calendar-xmark"></i> ${window.t('offers.expires')}: ${ho.expires_at}</p>` : ''}
                <p class="card-desc" style="margin-top: 8px; min-height: 40px;">${ho.description}</p>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${window.t('offers.display_order')}: <strong>${ho.display_order}</strong></span>
                    <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.8rem;" onclick="window.moveOfferGlobal(${ho.id}, 'up')" title="${window.t('offers.move_up')}"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.8rem;" onclick="window.moveOfferGlobal(${ho.id}, 'down')" title="${window.t('offers.move_down')}"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" style="background: rgba(99,102,241,0.2); border: 1px solid #6366f1; color: #a5b4fc;"
                            onclick="window.openEditOfferModalGlobal(${ho.id})">
                        <i class="fa-solid fa-pen-to-square"></i> ${window.t('buttons.edit')}
                    </button>
                    <button class="btn btn-danger" onclick="window.deleteOfferGlobal(${ho.id})"><i class="fa-solid fa-trash"></i> ${window.t('buttons.delete')}</button>
                    <button class="btn" style="background: ${parseInt(ho.is_active) === 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 211, 102, 0.2)'}; border: 1px solid ${parseInt(ho.is_active) === 1 ? '#ef4444' : '#25D366'}; color: ${parseInt(ho.is_active) === 1 ? '#fca5a5' : '#a7f3d0'};"
                            onclick="window.toggleOfferStatusGlobal(${ho.id}, ${parseInt(ho.is_active) === 1 ? 0 : 1})">
                        <i class="fa-solid ${parseInt(ho.is_active) === 1 ? 'fa-toggle-on' : 'fa-toggle-off'}"></i> ${parseInt(ho.is_active) === 1 ? window.t('buttons.disable') : window.t('buttons.enable')}
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

export function populateOfferApartmentsDropdown() {
    const dropdowns = [document.getElementById('offerAptId'), document.getElementById('editOfferAptId')];
    dropdowns.forEach(select => {
        if (!select) return;
        const currentVal = select.value;
        // Filter only available apartments
        const availableApts = (appData.apartments || []).filter(a => parseInt(a.is_available) === 1);
        select.innerHTML = `<option value="">${window.t('offers.select_apartment')}</option>` + availableApts.map(apt => `
            <option value="${apt.id}">#${apt.id} - ${apt.title} (${apt.price})</option>
        `).join('');
        if (currentVal) select.value = currentVal;
    });
}

export async function handleAddOffer(e) {
    e.preventDefault();
    const orig = parseFloat(document.getElementById('offerOriginalPrice')?.value || '0');
    const off = parseFloat(document.getElementById('offerOfferPrice')?.value || '0');
    const starts = document.getElementById('offerStartsAt')?.value || null;
    const expires = document.getElementById('offerExpiresAt')?.value || null;

    // Validate inputs
    if (orig <= 0) { showToast(window.t('validation.original_price_gt_zero')); return; }
    if (off < 0) { showToast(window.t('validation.offer_price_gte_zero')); return; }
    if (off >= orig) { showToast(window.t('validation.offer_price_lt_original')); return; }
    if (starts && expires && new Date(starts) >= new Date(expires)) {
        showToast(window.t('validation.start_before_end'));
        return;
    }

    const payload = {
        apartment_id: parseInt(document.getElementById('offerAptId')?.value || '0', 10),
        title: document.getElementById('offerTitleAr')?.value.trim(),
        title_ar: document.getElementById('offerTitleAr')?.value.trim(),
        title_en: document.getElementById('offerTitleEn')?.value.trim(),
        description: document.getElementById('offerDescAr')?.value.trim(),
        description_ar: document.getElementById('offerDescAr')?.value.trim(),
        description_en: document.getElementById('offerDescEn')?.value.trim(),
        badge_text: document.getElementById('offerBadgeTextAr')?.value.trim() || null,
        badge_text_ar: document.getElementById('offerBadgeTextAr')?.value.trim() || null,
        badge_text_en: document.getElementById('offerBadgeTextEn')?.value.trim() || null,
        original_price: orig,
        offer_price: off,
        image_url: document.getElementById('offerImage')?.value.trim() || null,
        starts_at: starts || null,
        expires_at: expires || null,
        is_active: document.getElementById('offerIsActive')?.checked ? 1 : 0,
        display_order: parseInt(document.getElementById('offerDisplayOrder')?.value || '0', 10)
    };

    if (!payload.apartment_id) { showToast(window.t('validation.select_apartment')); return; }
    if (!payload.title) { showToast(window.t('validation.enter_offer_title')); return; }

    try {
        const res = await window.authFetch('../api/admin_api.php?action=add_housing_offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('offerModal');
            document.getElementById('offerForm').reset();
            // Clear preview
            const prev = document.getElementById('offerImgPreview');
            if (prev) prev.style.display = 'none';
            showToast(window.t('messages.offer_added'));
        } else {
            showToast(window.t('messages.offer_failed_add') + ': ' + (data.message || window.t('messages.error_occurred')));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function openEditOfferModal(offerId) {
    const ho = appData.housing_offers.find(o => o.id === offerId || o.id === String(offerId));
    if (!ho) {
        showToast(window.t('validation.offer_not_found'));
        return;
    }

    document.getElementById('editOfferId').value = ho.id;
    document.getElementById('editOfferAptId').value = ho.apartment_id;
    document.getElementById('editOfferTitleAr').value = ho.title_ar || ho.title || '';
    document.getElementById('editOfferTitleEn').value = ho.title_en || '';
    document.getElementById('editOfferDescAr').value = ho.description_ar || ho.description || '';
    document.getElementById('editOfferDescEn').value = ho.description_en || '';
    document.getElementById('editOfferBadgeTextAr').value = ho.badge_text_ar || ho.badge_text || '';
    document.getElementById('editOfferBadgeTextEn').value = ho.badge_text_en || '';
    document.getElementById('editOfferOriginalPrice').value = ho.original_price || '';
    document.getElementById('editOfferOfferPrice').value = ho.offer_price || '';
    document.getElementById('editOfferStartsAt').value = ho.starts_at ? ho.starts_at.replace(' ', 'T') : '';
    document.getElementById('editOfferExpiresAt').value = ho.expires_at ? ho.expires_at.replace(' ', 'T') : '';
    document.getElementById('editOfferDisplayOrder').value = ho.display_order || 0;
    document.getElementById('editOfferIsActive').checked = parseInt(ho.is_active) === 1;

    const hiddenImg = document.getElementById('editOfferImage');
    if (hiddenImg) hiddenImg.value = ho.image_url || '';

    const prev = document.getElementById('editOfferImgPreview');
    if (prev) {
        if (ho.image_url) {
            prev.src = resolveImgUrl(ho.image_url);
            prev.style.display = 'block';
        } else {
            prev.style.display = 'none';
        }
    }

    // Reset file input
    const fileInput = document.getElementById('editOfferFileInput');
    if (fileInput) fileInput.value = '';

    window.openModalGlobal && window.openModalGlobal('editOfferModal');
}

export async function handleUpdateOffer(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editOfferId')?.value || '0', 10);
    const orig = parseFloat(document.getElementById('editOfferOriginalPrice')?.value || '0');
    const off = parseFloat(document.getElementById('editOfferOfferPrice')?.value || '0');
    const starts = document.getElementById('editOfferStartsAt')?.value || null;
    const expires = document.getElementById('editOfferExpiresAt')?.value || null;

    if (!id) { showToast(window.t('validation.offer_id_missing')); return; }
    if (orig <= 0) { showToast(window.t('validation.original_price_gt_zero')); return; }
    if (off < 0) { showToast(window.t('validation.offer_price_gte_zero')); return; }
    if (off >= orig) { showToast(window.t('validation.offer_price_lt_original')); return; }
    if (starts && expires && new Date(starts) >= new Date(expires)) {
        showToast(window.t('validation.start_before_end'));
        return;
    }

    const payload = {
        id,
        apartment_id: parseInt(document.getElementById('editOfferAptId')?.value || '0', 10),
        title: document.getElementById('editOfferTitleAr')?.value.trim(),
        title_ar: document.getElementById('editOfferTitleAr')?.value.trim(),
        title_en: document.getElementById('editOfferTitleEn')?.value.trim(),
        description: document.getElementById('editOfferDescAr')?.value.trim(),
        description_ar: document.getElementById('editOfferDescAr')?.value.trim(),
        description_en: document.getElementById('editOfferDescEn')?.value.trim(),
        badge_text: document.getElementById('editOfferBadgeTextAr')?.value.trim() || null,
        badge_text_ar: document.getElementById('editOfferBadgeTextAr')?.value.trim() || null,
        badge_text_en: document.getElementById('editOfferBadgeTextEn')?.value.trim() || null,
        original_price: orig,
        offer_price: off,
        image_url: document.getElementById('editOfferImage')?.value.trim() || null,
        starts_at: starts || null,
        expires_at: expires || null,
        is_active: document.getElementById('editOfferIsActive')?.checked ? 1 : 0,
        display_order: parseInt(document.getElementById('editOfferDisplayOrder')?.value || '0', 10)
    };

    if (!payload.apartment_id) { showToast(window.t('validation.select_apartment')); return; }
    if (!payload.title) { showToast(window.t('validation.enter_offer_title')); return; }

    try {
        const res = await window.authFetch('../api/admin_api.php?action=update_housing_offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('editOfferModal');
            showToast(window.t('messages.offer_updated'));
        } else {
            showToast(window.t('messages.offer_failed_update') + ': ' + (data.message || window.t('messages.error_occurred')));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function deleteOffer(id) {
    const confirmed = await window.showConfirmDialog({
        title: window.t('dialog.delete_offer_title'),
        message: window.t('dialog.delete_offer_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch('../api/admin_api.php?action=delete_housing_offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.offer_deleted'));
        } else {
            showToast(window.t('messages.offer_failed_delete') + ': ' + data.message);
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function toggleOfferStatus(id, isActive) {
    const ho = appData.housing_offers.find(o => o.id === id || o.id === String(id));
    if (!ho) return;

    const isActivating = !!isActive;
    const confirmed = await window.showConfirmDialog({
        title: isActivating ? window.t('dialog.enable_offer_title') : window.t('dialog.disable_offer_title'),
        message: isActivating ? window.t('dialog.enable_offer_msg') : window.t('dialog.disable_offer_msg'),
        confirmText: isActivating ? window.t('buttons.enable') : window.t('buttons.disable'),
        cancelText: window.t('buttons.cancel'),
        variant: isActivating ? 'success' : 'warning'
    });
    if (!confirmed) return;

    const payload = {
        id,
        apartment_id: parseInt(ho.apartment_id, 10),
        title: ho.title,
        description: ho.description,
        original_price: parseFloat(ho.original_price),
        offer_price: parseFloat(ho.offer_price),
        badge_text: ho.badge_text,
        image_url: ho.image_url,
        starts_at: ho.starts_at,
        expires_at: ho.expires_at,
        is_active: isActive,
        display_order: parseInt(ho.display_order, 10)
    };

    try {
        const res = await window.authFetch('../api/admin_api.php?action=update_housing_offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(isActivating ? window.t('messages.offer_enabled') : window.t('messages.offer_disabled'));
        } else {
            showToast(window.t('messages.offer_failed_toggle') + ': ' + data.message);
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function moveOffer(offerId, direction) {
    const sorted = [...appData.housing_offers].sort((a, b) => parseInt(a.display_order) - parseInt(b.display_order));
    const idx = sorted.findIndex(o => o.id === offerId || o.id === String(offerId));
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
        const temp = sorted[idx].display_order;
        sorted[idx].display_order = sorted[idx - 1].display_order;
        sorted[idx - 1].display_order = temp;
        if (sorted[idx].display_order === sorted[idx - 1].display_order) {
            sorted[idx].display_order = parseInt(sorted[idx].display_order) + 1;
        }
    } else if (direction === 'down' && idx < sorted.length - 1) {
        const temp = sorted[idx].display_order;
        sorted[idx].display_order = sorted[idx + 1].display_order;
        sorted[idx + 1].display_order = temp;
        if (sorted[idx].display_order === sorted[idx + 1].display_order) {
            sorted[idx + 1].display_order = parseInt(sorted[idx + 1].display_order) + 1;
        }
    } else {
        return; // No-op
    }

    const payload = {
        orders: sorted.map(o => ({ id: o.id, display_order: o.display_order }))
    };

    try {
        const res = await window.authFetch('../api/admin_api.php?action=reorder_housing_offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.offer_reorder_success'));
        } else {
            showToast(window.t('messages.offer_reorder_failed') + ': ' + data.message);
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function initOffersModule() {
    const offerForm = document.getElementById('offerForm');
    if (offerForm) {
        offerForm.addEventListener('submit', handleAddOffer);
    }

    const editOfferForm = document.getElementById('editOfferForm');
    if (editOfferForm) {
        editOfferForm.addEventListener('submit', handleUpdateOffer);
    }

    const offerSearch = document.getElementById('offerSearchInput');
    if (offerSearch) {
        offerSearch.addEventListener('input', renderOffers);
    }

    // Expose globals so inline onclick in rendered HTML can invoke them
    window.deleteOfferGlobal = deleteOffer;
    window.openEditOfferModalGlobal = openEditOfferModal;
    window.toggleOfferStatusGlobal = toggleOfferStatus;
    window.moveOfferGlobal = moveOffer;
}
