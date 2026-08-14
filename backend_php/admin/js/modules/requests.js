import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderRequests(filterText = '') {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody || !appData.requests) return;

    let filteredReqs = [...appData.requests].sort((a, b) => b.id - a.id);

    if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        filteredReqs = filteredReqs.filter(r =>
            (r.id && r.id.toString().includes(lowerFilter)) ||
            (r.student_name && r.student_name.toLowerCase().includes(lowerFilter)) ||
            (r.student_phone && r.student_phone.includes(lowerFilter))
        );
    }

    let countPending = 0;
    appData.requests.forEach(r => {
        if (r.status === 'قيد المراجعة' || r.status === 'under_review' || r.status === 'pending_cash' || r.status === 'انتظار الدفع النقدي') countPending++;
    });

    tbody.innerHTML = filteredReqs.map(req => {
        let infoChips = req.student_info ? req.student_info.split('|').map(s => s.trim()) : [];
        let uniStr = '';
        let natStr = '';
        infoChips.forEach(c => {
            if (c.includes('الجامعة:')) uniStr = c.replace('الجامعة:', '').trim();
            if (c.includes('الجنسية:')) natStr = c.replace('الجنسية:', '').trim();
        });

        // Status style
        let statusColor = '#fbbf24';
        if (req.status === 'under_review' || req.status === 'قيد المراجعة') {
            statusColor = '#fbbf24';
        } else if (req.status === 'pending_cash' || req.status === 'انتظار الدفع النقدي') {
            statusColor = '#a78bfa';
        } else if (req.status === 'in_progress' || req.status === 'جاري التنفيذ') {
            statusColor = '#38bdf8';
        } else if (req.status === 'completed' || req.status === 'مكتمل') {
            statusColor = '#25D366';
        }

        return `
        <tr>
            <td style="font-weight: bold; color: var(--text-main);">#${req.id}</td>
            <td style="font-weight: bold; color: var(--primary); font-size: 1.05rem;">${req.student_name}</td>
            <td>
                <div style="font-size: 0.85rem; color: #d1d7db; margin-bottom: 6px;"><i class="fa-solid fa-building-columns" style="color:var(--primary); width:16px;"></i> ${uniStr}</div>
                <div style="font-size: 0.85rem; color: #d1d7db;"><i class="fa-solid fa-earth-americas" style="color:var(--primary); width:16px;"></i> ${natStr}</div>
            </td>
            <td dir="ltr" style="font-family: monospace; color: #25D366; font-weight: bold; font-size: 1rem;">${req.student_phone}</td>
            <td>
                <div style="font-weight: bold; color: var(--accent-amber); margin-bottom: 6px; font-size: 0.95rem;">${req.type || req.service_title || window.t('requests.default_service_label')}</div>
                <div style="margin-bottom: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
                    ${(() => {
                        const pm = req.payment_method || 'free';
                        const pc = parseInt(req.points_charged || '0');
                        const spp = parseInt(req.service_price_points || '0');
                        if (pm === 'wallet') {
                            return `<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: bold;"> ${window.t('requests.payment.wallet', {points: pc})}</span>`;
                        } else if (pm === 'cash') {
                            return `<span style="background: rgba(167, 139, 250, 0.15); color: #a78bfa; border: 1px solid #a78bfa; padding: 2px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: bold;"> ${window.t('requests.payment.cash', {points: spp})}</span>`;
                        } else {
                            return `<span style="background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid #22c55e; padding: 2px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: bold;"> ${window.t('requests.payment.free')}</span>`;
                        }
                    })()}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">${req.details}</div>
            </td>
            <td>
                <select onchange="window.updateRequestStatusGlobal && window.updateRequestStatusGlobal(${req.id}, this.value)"
                        style="padding: 6px 12px; border-radius: 8px; background: #1e293b; color: ${statusColor}; border: 1px solid rgba(255,255,255,0.1); font-weight: bold; font-size: 0.95rem; cursor: pointer; outline: none;">
                    <option value="under_review" style="color:#fbbf24;" ${(req.status === 'under_review' || req.status === 'قيد المراجعة') ? 'selected' : ''}>⏳ ${window.t('status.under_review')}</option>
                    <option value="pending_cash" style="color:#a78bfa;" ${(req.status === 'pending_cash' || req.status === 'انتظار الدفع النقدي') ? 'selected' : ''}>💵 ${window.t('status.pending_cash')}</option>
                    <option value="in_progress" style="color:#38bdf8;" ${(req.status === 'in_progress' || req.status === 'جاري التنفيذ') ? 'selected' : ''}>⚙️ ${window.t('status.in_progress')}</option>
                    <option value="completed" style="color:#25D366;" ${(req.status === 'completed' || req.status === 'مكتمل') ? 'selected' : ''}>✅ ${window.t('status.completed')}</option>
                </select>
            </td>
            <td>
                <button onclick="window.jumpToChatGlobal && window.jumpToChatGlobal('${req.student_phone}','${req.student_name}')"
                        class="btn btn-primary"
                        style="background: rgba(37,211,102,0.15); border: 1px solid #25D366; color: #25D366; padding: 8px 16px; border-radius: 10px; font-size: 0.9rem;"
                        title="${window.t('requests.chat_tooltip')}">
                    <i class="fa-solid fa-comments"></i> ${window.t('buttons.chat')}
                </button>
            </td>
            <td>
                <button onclick="window.deleteRequestGlobal && window.deleteRequestGlobal(${req.id})"
                        class="btn btn-danger" style="padding:6px 10px;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');

    const statReqCount = document.getElementById('statReqCount');
    if (statReqCount) statReqCount.innerText = countPending;
}

export async function updateRequestStatus(id, newStatus) {
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=update_request_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.request_status_updated', {status: newStatus}));
        } else {
            showToast(window.t('messages.request_status_update_failed'));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function deleteRequest(id) {
    const confirmed = await window.showConfirmDialog({
        title: window.t('dialog.delete_request_title'),
        message: window.t('dialog.delete_request_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.request_deleted'));
        } else {
            showToast(window.t('messages.request_delete_failed') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function jumpToChat(phone, name) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const chat = appData.chats.find(
        c => c.phone.replace(/[^0-9+]/g, '') === cleanPhone || c.student_name === name
    );

    if (!chat) {
        // Navigate to chats tab; do NOT create a fake local chat
        showToast(window.t('requests.no_chat'));
        window.switchTabGlobal && window.switchTabGlobal('chats');
        return;
    }

    window.switchTabGlobal && window.switchTabGlobal('chats');
    setTimeout(() => {
        window.selectWaChatGlobal && window.selectWaChatGlobal(chat.id);
    }, 100);
}

export function initRequestsModule() {
    const reqSearch = document.getElementById('reqSearchInput');
    if (reqSearch) {
        reqSearch.addEventListener('input', () => renderRequests(reqSearch.value));
    }

    window.updateRequestStatusGlobal = updateRequestStatus;
    window.deleteRequestGlobal = deleteRequest;
    window.jumpToChatGlobal = jumpToChat;
}
