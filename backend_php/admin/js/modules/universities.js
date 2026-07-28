import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderUniversities() {
    const container = document.getElementById('universitiesList');
    if (!container) return;

    container.innerHTML = (appData.universities || []).map(uni => `
        <div class="item-card" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-main);">
            <div style="font-weight: bold; color: var(--text-main); font-size: 1.1rem;"><i class="fa-solid fa-graduation-cap"></i> ${uni.name}</div>
            <button class="btn btn-danger" onclick="window.deleteUniversityGlobal && window.deleteUniversityGlobal(${uni.id})">
                <i class="fa-solid fa-trash"></i> حذف
            </button>
        </div>
    `).join('');
}

export async function handleAddUniversity(e) {
    e.preventDefault();
    const name = document.getElementById('uniName').value.trim();
    if (!name) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_university`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('uniModal');
            document.getElementById('uniForm').reset();
            showToast('تم إضافة الجامعة بنجاح');
        } else {
            showToast('حدث خطأ أثناء الإضافة: ' + (data.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء الاتصال بالخادم');
    }
}

export async function deleteUniversity(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الجامعة؟')) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_university`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم حذف الجامعة بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف: ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
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
                <input type="number" id="uni_time_${uni.id}" placeholder="دقيقة" value="${timeValue}"
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
    window.deleteUniversityGlobal = deleteUniversity;
    window.toggleUniTimeGlobal = toggleUniTime;
}
