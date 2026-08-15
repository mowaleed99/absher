import React, { useState, useRef, useEffect } from 'react';
import { Student, PointsUpdateData } from '../../types/student';
import { useI18n } from '../../lib/i18n';

interface ManagePointsModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSubmit: (data: PointsUpdateData) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ManagePointsModal({ isOpen, student, onClose, onSubmit, showToast }: ManagePointsModalProps) {
  const { t } = useI18n();
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [operation, setOperation] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOperation('add');
      setAmount('');
      setReason('');
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

  if (!isOpen || !student) return null;

  const currentPoints = student.points || 0;
  const numAmount = Number(amount) || 0;
  const projectedBalance = operation === 'add' ? currentPoints + numAmount : currentPoints - numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (numAmount <= 0) {
      showToast('المبلغ يجب أن يكون أكبر من الصفر', 'error');
      return;
    }

    if (operation === 'deduct' && numAmount > currentPoints) {
      showToast(`لا يمكن خصم ${numAmount} نقطة، الرصيد الحالي (${currentPoints}) غير كافٍ`, 'error');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        student_id: student.id,
        amount: numAmount,
        operation,
        reason: reason.trim(),
      });

      if (res.success) {
        showToast(t('msg.points_updated'), 'success');
        onClose();
      } else {
        showToast(res.error || t('msg.error_update_points'), 'error');
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
          maxWidth: '500px',
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
            padding: '20px 24px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-coins"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('students.manage_points')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
              fontSize: '1.5rem',
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

        {/* Current Balance Banner */}
        <div style={{ padding: '20px 24px 0' }}>
          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                {t('students.current_points')}
              </span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--accent-amber)', fontWeight: 800 }}>
                {currentPoints} <span style={{ fontSize: '0.85rem' }}>نقطة</span>
              </strong>
            </div>

            {numAmount > 0 && (
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  الرصيد المتوقع بعد العملية
                </span>
                <strong
                  style={{
                    fontSize: '1.1rem',
                    color: projectedBalance < 0 ? '#ef4444' : '#34d399',
                    fontWeight: 700,
                  }}
                >
                  {projectedBalance} نقطة
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Operation Selector */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              نوع العملية
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setOperation('add')}
                disabled={isSubmitting}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: operation === 'add' ? '2px solid #10b981' : '1px solid var(--border-color)',
                  background: operation === 'add' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-main)',
                  color: operation === 'add' ? '#34d399' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-plus-circle"></i>
                <span>{t('students.op_add')}</span>
              </button>

              <button
                type="button"
                onClick={() => setOperation('deduct')}
                disabled={isSubmitting}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: operation === 'deduct' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                  background: operation === 'deduct' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-main)',
                  color: operation === 'deduct' ? '#f87171' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className="fa-solid fa-minus-circle"></i>
                <span>{t('students.op_deduct')}</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('students.amount')} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max={operation === 'deduct' ? currentPoints : undefined}
              value={amount}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setAmount(isNaN(v) ? '' : Math.max(0, v));
              }}
              placeholder="مثال: 50"
              required
              disabled={isSubmitting}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '1.05rem',
                fontWeight: 700,
                outline: 'none',
              }}
            />
          </div>

          {/* Reason Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {t('students.points_reason')}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: مكافأة تسجيل / تعويض خدمة"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: 600 }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: 700,
                background: operation === 'add' ? '#10b981' : '#ef4444',
                color: '#fff',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>{t('form.saving')}</span>
                </>
              ) : (
                <>
                  <i className={`fa-solid ${operation === 'add' ? 'fa-plus' : 'fa-minus'}`}></i>
                  <span>{t('students.save_points')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
