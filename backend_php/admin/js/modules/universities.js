import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderUniversities() {
    const container = document.getElementById('universitiesList');
    if (!container) return;

    container.innerHTML = (appData.universities || []).map(uni => `
        <div class="item-card" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-main);">
            <div style="font-weight: bold; color: var(--text-main); font-size: 1.1rem;"><i class="fa-solid fa-graduation-cap"></i> ${uni.name}</div>
            <button class="btn btn-secondary" onclick="window.openEditUniModalGlobal && window.openEditUniModalGlobal(${uni.id})" style="margin-left: 5px;">
                <i class="fa-solid fa-pen"></i> ${window.t('buttons.edit', 'تعديل')}
            </button>
            <button class="btn btn-danger" onclick="window.deleteUniversityGlobal && window.deleteUniversityGlobal(${uni.id})">
                <i class="fa-solid fa-trash"></i> ${window.t('buttons.delete')}
            </button>
        </div>
    `).join('');
}

export async function handleAddUniversity(e) {
    e.preventDefault();
    const nameAr = document.getElementById('uniNameAr').value.trim();
    const nameEn = document.getElementById('uniNameEn').value.trim();
    if (!nameAr) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_university`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameAr, name_ar: nameAr, name_en: nameEn })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('uniModal');
            document.getElementById('uniForm').reset();
            showToast(window.t('messages.university_added'));
        } else {
            showToast(window.t('messages.university_add_failed') + ': ' + (data.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast(window.t('messages.conn_error'));
    }
}

export async function deleteUniversity(id) {
    const confirmed = await window.showConfirmDialog({
        title: window.t('dialog.delete_university_title'),
        message: window.t('dialog.delete_university_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_university`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.university_deleted'));
        } else {
            showToast(window.t('messages.university_delete_failed') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function toggleUniTime(checkbox, uniId) {
    const timeInput = document.getElementById(`uni_time_${uniId}`);
    if (timeInput) {
        timeInput.style.display = checkbox.checked ? 'block' : 'none';
        if (!checkbox.checked) timeInput.value = '';
    }
}

export function populateAptUniversitiesCheckboxes() {
    const container = document.getElementById('aptUniversitiesCheckboxes');
    if (!container) return;

    // Gather current checked states and values
    const checkedStates = {};
    const times = {};
    const checkboxes = container.querySelectorAll('.uni-checkbox');
    checkboxes.forEach(cb => {
        const uniId = cb.getAttribute('data-id');
        checkedStates[uniId] = cb.checked;
        const timeInput = document.getElementById(`uni_time_${uniId}`);
        if (timeInput) {
            times[uniId] = timeInput.value;
        }
    });

    container.innerHTML = (appData.universities || []).map(uni => {
        const isChecked = checkedStates[uni.id] || false;
        const timeValue = times[uni.id] || '';
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" value="${uni.name}" data-id="${uni.id}" class="uni-checkbox"
                           ${isChecked ? 'checked' : ''}
                           onchange="window.toggleUniTimeGlobal && window.toggleUniTimeGlobal(this, ${uni.id})"
                           style="width: 16px; height: 16px;"> ${uni.name}
                </label>
                <input type="number" id="uni_time_${uni.id}" placeholder="${window.t('universities.time_placeholder')}" value="${timeValue}"
                       style="width: 70px; display: ${isChecked ? 'block' : 'none'}; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main);">
            </div>
        `;
    }).join('');
}

export function initUniversitiesModule() {
    const uniForm = document.getElementById('uniForm');
    if (uniForm) {
        uniForm.addEventListener('submit', handleAddUniversity);
    }
    const editUniForm = document.getElementById('editUniForm');
    if (editUniForm) {
        editUniForm.addEventListener('submit', handleUpdateUniversity);
    }
    window.deleteUniversityGlobal = deleteUniversity;
    window.toggleUniTimeGlobal = toggleUniTime;
    window.openEditUniModalGlobal = openEditUniModal;
}

export function openEditUniModal(id) {
    const uni = appData.universities.find(u => String(u.id) === String(id));
    if (!uni) return;
    
    document.getElementById('editUniId').value = uni.id;
    document.getElementById('editUniNameAr').value = uni.name_ar || uni.name || '';
    document.getElementById('editUniNameEn').value = uni.name_en || '';
    
    if (window.openModalGlobal) window.openModalGlobal('editUniModal');
}

export async function handleUpdateUniversity(e) {
    e.preventDefault();
    const id = document.getElementById('editUniId').value;
    const nameAr = document.getElementById('editUniNameAr').value.trim();
    const nameEn = document.getElementById('editUniNameEn').value.trim();

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
        const res = await window.authFetch(`../api/admin_api.php?action=update_university`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('editUniModal');
            showToast(window.t('messages.university_added', 'تم تحديث الجامعة بنجاح'));
        } else {
            showToast(data.message || 'خطأ في التحديث');
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}
