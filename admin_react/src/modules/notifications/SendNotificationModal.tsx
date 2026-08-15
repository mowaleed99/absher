import React, { useState, useRef } from 'react';
import { useI18n } from '../../lib/i18n';
import { NotificationFormData } from '../../types/notification';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NotificationFormData) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SendNotificationModal({ isOpen, onClose, onSubmit, showToast }: SendNotificationModalProps) {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLockRef = useRef(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    if (!titleAr.trim() && !titleEn.trim()) {
      showToast(isRtl ? 'يرجى إدخال عنوان التنبيه' : 'Please enter notification title', 'error');
      return;
    }

    if (!bodyAr.trim() && !bodyEn.trim()) {
      showToast(isRtl ? 'يرجى إدخال نص التنبيه' : 'Please enter notification content', 'error');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        title_ar: titleAr.trim() || titleEn.trim(),
        title_en: titleEn.trim() || titleAr.trim(),
        body_ar: bodyAr.trim() || bodyEn.trim(),
        body_en: bodyEn.trim() || bodyAr.trim(),
      });

      if (res.success) {
        showToast(isRtl ? 'تم إرسال التنبيه العام بنجاح' : 'Notification broadcasted successfully', 'success');
        onClose();
        setTitleAr('');
        setTitleEn('');
        setBodyAr('');
        setBodyEn('');
      } else {
        showToast(res.error || (isRtl ? 'فشل إرسال التنبيه' : 'Failed to send notification'), 'error');
      }
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
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
        if (e.target === e.currentTarget && !isSubmitting) onClose();
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
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              }}
            >
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>
              {t('notifications.send_notification')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            className="custom-scrollbar"
            style={{
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Arabic Section */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
                <i className="fa-solid fa-language"></i>
                <span>عنوان ونص التنبيه بالعربية (Arabic)</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('notifications.title_ar')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="عنوان التنبيه بالعربية..."
                  dir="rtl"
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '0 10px',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('notifications.body_ar')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  value={bodyAr}
                  onChange={(e) => setBodyAr(e.target.value)}
                  placeholder="نص ومحتوى التنبيه بالعربية..."
                  rows={3}
                  dir="rtl"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* English Section */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 700 }}>
                <i className="fa-solid fa-globe"></i>
                <span>Notification Title & Body in English (Optional)</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('notifications.title_en')}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Enter notification title in English..."
                  dir="ltr"
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '0 10px',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('notifications.body_en')}
                </label>
                <textarea
                  className="form-control"
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  placeholder="Enter notification body in English..."
                  rows={3}
                  dir="ltr"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>{t('btn.send')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
