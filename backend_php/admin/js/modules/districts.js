import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderDistricts() {
    const container = document.getElementById('districtsList');
    if (!container) return;

    container.innerHTML = (appData.districts || []).map(dist => `
        <div class="service-card" style="display:flex; justify-content:space-between; align-items:center; padding: 20px;">
            <div style="display:flex; align-items:center; gap: 15px;">
                <i class="fa-solid fa-map-location-dot" style="font-size: 2rem; color: var(--accent-amber);"></i>
                <h3 style="margin:0; font-size: 1.2rem;">${dist.name}</h3>
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn btn-secondary" style="border:none;"
                        onclick="window.openEditDistrictModalGlobal && window.openEditDistrictModalGlobal(${dist.id})">
                    <i class="fa-solid fa-pen"></i> ${window.t('buttons.edit', 'تعديل')}
                </button>
                <button class="btn" style="background:#ff4d4d; color:white; border:none;"
                        onclick="window.deleteDistrictGlobal && window.deleteDistrictGlobal(${dist.id})">
                    <i class="fa-solid fa-trash"></i> ${window.t('buttons.delete')}
                </button>
            </div>
        </div>
    `).join('');
}

export async function handleAddDistrict(event) {
    event.preventDefault();
    const nameAr = document.getElementById('districtNameAr').value.trim();
    const nameEn = document.getElementById('districtNameEn').value.trim();
    if (!nameAr) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_district`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameAr, name_ar: nameAr, name_en: nameEn })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.district_added'));
            window.closeModalGlobal && window.closeModalGlobal('districtModal');
            document.getElementById('districtForm').reset();
        } else {
            showToast(window.t('messages.error_add_district'));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function deleteDistrict(id) {
    const confirmed = await window.showConfirmDialog({
        title: window.t('dialog.delete_district_title'),
        message: window.t('dialog.delete_district_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_district`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.district_deleted'));
        } else {
            showToast(window.t('messages.error_delete_district'));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function populateAptLocationSelect() {
    const districtSelect = document.getElementById('aptDistrictId');
    if (districtSelect) {
        const currentValue = districtSelect.value;
        districtSelect.innerHTML = `<option value="">${window.t('apartments.select_district')}</option>` + (appData.districts || []).map(dist => `
            <option value="${dist.id}">${dist.name}</option>
        `).join('');
        if (currentValue) {
            districtSelect.value = currentValue;
        }
    }

    const locationInput = document.getElementById('aptLocation');
    if (locationInput && appData.districts && appData.districts.length > 0 && !locationInput.value) {
        locationInput.placeholder = window.t('example') + ': ' + appData.districts[0].name + window.t('districts.placeholder_example_suffix');
    }
}

export function initDistrictsModule() {
    const districtForm = document.getElementById('districtForm');
    if (districtForm) {
        districtForm.addEventListener('submit', handleAddDistrict);
    }
    const editDistrictForm = document.getElementById('editDistrictForm');
    if (editDistrictForm) {
        editDistrictForm.addEventListener('submit', handleUpdateDistrict);
    }
    window.deleteDistrictGlobal = deleteDistrict;
    window.openEditDistrictModalGlobal = openEditDistrictModal;
}

export function openEditDistrictModal(id) {
    const dist = appData.districts.find(d => String(d.id) === String(id));
    if (!dist) return;
    
    document.getElementById('editDistrictId').value = dist.id;
    document.getElementById('editDistrictNameAr').value = dist.name_ar || dist.name || '';
    document.getElementById('editDistrictNameEn').value = dist.name_en || '';
    
    if (window.openModalGlobal) window.openModalGlobal('editDistrictModal');
}

export async function handleUpdateDistrict(e) {
    e.preventDefault();
    const id = document.getElementById('editDistrictId').value;
    const nameAr = document.getElementById('editDistrictNameAr').value.trim();
    const nameEn = document.getElementById('editDistrictNameEn').value.trim();

    if (!nameAr) {
        showToast(window.t('messages.fill_required'));
        return;
    }

    const payload = {
        id: parseInt(id, 10),
        name: nameAr,
        name_ar: nameAr,
        name_en: nameEn
    };

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=update_district`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('editDistrictModal');
            showToast(window.t('messages.district_added', 'تم تحديث الحي بنجاح'));
        } else {
            showToast(data.message || 'خطأ في التحديث');
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}
