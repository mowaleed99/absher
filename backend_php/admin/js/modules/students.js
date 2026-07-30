import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

// NOTE: deleteStudent and handlePointsSubmit still use local mutation (Phase 2 will fix them).
// Phase 1 goal: syntactically valid module that loads and runs without errors.

export function renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = appData.students.map((std, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td style="font-weight:bold; color:var(--text-main); font-size:1rem;"> ${std.full_name}</td>
            <td>${std.email}</td>
            <td dir="ltr" style="color:var(--accent-green); font-weight:bold;">${std.phone}</td>
            <td style="font-weight:600;">${std.university}</td>
            <td><span style="background:rgba(236,72,153,0.15); color:var(--secondary); padding:4px 10px; border-radius:12px; font-weight:bold;">${std.nationality || tr('غير محدد')}</span></td>
            <td dir="ltr">${std.created_at || tr('الآن')}</td>
            <td dir="ltr" style="font-weight:bold; color:var(--accent);">${std.points || 0}</td>
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;"
                        onclick="window.openPointsModalGlobal && window.openPointsModalGlobal(${std.id},'${std.full_name}', ${std.points || 0})">
                    <i class="fa-solid fa-coins"></i> ${tr('إدارة')}
                </button>
            </td>
            <td>
                <button class="btn btn-danger" style="padding:6px 10px;"
                        onclick="window.deleteStudentGlobal && window.deleteStudentGlobal(${std.id})">
                    <i class="fa-solid fa-user-xmark"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

export async function deleteStudent(id) {
    const confirmed = await window.showConfirmDialog({
        title: 'تأكيد حذف الطالب',
        message: 'هل أنت متأكد من حذف هذا الطالب نهائياً؟',
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم حذف الطالب بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف: ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
    }
}

export function openPointsModal(studentId, studentName, currentPoints) {
    document.getElementById('pointsStudentId').value = studentId;
    document.getElementById('pointsModalStudentName').textContent = studentName;
    document.getElementById('pointsModalCurrentPoints').textContent = currentPoints || 0;
    document.getElementById('pointsAmount').value = '';
    document.getElementById('pointsReason').value = '';
    const addRadio = document.querySelector('input[name="pointsOperation"][value="add"]');
    if (addRadio) addRadio.checked = true;
    window.openModalGlobal && window.openModalGlobal('pointsModal');
}

export async function handlePointsSubmit(e) {
    e.preventDefault();
    const studentId = parseInt(document.getElementById('pointsStudentId').value);
    const amount = parseInt(document.getElementById('pointsAmount').value);
    const reason = document.getElementById('pointsReason').value;
    const operation = document.querySelector('input[name="pointsOperation"]:checked').value;

    if (isNaN(amount) || amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر.');
        return;
    }

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=update_student_points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, amount, operation, reason })
        });
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('pointsModal');
            showToast(operation === 'add' ? 'تم إضافة النقاط بنجاح!' : 'تم خصم النقاط بنجاح!');
        } else {
            showToast('خطأ: ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
    }
}

export function initStudentsModule() {
    const pointsForm = document.getElementById('pointsForm');
    if (pointsForm) {
        pointsForm.addEventListener('submit', handlePointsSubmit);
    }

    window.deleteStudentGlobal = deleteStudent;
    window.openPointsModalGlobal = openPointsModal;
}
