import { useState, useEffect, useCallback } from 'react';
import { PromoCode, PromoRedemption } from '../../types/promo';
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
  const [redemptions, setRedemptions] = useState<PromoRedemption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async (p: number) => {
    if (!promo) return;
    setIsLoading(true);
    try {
      const res = await fetchRedemptions(promo.id, p, 10);
      setRedemptions(res.redemptions || []);
      setTotal(res.total || 0);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setPage(p);
    } catch {
      setRedemptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [promo, fetchRedemptions]);

  useEffect(() => {
    if (isOpen && promo) {
      loadData(1);
    }
  }, [isOpen, promo, loadData]);

  if (!isOpen || !promo) return null;

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
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 800 }}>
                تفاصيل وسجل استخدام كود الخصم ({promo.code})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {promo.campaign_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.3rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
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
          {/* Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
            }}
          >
            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>رمز الكود</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#38bdf8', marginTop: '2px' }}>
                {promo.code}
              </div>
            </div>

            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>قيمة الخصم</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                {promo.discount_type === 'percentage'
                  ? `خصم ${promo.discount_value}%`
                  : promo.discount_type === 'free'
                  ? 'مجاني 100%'
                  : `${promo.discount_value} نقطة`}
              </div>
            </div>

            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>مرات الاستخدام</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                {promo.used_count || 0} {promo.total_usage_limit ? `/ ${promo.total_usage_limit}` : ''}
              </div>
            </div>

            <div
              style={{
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>النقاط الموفرة</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
                {(promo.points_saved || 0).toLocaleString()} نقطة
              </div>
            </div>
          </div>

          {/* Redemptions Table Header & Refresh */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#38bdf8' }}></i>
                <span>سجل الاستخدامات ({total})</span>
              </div>
              <button
                type="button"
                onClick={() => loadData(page)}
                disabled={isLoading}
                style={{
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
                <span>تحديث</span>
              </button>
            </div>

            {/* Redemptions Table */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin fa-xl"></i>
                <p style={{ marginTop: '8px', fontSize: '0.82rem' }}>جارِ تحميل سجل الاستخدامات...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-muted)',
                }}
              >
                <i className="fa-solid fa-ticket" style={{ fontSize: '1.8rem', marginBottom: '8px', opacity: 0.4 }}></i>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>لم يتم استخدام هذا الكود في أي طلب حتى الآن.</p>
              </div>
            ) : (
              <div
                style={{
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderBottom: '1px solid var(--border-color)',
                          textAlign: isRtl ? 'right' : 'left',
                          color: 'var(--text-muted)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                        }}
                      >
                        <th style={{ padding: '10px 12px' }}>#</th>
                        <th style={{ padding: '10px 12px' }}>الطالب</th>
                        <th style={{ padding: '10px 12px' }}>رقم الطلب</th>
                        <th style={{ padding: '10px 12px' }}>قيمة الخصم</th>
                        <th style={{ padding: '10px 12px' }}>الحالة</th>
                        <th style={{ padding: '10px 12px' }}>تاريخ الاستخدام</th>
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
                        >
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.id}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {r.student_name_snapshot || (r.student_id ? `طالب #${r.student_id}` : 'طالب')}
                            </div>
                            {r.student_phone_snapshot && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.student_phone_snapshot}</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
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
                          </td>
                          <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}>
                            -{r.discount_points} نقطة
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.status === 'reversed' ? (
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
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
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {r.formatted_date || r.created_at}
                            {r.status === 'reversed' && r.formatted_reversed_date && (
                              <div style={{ fontSize: '0.7rem', color: '#f87171' }}>
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
                      padding: '10px 14px',
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

        {/* Footer */}
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
              height: '36px',
              padding: '0 18px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
