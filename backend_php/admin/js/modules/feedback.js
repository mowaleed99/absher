import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

let filterStatus = 'all';
let filterType = 'all';

export function renderFeedback() {
    const container = document.getElementById('feedbackTableBody');
    if (!container || !appData.application_feedback) return;

    // Filter feedback list
    let list = [...appData.application_feedback];

    if (filterStatus !== 'all') {
        list = list.filter(item => item.status === filterStatus);
    }

    if (filterType !== 'all') {
        list = list.filter(item => item.feedback_type === filterType);
    }

    // Sort: newest first
    list.sort((a, b) => {
        const timeA = new Date(a.created_at || a.date || 0).getTime();
        const timeB = new Date(b.created_at || b.date || 0).getTime();
        return timeB - timeA;
    });

    if (list.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    <i class="fa-solid fa-face-meh" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    لا توجد تذاكر بلاغات أو مقترحات مطابقة
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = list.map(item => {
        // Badges for Status
        let statusClass = 'status-pending';
        let statusText = 'قيد الانتظار';
        let badgeStyle = '';

        if (item.status === 'reviewed') {
            statusClass = 'status-under-review';
            statusText = 'تمت المراجعة';
            badgeStyle = 'background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);';
        } else if (item.status === 'resolved') {
            statusClass = 'status-done';
            statusText = 'تم حلها';
            badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);';
        }

        // Translation mapping for Type
        // Keys match the actual DB values stored by feedback/create.php: suggestion, bug, ux, feature
        const typeMap = {
            'suggestion':      { ar: 'مقترح',                     en: 'Suggestion',     style: 'background: rgba(139, 92, 246, 0.15); color: #8b5cf6;' },
            'bug':             { ar: 'بلاغ عطل',                   en: 'Bug Report',     style: 'background: rgba(239, 68, 68, 0.15); color: #ef4444;' },
            'ux':              { ar: 'ملاحظة واجهة المستخدم',      en: 'UX Feedback',    style: 'background: rgba(245, 158, 11, 0.15); color: #f59e0b;' },
            'feature':         { ar: 'طلب ميزة جديدة',              en: 'Feature Request', style: 'background: rgba(16, 185, 129, 0.15); color: #10b981;' }
        };

        // item.feedback_type is the correct DB column name
        const rawType = item.feedback_type || '';
        const typeInfo = typeMap[rawType] || { ar: rawType || '—', en: rawType || '—', style: 'background: rgba(255,255,255,0.05); color: var(--text-muted);' };

        // Moderator name mapping
        const moderatorName = item.reviewed_by_admin_id
            ? (item.reviewed_by_admin_id === 1 ? 'Admin' : `Admin #${item.reviewed_by_admin_id}`)
            : '-';

        const moderationTime = item.reviewed_at || '-';
        const isProcessing = item._processing === true;
        const disabledAttr = isProcessing ? 'disabled' : '';

        return `
            <tr id="feedback-row-${item.id}" style="${isProcessing ? 'opacity: 0.6;' : ''}">
                <td style="font-weight: bold; color: var(--text-main);">${item.student_name || 'طالب مجهول'}</td>
                <td><span style="font-size: 0.85rem; color: var(--text-muted);">${item.student_uni || '-'}</span></td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; ${typeInfo.style}">
                        ${typeInfo.ar} / ${typeInfo.en}
                    </span>
                </td>
                <td style="max-width: 400px; white-space: normal; word-break: break-all; font-style: italic;">
                    "${item.comment || '-'}"
                </td>
                <td>
                    <span class="status-badge ${statusClass}" style="${badgeStyle}">${statusText}</span>
                </td>
                <td><span style="font-size: 0.82rem; color: var(--text-muted);">${item.created_at || '-'}</span></td>
                <td><span style="font-weight: 600; color: var(--text-main);">${moderatorName}</span></td>
                <td><span style="font-size: 0.82rem; color: var(--text-muted);">${moderationTime}</span></td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end;">
                        ${isProcessing ? `
                            <i class="fa-solid fa-spinner fa-spin" style="color: var(--primary); font-size: 1.2rem;"></i>
                        ` : `
                            <select style="padding: 6px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); font-size: 0.8rem; cursor: pointer;"
                                    onchange="window.updateFeedbackStatusGlobal(${item.id}, this.value)" ${disabledAttr}>
                                <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>قيد الانتظار / Pending</option>
                                <option value="reviewed" ${item.status === 'reviewed' ? 'selected' : ''}>تمت المراجعة / Reviewed</option>
                                <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>تم حلها / Resolved</option>
                            </select>
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;"
                                    onclick="window.deleteFeedbackGlobal(${item.id})" ${disabledAttr}>
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

export async function updateFeedbackStatus(id, status) {
    const item = appData.application_feedback.find(x => x.id === id);
    if (!item) return;

    item._processing = true;
    renderFeedback();

    try {
        const res = await window.authFetch('../api/admin_api.php?action=update_feedback_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const data = await res.json();
        if (data.status === 'success') {
            item.status = status;
            item.reviewed_by_admin_id = 1;
            item.reviewed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            showToast('تم تحديث حالة التذكرة بنجاح ️');
        } else {
            showToast('خطأ: ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
    } finally {
        item._processing = false;
        renderFeedback();
        loadDashboardData();
    }
}

export async function deleteFeedback(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه التذكرة؟')) return;

    const item = appData.application_feedback.find(x => x.id === id);
    if (!item) return;

    item._processing = true;
    renderFeedback();

    try {
        const res = await window.authFetch('../api/admin_api.php?action=delete_feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            appData.application_feedback = appData.application_feedback.filter(x => x.id !== id);
            showToast('تم حذف تذكرة الملاحظات بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف: ' + (data.message || ''));
            item._processing = false;
        }
    } catch (ex) {
        console.error(ex);
        showToast('خطأ في الاتصال بالخادم');
        item._processing = false;
    } finally {
        renderFeedback();
        loadDashboardData();
    }
}

export function initFeedbackModule() {
    window.updateFeedbackStatusGlobal = updateFeedbackStatus;
    window.deleteFeedbackGlobal = deleteFeedback;

    const statusFlt = document.getElementById('feedStatusFilter');
    const typeFlt = document.getElementById('feedTypeFilter');

    if (statusFlt) {
        statusFlt.addEventListener('change', (e) => {
            filterStatus = e.target.value;
            renderFeedback();
        });
    }

    if (typeFlt) {
        typeFlt.addEventListener('change', (e) => {
            filterType = e.target.value;
            renderFeedback();
        });
    }
}
