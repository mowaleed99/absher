import React, { useState, useMemo, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { BroadcastNotification } from '../../types/notification';
import { useI18n } from '../../lib/i18n';
import { SendNotificationModal } from './SendNotificationModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

const PAGE_SIZE = 15;

export function NotificationsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { notifications, isLoading, error, refetch, addNotification, deleteNotification } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<BroadcastNotification | null>(null);

  const filteredNotifications = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => {
      const matchTitleAr = (n.title_ar || n.title || '').toLowerCase().includes(q);
      const matchTitleEn = (n.title_en || '').toLowerCase().includes(q);
      const matchBodyAr = (n.body_ar || n.body || '').toLowerCase().includes(q);
      const matchBodyEn = (n.body_en || '').toLowerCase().includes(q);
      const matchId = String(n.id).includes(q);
      return matchTitleAr || matchTitleEn || matchBodyAr || matchBodyEn || matchId;
    });
  }, [notifications, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, currentPage]);

  const handleDelete = async (notif: BroadcastNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await confirm({
      title: t('dialog.delete_notif_title'),
      message: t('dialog.delete_notif_msg'),
      variant: 'danger',
    });
    if (!ok) return;

    const res = await deleteNotification(notif.id);
    if (res.success) {
      showToast(isRtl ? 'تم حذف التنبيه بنجاح' : 'Notification deleted successfully', 'success');
      if (selectedNotif?.id === notif.id) {
        setSelectedNotif(null);
      }
    } else {
      showToast(res.error || (isRtl ? 'فشل حذف التنبيه' : 'Failed to delete notification'), 'error');
    }
  };

  const isExpired48h = (dateStr?: string) => {
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return false;
    return Date.now() - time > 48 * 60 * 60 * 1000;
  };

  return (
    <section className="section active">
      {/* Module Header */}
      <div className="section-header" style={{ marginBottom: '14px' }}>
        <div>
          <h2>{t('notifications.title')}</h2>
          <p>{t('notifications.desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsSendModalOpen(true)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-bullhorn"></i>
            <span>{t('notifications.send_notification')}</span>
          </button>
        </div>
      </div>

      {/* Unified Single-Row Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '480px' }}>
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('notifications.search_placeholder')}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid #1e293b',
              color: '#f8fafc',
              padding: isRtl ? '0 36px 0 12px' : '0 12px 0 36px',
              fontSize: '0.82rem',
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '0.8rem',
            }}
          ></i>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                [isRtl ? 'left' : 'right']: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'var(--text-muted)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                lineHeight: 1,
              }}
              title={t('btn.cancel')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Count Badge */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '6px 14px',
            borderRadius: '16px',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {t('notifications.count', { count: filteredNotifications.length })}
        </div>
      </div>

      {/* Content Area: High-Density Professional Data Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{t('notifications.loading')}</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={refetch}
            style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem' }}
          >
            {t('btn.retry')}
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-bell-slash fa-3x" style={{ opacity: 0.3, marginBottom: '12px' }}></i>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('notifications.empty_state')}</p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              className="data-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: isRtl ? 'right' : 'left',
                fontSize: '0.82rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <th style={{ padding: '10px 12px', width: '50px' }}>{t('notifications.th_id')}</th>
                  <th style={{ padding: '10px 14px', width: '180px' }}>{t('notifications.th_title_ar')}</th>
                  <th style={{ padding: '10px 14px', width: '180px' }}>{t('notifications.th_title_en')}</th>
                  <th style={{ padding: '10px 14px' }}>{t('notifications.th_body')}</th>
                  <th style={{ padding: '10px 14px', width: '150px' }}>{t('notifications.th_date')}</th>
                  <th style={{ padding: '10px 12px', width: '110px', textAlign: 'center' }}>{t('notifications.th_status')}</th>
                  <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>{t('notifications.th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((notif, idx) => {
                  const titleAr = notif.title_ar || notif.title || '—';
                  const titleEn = notif.title_en || '—';
                  const bodyAr = notif.body_ar || notif.body || '';
                  const bodyEn = notif.body_en || '';
                  const previewText = bodyAr || bodyEn || '—';
                  const expired = isExpired48h(notif.created_at || notif.date);

                  return (
                    <tr
                      key={notif.id}
                      onClick={() => setSelectedNotif(notif)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* ID */}
                      <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      {/* Arabic Title */}
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fbbf24' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-bell" style={{ fontSize: '0.75rem', color: '#fbbf24', opacity: 0.8 }}></i>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }} title={titleAr}>
                            {titleAr}
                          </span>
                        </div>
                      </td>

                      {/* English Title */}
                      <td style={{ padding: '10px 14px', color: '#a78bfa' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '160px' }} title={titleEn}>
                          {titleEn}
                        </span>
                      </td>

                      {/* Body Preview */}
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.4,
                            maxWidth: '380px',
                          }}
                          title={previewText}
                        >
                          {previewText}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        <i className="fa-regular fa-clock" style={{ [isRtl ? 'marginLeft' : 'marginRight']: '4px', fontSize: '0.7rem' }}></i>
                        <span>{notif.date || notif.created_at || '—'}</span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: expired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(37, 211, 102, 0.12)',
                            color: expired ? '#f87171' : '#25D366',
                            border: expired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(37, 211, 102, 0.3)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {expired ? t('notifications.status_expired') : t('notifications.status_active')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={(e) => handleDelete(notif, e)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                          title={t('btn.delete')}
                        >
                          <i className="fa-solid fa-trash-can" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('notifications.count', { count: filteredNotifications.length })}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ height: '30px', padding: '0 10px', borderRadius: '6px', fontSize: '0.75rem' }}
                >
                  {t('pagination.prev')}
                </button>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0 8px' }}>
                  {t('pagination.page', { current: currentPage, total: totalPages })}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ height: '30px', padding: '0 10px', borderRadius: '6px', fontSize: '0.75rem' }}
                >
                  {t('pagination.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal on Click */}
      {selectedNotif && (
        <div
          className="modal-overlay active"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedNotif(null);
          }}
        >
          <div
            className="modal-box custom-scrollbar"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '560px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-bullhorn"></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {t('notifications.details_title')} #{selectedNotif.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Arabic Details Box */}
            <div
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
              dir="rtl"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
                <i className="fa-solid fa-language"></i>
                <span>القسم العربي</span>
              </div>
              <strong style={{ display: 'block', fontSize: '0.92rem', color: '#f8fafc', marginBottom: '6px' }}>
                {selectedNotif.title_ar || selectedNotif.title}
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selectedNotif.body_ar || selectedNotif.body}
              </p>
            </div>

            {/* English Details Box if present */}
            {(selectedNotif.title_en || selectedNotif.body_en) && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
                dir="ltr"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-globe"></i>
                  <span>English Section</span>
                </div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#f8fafc', marginBottom: '6px' }}>
                  {selectedNotif.title_en || selectedNotif.title}
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedNotif.body_en || selectedNotif.body}
                </p>
              </div>
            )}

            {/* Footer info & close */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <i className="fa-regular fa-clock"></i>
                <span>{selectedNotif.date || selectedNotif.created_at}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedNotif(null)}
                style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '0.82rem' }}
              >
                {t('btn.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSubmit={addNotification}
        showToast={showToast}
      />
    </section>
  );
}
