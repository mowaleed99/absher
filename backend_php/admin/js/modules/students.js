import { appData } from '../state.js';
import { showToast, withLoading } from '../ui.js';
import { loadDashboardData } from '../api.js';

// NOTE: deleteStudent and handlePointsSubmit still use local mutation (Phase 2 will fix them).
// Phase 1 goal: syntactically valid module that loads and runs without errors.

export function renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('studentSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = appData.students.filter(std => {
        if (!query) return true;
        const name = (std.full_name || '').toLowerCase();
        const email = (std.email || '').toLowerCase();
        const phone = (std.phone || '').toLowerCase();
        const uni = (std.university || '').toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query) || uni.includes(query);
    });

    tbody.innerHTML = filtered.map((std, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td style="font-weight:bold; color:var(--text-main); font-size:1rem;"> ${std.full_name}</td>
            <td>${std.email}</td>
            <td dir="ltr" style="color:var(--accent-green); font-weight:bold;">${std.phone}</td>
            <td style="font-weight:600;">${std.university}</td>
            <td><span style="background:rgba(236,72,153,0.15); color:var(--secondary); padding:4px 10px; border-radius:12px; font-weight:bold;">${std.nationality || window.t('students.unknown_nationality')}</span></td>
            <td dir="ltr">${std.created_at || window.t('status.now')}</td>
            <td dir="ltr" style="font-weight:bold; color:var(--accent);">${std.points || 0}</td>
            <td>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;"
                        onclick="window.openPointsModalGlobal && window.openPointsModalGlobal(${std.id},'${std.full_name}', ${std.points || 0})">
                    <i class="fa-solid fa-coins"></i> ${window.t('buttons.manage')}
                </button>
            </td>
            <td>
                <button class="btn btn-warning" style="padding:4px 8px; font-size:0.8rem; background:#f59e0b; border-color:#f59e0b; color: #fff;"
                        onclick="window.openChangePasswordModalGlobal && window.openChangePasswordModalGlobal(${std.id},'${std.full_name}')">
                    <i class="fa-solid fa-key"></i> ${window.t('students.table.change_password') || 'تغيير'}
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
        title: window.t('dialog.delete_student_title'),
        message: window.t('dialog.delete_student_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
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
            showToast(window.t('messages.student_deleted'));
        } else {
            showToast(window.t('messages.student_delete_failed') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
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
        showToast(window.t('messages.invalid_points_amount'));
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
            showToast(operation === 'add' ? window.t('messages.points_add_success') : window.t('messages.points_deduct_success'));
        } else {
            showToast(window.t('status.error') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
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
            showToast(window.t('messages.fill_all_fields'));
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
                showToast(window.t('messages.student_added') || 'تم إضافة الطالب بنجاح ✅');
                await loadDashboardData();
            } else {
                showToast(data.message || window.t('status.error'));
            }
        } catch (ex) {
            console.error(ex);
            showToast(window.t('messages.conn_error'));
        }
    });
}

export function openChangePasswordModal(studentId, studentName) {
    document.getElementById('changePasswordStudentId').value = studentId;
    document.getElementById('changePasswordModalStudentName').textContent = studentName;
    document.getElementById('changePasswordNewPass').value = '';
    window.openModalGlobal && window.openModalGlobal('changePasswordModal');
}

export async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('[type="submit"]');
    await withLoading(submitBtn, async () => {
        const studentId = parseInt(document.getElementById('changePasswordStudentId').value);
        const password  = document.getElementById('changePasswordNewPass').value;

        if (password.length < 6) {
            showToast(window.t('messages.fill_all_fields') || 'كلمة المرور قصيرة جداً');
            return;
        }

        try {
            const res = await window.authFetch('../api/admin_api.php?action=change_student_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: studentId, password })
            });
            if (!res) return;
            const data = await res.json();
            if (data.status === 'success') {
                window.closeModalGlobal && window.closeModalGlobal('changePasswordModal');
                showToast(window.t('messages.password_change_success') || 'تم تغيير كلمة المرور بنجاح ✅');
            } else {
                showToast(data.message || window.t('messages.password_change_fail'));
            }
        } catch (ex) {
            console.error(ex);
            showToast(window.t('messages.conn_error'));
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

    const changePassForm = document.getElementById('changePasswordForm');
    if (changePassForm) {
        changePassForm.addEventListener('submit', handleChangePasswordSubmit);
    }

    const searchInput = document.getElementById('studentSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', renderStudents);
    }

    window.deleteStudentGlobal = deleteStudent;
    window.openPointsModalGlobal = openPointsModal;
    window.openChangePasswordModalGlobal = openChangePasswordModal;
}
