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
  const { t, lang } = useI18n();
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
      setRedemptions(res.redemptions);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
      // ignore
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>
            <i className="fa-solid fa-receipt" style={{ color: '#38bdf8', marginLeft: lang === 'ar' ? '8px' : 0, marginRight: lang === 'en' ? '8px' : 0 }}></i>
            {t('promo.redemptions_title')} — {promo.code}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>رمز الكود</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#38bdf8' }}>{promo.code}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>قيمة الخصم</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>
                {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : promo.discount_type === 'free' ? 'مجاني 100%' : `${promo.discount_value} نقطة`}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>مرات الاستخدام</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {promo.used_count} {promo.total_usage_limit ? `/ ${promo.total_usage_limit}` : ''}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>إجمالي النقاط المخصومة</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a855f7' }}>
                {promo.points_saved || 0} نقطة
              </div>
            </div>
          </div>

          {/* Redemptions Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                سجل الاستخدامات ({total})
              </h4>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                onClick={() => loadData(page)}
                disabled={isLoading}
              >
                <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`}></i> تحديث
              </button>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                <p>جارِ تحميل سجل الاستخدامات...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}></i>
                <p>{t('promo.no_redemptions')}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      <th style={{ padding: '10px 12px' }}>رقم الطلب</th>
                      <th style={{ padding: '10px 12px' }}>اسم الطالب</th>
                      <th style={{ padding: '10px 12px' }}>الخدمة</th>
                      <th style={{ padding: '10px 12px' }}>السعر الأصلي</th>
                      <th style={{ padding: '10px 12px' }}>الخصم</th>
                      <th style={{ padding: '10px 12px' }}>المبلغ المدفوع</th>
                      <th style={{ padding: '10px 12px' }}>الحالة</th>
                      <th style={{ padding: '10px 12px' }}>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>#{r.request_id_snapshot}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>{r.student_name_snapshot || 'طالب'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.student_phone_snapshot}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{r.service_title_snapshot}</td>
                        <td style={{ padding: '10px 12px' }}>{r.original_price_points} نقطة</td>
                        <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 'bold' }}>-{r.discount_points} نقطة</td>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{r.final_price_points} نقطة</td>
                        <td style={{ padding: '10px 12px' }}>
                          {r.status === 'applied' ? (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                              تم الاستخدام
                            </span>
                          ) : (
                            <div>
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                مسترجع (ملغي)
                              </span>
                              {r.reversed_reason && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  السبب: {r.reversed_reason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {r.formatted_date || r.created_at}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                  disabled={page <= 1 || isLoading}
                  onClick={() => loadData(page - 1)}
                >
                  السابق
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  صفحة {page} من {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                  disabled={page >= totalPages || isLoading}
                  onClick={() => loadData(page + 1)}
                >
                  التالي
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-primary" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
