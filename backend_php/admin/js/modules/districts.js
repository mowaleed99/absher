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
            <button class="btn" style="background:#ff4d4d; color:white; border:none;"
                    onclick="window.deleteDistrictGlobal && window.deleteDistrictGlobal(${dist.id})">
                <i class="fa-solid fa-trash"></i> مسح
            </button>
        </div>
    `).join('');
}

export async function handleAddDistrict(event) {
    event.preventDefault();
    const name = document.getElementById('districtName').value.trim();
    if (!name) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_district`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تمت إضافة الحي بنجاح');
            window.closeModalGlobal && window.closeModalGlobal('districtModal');
            document.getElementById('districtForm').reset();
        } else {
            showToast('حدث خطأ أثناء إضافة الحي');
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
    }
}

export async function deleteDistrict(id) {
    const confirmed = await window.showConfirmDialog({
        title: 'تأكيد حذف الحي',
        message: 'هل أنت متأكد من حذف هذا الحي؟',
        confirmText: 'حذف',
        cancelText: 'إلغاء',
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
            showToast('تم حذف الحي بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف');
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
    }
}

export function populateAptLocationSelect() {
    const districtSelect = document.getElementById('aptDistrictId');
    if (districtSelect) {
        const currentValue = districtSelect.value;
        districtSelect.innerHTML = '<option value="">-- اختر الحي --</option>' + (appData.districts || []).map(dist => `
            <option value="${dist.id}">${dist.name}</option>
        `).join('');
        if (currentValue) {
            districtSelect.value = currentValue;
        }
    }

    const locationInput = document.getElementById('aptLocation');
    if (locationInput && appData.districts && appData.districts.length > 0 && !locationInput.value) {
        locationInput.placeholder = `مثال: ${appData.districts[0].name}، شارع بيكيني`;
    }
}

export function initDistrictsModule() {
    const districtForm = document.getElementById('districtForm');
    if (districtForm) {
        districtForm.addEventListener('submit', handleAddDistrict);
    }
    window.deleteDistrictGlobal = deleteDistrict;
}
