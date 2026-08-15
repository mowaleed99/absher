import React, { useState, useRef, useEffect } from 'react';
import { NotificationFormData } from '../../types/notification';
import { useI18n } from '../../lib/i18n';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NotificationFormData) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SendNotificationModal({ isOpen, onClose, onSubmit, showToast }: SendNotificationModalProps) {
  const { t } = useI18n();
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setBody('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      showToast(t('msg.validation_required'), 'error');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        title: trimmedTitle,
        body: trimmedBody,
      });

      if (res.success) {
        showToast(t('msg.notif_sent'), 'success');
        onClose();
      } else {
        showToast(res.error || t('msg.error_send_notif'), 'error');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-box"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('notifications.send_notification')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('notifications.notif_title')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان التنبيه أو البث..."
                required
                disabled={isSubmitting}
                style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
              />
            </div>

            {/* Body */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('notifications.notif_body')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="نص التنبيه والمحتوى العام..."
                rows={4}
                required
                disabled={isSubmitting}
                style={{ width: '100%', borderRadius: '8px', padding: '10px 12px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>{t('btn.send')}...</span>
                </>
              ) : (
                <span>{t('btn.send')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
