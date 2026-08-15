import { useState, useMemo } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { BroadcastNotification } from '../../types/notification';
import { useI18n } from '../../lib/i18n';
import { SendNotificationModal } from './SendNotificationModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export function NotificationsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { notifications, isLoading, error, refetch, addNotification, deleteNotification } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const filteredNotifications = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => {
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchBody = (n.body || '').toLowerCase().includes(q);
      return matchTitle || matchBody;
    });
  }, [notifications, searchTerm]);

  const handleDelete = async (notif: BroadcastNotification) => {
    const ok = await confirm({
      title: t('dialog.delete_notif_title'),
      message: t('dialog.delete_notif_msg'),
      variant: 'danger',
    });
    if (!ok) return;

    const res = await deleteNotification(notif.id);
    if (res.success) {
      showToast(t('msg.notif_deleted'), 'success');
    } else {
      showToast(res.error || t('msg.error_delete_notif'), 'error');
    }
  };

  return (
    <section className="section active">
      {/* Module Header */}
      <div className="section-header">
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
              padding: '8px 16px',
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
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '460px' }}>
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

      {/* Content Area */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className="item-card"
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{notif.title}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {notif.date || notif.created_at || '—'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-main)', opacity: 0.85, lineHeight: 1.45 }}>
                    {notif.body}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn"
                onClick={() => handleDelete(notif)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0,
                }}
                title={t('btn.delete')}
              >
                <i className="fa-solid fa-trash" style={{ fontSize: '0.75rem' }}></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <SendNotificationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSubmit={addNotification}
        showToast={showToast}
      />
    </section>
  );
}
