import { useState, useEffect, useCallback } from 'react';
import { PromoCode, PromoRedemption } from '../../types/promo';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

interface PromoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promo: PromoCode | null;
  fetchRedemptions: (promoId: number, page?: number, limit?: number) => Promise<{ redemptions: PromoRedemption[]; total: number; totalPages: number }>;
}

export function PromoDetailsModal({ isOpen, onClose, promo, fetchRedemptions }: PromoDetailsModalProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const { showToast } = useToast();

  const [redemptions, setRedemptions] = useState<PromoRedemption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadData = useCallback(async (p: number, silent = false) => {
    if (!promo) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchRedemptions(promo.id, p, 10);
      setRedemptions(res.redemptions || []);
      setTotal(res.total || 0);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setPage(p);
    } catch {
      if (!silent) {
        setRedemptions([]);
        setTotal(0);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [promo, fetchRedemptions]);

  useEffect(() => {
    if (isOpen && promo) {
      loadData(page, false);
      const timer = setInterval(() => {
        loadData(page, true);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isOpen, promo, page, loadData]);

  if (!isOpen || !promo) return null;

  const handleCopyCode = (codeStr: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(codeStr).then(() => {
        setCopiedCode(true);
        showToast(`تم نسخ الكود: ${codeStr}`, 'success');
        setTimeout(() => setCopiedCode(false), 2000);
      }).catch(() => fallbackCopy(codeStr));
    } else {
      fallbackCopy(codeStr);
    }
  };

  const fallbackCopy = (codeStr: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = codeStr;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedCode(true);
      showToast(`تم نسخ الكود: ${codeStr}`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  // Metrics calculation
  const usedCount = promo.used_count || 0;
  const pointsSaved = promo.points_saved || 0;
  const totalLimit = promo.total_usage_limit;
  const remainingUses = totalLimit !== null ? Math.max(0, totalLimit - usedCount) : null;

  const renderStatusPill = (status: string) => {
    if (status === 'active') {
      return (
        <span
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
          نشط
        </span>
      );
    }
    if (status === 'paused') {
      return (
        <span
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
          معطل مؤقتاً
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '0.74rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}></span>
        مؤرشف
      </span>
    );
  };

  return (
    <div
      className="modal-overlay active"
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-box custom-scrollbar"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* 1. Header Redesign */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 800 }}>
                تفاصيل وسجل استخدام كود الخصم
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {promo.campaign_name}
                </span>
                {renderStatusPill(promo.status)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              color: '#f8fafc',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="custom-scrollbar"
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* 2. Dedicated Promo Identity Row */}
          <div
            style={{
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Promo Code Identity Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                رمز الكود:
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                <span
                  dir="ltr"
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: '#38bdf8',
                    fontSize: '0.9rem',
                    letterSpacing: '0.5px',
                    maxWidth: '240px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                  }}
                  title={promo.code}
                >
                  {promo.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(promo.code)}
                  title="نسخ الكود بالكامل"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedCode ? '#10b981' : '#38bdf8',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '0.8rem',
                  }}
                >
                  <i className={`fa-solid ${copiedCode ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
              </div>
            </div>

            {/* Discount & Rules Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {promo.discount_type === 'percentage'
                  ? `خصم ${promo.discount_value}%`
                  : promo.discount_type === 'free'
                  ? 'مجاني 100%'
                  : `خصم ${promo.discount_value} نقطة`}
                {promo.max_discount_points ? ` (سقف: ${promo.max_discount_points} نقطة)` : ''}
              </span>

              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-main)',
                }}
              >
                {promo.min_service_price_points > 0 ? `حد أدنى: ${promo.min_service_price_points} نقطة` : 'بدون حد أدنى'}
              </span>

              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                لكل طالب: {promo.per_student_limit || 1} مرة
              </span>
            </div>
          </div>

          {/* 3. Summary Metrics Strip (Numeric Metrics Only) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            {/* 1. Active Usages */}
            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  الاستخدامات النشطة
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#10b981', fontWeight: 800 }}>
                  {usedCount}
                </strong>
              </div>
            </div>

            {/* 2. Total Points Saved */}
            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
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
                <i className="fa-solid fa-coins"></i>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  النقاط الموفرة للطلاب
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#fbbf24', fontWeight: 800 }}>
                  {pointsSaved.toLocaleString()} نقطة
                </strong>
              </div>
            </div>

            {/* 3. Total History Records */}
            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-list-check"></i>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  إجمالي سجل العمليات
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#38bdf8', fontWeight: 800 }}>
                  {total}
                </strong>
              </div>
            </div>

            {/* 4. Remaining Uses */}
            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(192, 132, 252, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-gauge-high"></i>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  الاستخدام المتبقي
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#c084fc', fontWeight: 800 }}>
                  {totalLimit !== null ? `${remainingUses} من ${totalLimit}` : 'غير محدود (∞)'}
                </strong>
              </div>
            </div>
          </div>

          {/* 5. History Section Redesign */}
          <div
            style={{
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* History Section Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#38bdf8', fontSize: '0.9rem' }}></i>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  سجل الاستخدامات التفصيلي
                </span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {total} عملية
                </span>
              </div>

              <button
                type="button"
                onClick={() => loadData(page)}
                disabled={isLoading}
                title="تحديث سجل الاستخدامات"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
                <span>تحديث</span>
              </button>
            </div>

            {/* Redemptions Table or Compact Empty State */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin fa-xl"></i>
                <p style={{ marginTop: '8px', fontSize: '0.82rem' }}>جارِ تحميل سجل الاستخدامات...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  color: 'var(--text-muted)',
                }}
              >
                <i className="fa-solid fa-ticket" style={{ fontSize: '1.6rem', marginBottom: '6px', opacity: 0.35 }}></i>
                <p style={{ margin: 0, fontSize: '0.84rem' }}>
                  {total > 0
                    ? 'لا توجد سجلات استخدام في هذه الصفحة.'
                    : 'لم يتم تسجيل أي عمليات استخدام لهذا الكود حتى الآن.'}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderBottom: '1px solid var(--border-color)',
                          textAlign: isRtl ? 'right' : 'left',
                          color: 'var(--text-muted)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                        }}
                      >
                        <th style={{ padding: '10px 12px' }}>#</th>
                        <th style={{ padding: '10px 12px' }}>الطالب</th>
                        <th style={{ padding: '10px 12px' }}>الطلب والخدمة</th>
                        <th style={{ padding: '10px 12px' }}>السعر الأصلي</th>
                        <th style={{ padding: '10px 12px' }}>الخصم المطبق</th>
                        <th style={{ padding: '10px 12px' }}>المبلغ النهائي</th>
                        <th style={{ padding: '10px 12px' }}>الحالة</th>
                        <th style={{ padding: '10px 12px' }}>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.map((r, idx) => (
                        <tr
                          key={r.id || idx}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                            {r.id}
                          </td>

                          {/* Student */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                              {r.student_name_snapshot || (r.student_id ? `طالب #${r.student_id}` : 'طالب')}
                            </div>
                            {r.student_phone_snapshot && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                {r.student_phone_snapshot}
                              </div>
                            )}
                          </td>

                          {/* Request & Service */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  color: '#38bdf8',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                #{r.service_request_id || r.request_id_snapshot}
                              </span>
                              <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>
                                {r.service_title_snapshot || 'خدمة طلابية'}
                              </span>
                            </div>
                          </td>

                          {/* Original Price */}
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                            {r.original_price_points || 0} نقطة
                          </td>

                          {/* Discount */}
                          <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}>
                            -{r.discount_points} نقطة
                          </td>

                          {/* Final Price */}
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {r.final_price_points || 0} نقطة
                          </td>

                          {/* Status */}
                          <td style={{ padding: '10px 12px' }}>
                            {r.status === 'reversed' ? (
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                ملغي (مسترجع)
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                مطبق
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                            <div>{r.formatted_date || r.created_at}</div>
                            {r.status === 'reversed' && r.formatted_reversed_date && (
                              <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '1px' }}>
                                استرجاع: {r.formatted_reversed_date}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderTop: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>
                      صفحة {page} من {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => loadData(page - 1)}
                        disabled={page <= 1 || isLoading}
                        style={{
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: page <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                          cursor: page <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        السابق
                      </button>
                      <button
                        type="button"
                        onClick={() => loadData(page + 1)}
                        disabled={page >= totalPages || isLoading}
                        style={{
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        التالي
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 7. Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '38px',
              padding: '0 20px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1527')}
          >
            <i className="fa-solid fa-xmark"></i>
            <span>إغلاق النافذة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
