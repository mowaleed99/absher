import React, { useState, useRef, useEffect } from 'react';
import { Student, AdminMetaUpdateData } from '../../types/student';
import { useI18n } from '../../lib/i18n';

interface AdminMetaModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSubmit: (data: AdminMetaUpdateData) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AdminMetaModal({ isOpen, student, onClose, onSubmit, showToast }: AdminMetaModalProps) {
  const { t } = useI18n();
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminStatus, setAdminStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      setAdminStatus(student.admin_status || '');
      setAdminNote(student.admin_note || '');
    }
  }, [isOpen, student]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !student) return null;

  const quickStatusSuggestions = ['متابعة', 'مهم', 'مشكلة', 'موثوق', 'بحاجة للتواصل'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        id: student.id,
        admin_status: adminStatus.trim() || null,
        admin_note: adminNote.trim() || null,
      });

      if (res.success) {
        showToast(t('msg.admin_meta_saved'), 'success');
        onClose();
      } else {
        showToast(res.error || t('msg.error_admin_meta'), 'error');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setAdminStatus('');
    setAdminNote('');
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
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '480px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflowY: 'auto',
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
            background: 'rgba(255, 255, 255, 0.02)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('students.admin_meta')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {student.full_name}
              </p>
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
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
              borderRadius: '6px',
            }}
            title={t('btn.cancel')}
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Admin Status Label */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('students.admin_status')}
            </label>
            <input
              type="text"
              value={adminStatus}
              onChange={(e) => setAdminStatus(e.target.value)}
              placeholder="مثال: متابعة / مهم / مشكلة..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />

            {/* Quick Suggestions Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {quickStatusSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setAdminStatus(sug)}
                  style={{
                    background: adminStatus === sug ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: adminStatus === sug ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    color: adminStatus === sug ? 'var(--primary)' : 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Note Textarea */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('students.admin_note')}
            </label>
            <textarea
              rows={4}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={t('students.admin_note_placeholder')}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                lineHeight: 1.45,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting || (!adminStatus && !adminNote)}
              style={{
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-muted)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {t('btn.clear')}
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
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
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>{t('form.saving')}</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    <span>حفظ الملاحظات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
