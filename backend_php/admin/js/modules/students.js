import { appData } from '../state.js';
import { showToast, withLoading } from '../ui.js';
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
            <td><span style="background:rgba(236,72,153,0.15); color:var(--secondary); padding:4px 10px; border-radius:12px; font-weight:bold;">${std.nationality || t('students.unknown_nationality')}</span></td>
            <td dir="ltr">${std.created_at || t('status.now')}</td>
            <td dir="ltr" style="font-weight:bold; color:var(--accent);">${std.points || 0}</td>
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;"
                        onclick="window.openPointsModalGlobal && window.openPointsModalGlobal(${std.id},'${std.full_name}', ${std.points || 0})">
                    <i class="fa-solid fa-coins"></i> ${t('buttons.manage')}
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
        title: t('dialog.delete_student_title'),
        message: t('dialog.delete_student_msg'),
        confirmText: t('buttons.delete'),
        cancelText: t('buttons.cancel'),
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
            showToast(t('messages.student_deleted'));
        } else {
            showToast(t('messages.student_delete_failed') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(t('messages.conn_error'));
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
        showToast(t('messages.invalid_points_amount'));
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
            showToast(operation === 'add' ? t('messages.points_add_success') : t('messages.points_deduct_success'));
        } else {
            showToast(t('status.error') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(t('messages.conn_error'));
    }
}

export async function handleAddStudentSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('[type="submit"]');
    await withLoading(submitBtn, async () => {
        const fullName = document.getElementById('addStdName').value.trim();
        const email    = document.getElementById('addStdEmail').value.trim();
        const phone    = document.getElementById('addStdPhone').value.trim();
        const uni      = document.getElementById('addStdUni').value.trim();
        const password = document.getElementById('addStdPass').value;

        if (!fullName || !email || !phone || !password) {
            showToast(t('messages.fill_all_fields'));
            return;
        }

        try {
            const res = await window.authFetch('../api/admin_api.php?action=add_student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, email, phone, university: uni, password })
            });
            if (!res) return;
            const data = await res.json();
            if (data.status === 'success') {
                window.closeModalGlobal && window.closeModalGlobal('addStudentModal');
                e.target.reset();
                showToast(t('messages.student_added') || 'تم إضافة الطالب بنجاح ✅');
                await loadDashboardData();
            } else {
                showToast(data.message || t('status.error'));
            }
        } catch (ex) {
            console.error(ex);
            showToast(t('messages.conn_error'));
        }
    });
}

export function initStudentsModule() {
    const pointsForm = document.getElementById('pointsForm');
    if (pointsForm) {
        pointsForm.addEventListener('submit', handlePointsSubmit);
    }

    const addForm = document.getElementById('addStudentForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddStudentSubmit);
    }

    window.deleteStudentGlobal = deleteStudent;
    window.openPointsModalGlobal = openPointsModal;
}
