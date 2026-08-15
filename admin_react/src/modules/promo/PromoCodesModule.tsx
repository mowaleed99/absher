import { useState, useMemo } from 'react';
import { usePromoCodes } from '../../hooks/usePromoCodes';
import { PromoCode, DiscountType, PromoStatus } from '../../types/promo';
import { AddPromoCodeModal } from './AddPromoCodeModal';
import { EditPromoCodeModal } from './EditPromoCodeModal';
import { PromoDetailsModal } from './PromoDetailsModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function PromoCodesModule() {
  const { t, lang } = useI18n();
  const { promoCodes, isLoading, error, refresh, addPromoCode, updatePromoCode, togglePromoStatus, archivePromoCode, fetchRedemptions } = usePromoCodes();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [detailsPromo, setDetailsPromo] = useState<PromoCode | null>(null);

  // Filtered list
  const filteredPromos = useMemo(() => {
    return promoCodes.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.discount_type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const codeMatch = p.code.toLowerCase().includes(query);
        const nameMatch = p.campaign_name.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [promoCodes, statusFilter, typeFilter, searchTerm]);

  // Aggregate summary KPIs
  const kpiStats = useMemo(() => {
    const activeCount = promoCodes.filter((p) => p.status === 'active').length;
    const totalRedemptions = promoCodes.reduce((sum, p) => sum + (p.applied_redemptions_count || p.used_count || 0), 0);
    const totalPointsSaved = promoCodes.reduce((sum, p) => sum + (p.points_saved || 0), 0);
    const avgDiscount = totalRedemptions > 0 ? Math.round(totalPointsSaved / totalRedemptions) : 0;
    return { activeCount, totalRedemptions, totalPointsSaved, avgDiscount };
  }, [promoCodes]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(t('promo.copied'), 'success');
  };

  const handleToggle = async (p: PromoCode) => {
    try {
      await togglePromoStatus(p.id);
      showToast(p.status === 'active' ? 'تم تعطيل الكود مؤقتاً' : 'تم تفعيل الكود بنجاح', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تغيير حالة الكود';
      showToast(msg, 'error');
    }
  };

  const handleArchive = async (p: PromoCode) => {
    const isConfirmed = await confirm({
      title: t('promo.archive'),
      message: t('promo.confirm_archive', { code: p.code }),
      confirmText: 'أرشفة',
      cancelText: 'إلغاء',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await archivePromoCode(p.id);
      showToast('تم أرشفة الكود بنجاح', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل أرشفة الكود';
      showToast(msg, 'error');
    }
  };

  const renderTypeBadge = (type: DiscountType, value: number) => {
    if (type === 'percentage') {
      return (
        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
          خصم {value}%
        </span>
      );
    }
    if (type === 'fixed') {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
          خصم {value} نقطة
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '4px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
        خدمة مجانية 100%
      </span>
    );
  };

  const renderStatusBadge = (status: PromoStatus) => {
    if (status === 'active') {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
          نشط
        </span>
      );
    }
    if (status === 'paused') {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
          معطل مؤقتاً
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
        مؤرشف
      </span>
    );
  };

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <i className="fa-solid fa-tags" style={{ color: '#38bdf8' }}></i>
            {t('promo.title')}
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('promo.desc')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={refresh}
            disabled={isLoading}
            title="تحديث البيانات"
          >
            <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>{t('promo.add_button')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('promo.kpi_active')}</span>
            <i className="fa-solid fa-circle-check" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>{kpiStats.activeCount}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('promo.kpi_redemptions')}</span>
            <i className="fa-solid fa-receipt" style={{ color: '#38bdf8', fontSize: '1.2rem' }}></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#38bdf8' }}>{kpiStats.totalRedemptions}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('promo.kpi_points_saved')}</span>
            <i className="fa-solid fa-coins" style={{ color: '#fbbf24', fontSize: '1.2rem' }}></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>{kpiStats.totalPointsSaved}</div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t('promo.kpi_avg_discount')}</span>
            <i className="fa-solid fa-chart-line" style={{ color: '#a855f7', fontSize: '1.2rem' }}></i>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#a855f7' }}>{kpiStats.avgDiscount} نقطة</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input-field"
            placeholder={t('promo.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t('promo.filter_all_status')}</option>
            <option value="active">{t('promo.filter_active')}</option>
            <option value="paused">{t('promo.filter_paused')}</option>
            <option value="archived">{t('promo.filter_archived')}</option>
          </select>
        </div>
        <div style={{ minWidth: '150px' }}>
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{t('promo.filter_all_types')}</option>
            <option value="percentage">{t('promo.filter_percentage')}</option>
            <option value="fixed">{t('promo.filter_fixed')}</option>
            <option value="free">{t('promo.filter_free')}</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px', color: '#f87171', marginBottom: '1rem' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: '8px' }}></i> {error}
        </div>
      )}

      {/* Table & Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '12px' }}></i>
          <p>جارِ تحميل أكواد الخصم...</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-tags" style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}></i>
          <p>{t('promo.empty_state')}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: lang === 'ar' ? 'right' : 'left', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '14px 16px' }}>{t('promo.campaign_name')} والكود</th>
                <th style={{ padding: '14px 16px' }}>{t('promo.discount_type')}</th>
                <th style={{ padding: '14px 16px' }}>الشروط والحدود</th>
                <th style={{ padding: '14px 16px' }}>{t('promo.scope')}</th>
                <th style={{ padding: '14px 16px' }}>{t('promo.usage')}</th>
                <th style={{ padding: '14px 16px' }}>{t('promo.status')}</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>{t('promo.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromos.map((p) => {
                const isExhausted = p.total_usage_limit !== null && p.used_count >= p.total_usage_limit;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.campaign_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
                          {p.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(p.code)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px' }}
                          title={t('promo.copy_code')}
                        >
                          <i className="fa-regular fa-copy"></i>
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {renderTypeBadge(p.discount_type, p.discount_value)}
                      {p.max_discount_points && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          سقف: {p.max_discount_points} نقطة
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>حد أدنى: {p.min_service_price_points > 0 ? `${p.min_service_price_points} نقطة` : 'بدون'}</div>
                      <div>لكل طالب: {p.per_student_limit} مرة</div>
                      {p.expires_at && (
                        <div style={{ color: new Date() > new Date(p.expires_at) ? '#f87171' : 'var(--text-secondary)' }}>
                          ينتهي: {p.expires_at.slice(0, 10)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>
                      <div>
                        الخدمات: {p.service_scope === 'all' ? 'الكل' : `${p.service_ids.length} محددة`}
                      </div>
                      <div>
                        الجمهور: {p.audience_scope === 'all' ? 'الكل' : `${p.student_ids.length} طلاب`}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>{p.used_count} استخدام</span>
                        <span>{p.total_usage_limit ? `/ ${p.total_usage_limit}` : '∞'}</span>
                      </div>
                      {p.total_usage_limit && (
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (p.used_count / p.total_usage_limit) * 100)}%`,
                              height: '100%',
                              background: isExhausted ? '#ef4444' : '#38bdf8',
                            }}
                          />
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {renderStatusBadge(p.status)}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => setDetailsPromo(p)}
                          title={t('promo.view_details')}
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => setEditingPromo(p)}
                          title={t('promo.edit')}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        {p.status !== 'archived' && (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleToggle(p)}
                            title={p.status === 'active' ? t('promo.toggle_pause') : t('promo.toggle_active')}
                            style={{ color: p.status === 'active' ? '#fbbf24' : '#10b981' }}
                          >
                            <i className={`fa-solid ${p.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                        )}
                        {p.status !== 'archived' && (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleArchive(p)}
                            title={t('promo.archive')}
                            style={{ color: '#f87171' }}
                          >
                            <i className="fa-solid fa-box-archive"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddPromoCodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addPromoCode}
      />

      <EditPromoCodeModal
        isOpen={!!editingPromo}
        onClose={() => setEditingPromo(null)}
        promo={editingPromo}
        onUpdate={updatePromoCode}
      />

      <PromoDetailsModal
        isOpen={!!detailsPromo}
        onClose={() => setDetailsPromo(null)}
        promo={detailsPromo}
        fetchRedemptions={fetchRedemptions}
      />
    </div>
  );
}
