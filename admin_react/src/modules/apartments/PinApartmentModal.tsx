import React, { useState } from 'react';
import { Apartment } from '../../types/apartment';
import { useI18n } from '../../lib/i18n';

interface PinApartmentModalProps {
  isOpen: boolean;
  apartment: Apartment | null;
  onClose: () => void;
  onConfirm: (
    id: number,
    isFeatured: boolean,
    options?: { durationDays?: number; durationHours?: number; featuredUntil?: string | null }
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

type DurationType = '24h' | '3d' | '7d' | '30d' | 'permanent' | 'custom';

export function PinApartmentModal({
  isOpen,
  apartment,
  onClose,
  onConfirm,
  showToast,
}: PinApartmentModalProps) {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';

  const [selectedDuration, setSelectedDuration] = useState<DurationType>('7d');
  const [customDate, setCustomDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if apartment is currently featured
  const isCurrentlyFeatured = Boolean(
    apartment &&
      apartment.is_featured &&
      (!apartment.featured_until || new Date(apartment.featured_until).getTime() > Date.now())
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDuration('7d');
      // Set default custom date to 7 days from now formatted for datetime-local
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const iso = d.toISOString().slice(0, 16);
      setCustomDate(iso);
    }
  }, [isOpen]);

  if (!isOpen || !apartment) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let options: { durationDays?: number; durationHours?: number; featuredUntil?: string | null } = {};

      if (selectedDuration === '24h') {
        options = { durationHours: 24 };
      } else if (selectedDuration === '3d') {
        options = { durationDays: 3 };
      } else if (selectedDuration === '7d') {
        options = { durationDays: 7 };
      } else if (selectedDuration === '30d') {
        options = { durationDays: 30 };
      } else if (selectedDuration === 'permanent') {
        options = { featuredUntil: null };
      } else if (selectedDuration === 'custom') {
        if (!customDate) {
          showToast('يرجى تحديد تاريخ ووقت انتهاء التثبيت', 'error');
          setIsSubmitting(false);
          return;
        }
        options = { featuredUntil: customDate.replace('T', ' ') + ':00' };
      }

      const res = await onConfirm(apartment.id, true, options);
      if (res.success) {
        showToast(res.message || t('apt.pin_success'), 'success');
        onClose();
      } else {
        showToast(res.error || 'فشل تثبيت الشقة', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onConfirm(apartment.id, false);
      if (res.success) {
        showToast(res.message || t('apt.unpin_success'), 'success');
        onClose();
      } else {
        showToast(res.error || 'فشل إلغاء التثبيت', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationOptions: { key: DurationType; label: string; icon: string; desc: string }[] = [
    { key: '24h', label: t('apt.pin_24h'), icon: 'fa-clock', desc: 'مناسب للإعلانات السريعة والعاجلة' },
    { key: '3d', label: t('apt.pin_3d'), icon: 'fa-calendar-day', desc: 'تثبيت لـ 72 ساعة' },
    { key: '7d', label: t('apt.pin_7d'), icon: 'fa-calendar-week', desc: 'الخيار الأكثر شيوعاً واستخداماً' },
    { key: '30d', label: t('apt.pin_30d'), icon: 'fa-calendar-days', desc: 'تثبيت لشهر كامل' },
    { key: 'permanent', label: t('apt.pin_permanent'), icon: 'fa-infinity', desc: 'تثبيت دائم حتى تقوم بإلغائه يدوياً' },
    { key: 'custom', label: t('apt.pin_custom'), icon: 'fa-calendar-plus', desc: 'حدد تاريخ ووقت مخصصين' },
  ];

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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-card-hover)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                fontSize: '1.2rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <i className="fa-solid fa-thumbtack" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {t('apt.pin_modal_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                #{apartment.id} • {apartment.title_ar || apartment.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {/* Currently Pinned Alert Status */}
          {isCurrentlyFeatured && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                <i className="fa-solid fa-star" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {apartment.featured_until
                    ? `${t('apt.pinned_until')}: ${new Date(apartment.featured_until).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}`
                    : t('apt.permanent_pinned')}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleUnpin}
                disabled={isSubmitting}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                }}
              >
                <i className="fa-solid fa-ban" style={{ marginInlineEnd: '4px' }} />
                {t('apt.unpin_action')}
              </button>
            </div>
          )}

          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t('apt.pin_modal_desc')}
          </p>

          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
            {t('apt.pin_duration')}
          </label>

          {/* Duration Preset Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {durationOptions.map((opt) => {
              const isSelected = selectedDuration === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedDuration(opt.key)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'start',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: isSelected ? '#f59e0b' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className={`fa-solid ${opt.icon}`} />
                      {opt.label}
                    </span>
                    {isSelected && (
                      <i className="fa-solid fa-circle-check" style={{ color: '#f59e0b', fontSize: '0.85rem' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Date Input (if selected) */}
          {selectedDuration === 'custom' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('apt.custom_expiry_date')} *
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                required
                style={{ width: '100%', borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }}
              />
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 20px', borderRadius: '8px' }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn"
              disabled={isSubmitting}
              style={{
                padding: '8px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '160px',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  <span>{t('form.saving')}</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-thumbtack" />
                  <span>{t('apt.pin_action')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
