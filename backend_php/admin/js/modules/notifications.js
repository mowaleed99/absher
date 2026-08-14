import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderNotifications() {
    const container = document.getElementById('notificationsTableBody');
    if (!container) return;

    if (!appData.notifications || appData.notifications.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">${window.t('messages.no_notifications_published')} </td></tr>`;
        return;
    }

    const sorted = [...appData.notifications].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
        return timeB - timeA;
    });

    container.innerHTML = sorted.map((item, idx) => {
        let isExpired = false;
        if (item.created_at) {
            const timeCreated = new Date(item.created_at).getTime();
            const now = new Date().getTime();
            if (now - timeCreated > 48 * 60 * 60 * 1000) isExpired = true;
        }

        const statusBadge = isExpired
            ? `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">${window.t('notifications.expired_48h')} </span>`
            : `<span style="background: rgba(37, 211, 102, 0.18); color: #25D366; border: 1px solid #25D366; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">${window.t('notifications.active_student')} </span>`;

        return `
            <tr>
                <td>${idx + 1}</td>
                <td style="font-weight: bold; color: var(--accent-amber);">${item.title}</td>
                <td style="max-width: 400px; white-space: normal; word-break: break-word; line-height: 1.5; color: var(--text-muted); font-size: 0.9rem;">${item.content || item.body || ''}</td>
                <td>${item.date || item.created_at || window.t('status.now')}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer;"
                            onclick="window.handleDeleteNotificationGlobal && window.handleDeleteNotificationGlobal(${item.id})">
                        <i class="fa-solid fa-trash-can"></i> ${window.t('buttons.delete')}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

export async function handleAddNotification(e) {
    e.preventDefault();
    const title = document.getElementById('notifTitle').value.trim();
    const content = document.getElementById('notifContent').value.trim();

    if (!title || !content) return;

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('notificationModal');
            document.getElementById('notificationForm').reset();
            showToast(result.message || window.t('messages.alert_published'));
        } else {
            showToast(window.t('status.error') + ': ' + (result.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast(window.t('messages.conn_error'));
    }
}

export async function handleDeleteNotification(id) {
    const confirmed = await window.showConfirmDialog({
        title: window.t('dialog.delete_alert_title'),
        message: window.t('dialog.delete_alert_msg'),
        confirmText: window.t('buttons.delete'),
        cancelText: window.t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;
    try {
        const res = await window.authFetch(`../api/admin_api.php?action=delete_notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            showToast(result.message || window.t('messages.alert_deleted'));
        } else {
            showToast(window.t('status.error') + ': ' + (result.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast(window.t('messages.conn_error'));
    }
}

export function initNotificationsModule() {
    const notifForm = document.getElementById('notificationForm');
    if (notifForm) {
        notifForm.addEventListener('submit', handleAddNotification);
    }
    window.handleDeleteNotificationGlobal = handleDeleteNotification;
}
