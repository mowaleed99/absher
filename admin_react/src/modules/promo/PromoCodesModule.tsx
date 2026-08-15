import { useState, useMemo } from 'react';
import { usePromoCodes } from '../../hooks/usePromoCodes';
import { PromoCode, PromoStatus } from '../../types/promo';
import { AddPromoCodeModal } from './AddPromoCodeModal';
import { EditPromoCodeModal } from './EditPromoCodeModal';
import { PromoDetailsModal } from './PromoDetailsModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function PromoCodesModule() {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const {
    promoCodes,
    isLoading,
    error,
    refresh,
    addPromoCode,
    updatePromoCode,
    togglePromoStatus,
    archivePromoCode,
    fetchRedemptions,
  } = usePromoCodes();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [detailsPromo, setDetailsPromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    const totalRedemptions = promoCodes.reduce(
      (sum, p) => sum + (p.applied_redemptions_count || p.used_count || 0),
      0
    );
    const totalPointsSaved = promoCodes.reduce((sum, p) => sum + (p.points_saved || 0), 0);
    const avgDiscount = totalRedemptions > 0 ? Math.round(totalPointsSaved / totalRedemptions) : 0;
    return { activeCount, totalRedemptions, totalPointsSaved, avgDiscount };
  }, [promoCodes]);

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        showToast(`تم نسخ الكود: ${code}`, 'success');
        setTimeout(() => setCopiedCode(null), 2000);
      }).catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  };

  const fallbackCopy = (code: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedCode(code);
      showToast(`تم نسخ الكود: ${code}`, 'success');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      showToast('تعذر النسخ التلقائي، يرجى تحديد الكود ونسخه يدوياً', 'error');
    }
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
      title: 'أرشفة كود الخصم',
      message: `هل أنت متأكد من رغبتك في أرشفة كود الخصم (${p.code})؟ سيتم حفظ كافة سجلات الاستخدام المرتبطة به.`,
      confirmText: 'أرشفة الكود',
      cancelText: 'إلغاء',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await archivePromoCode(p.id);
      showToast('تم أرشفة كود الخصم بنجاح', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل أرشفة الكود';
      showToast(msg, 'error');
    }
  };

  const renderTypeBadge = (p: PromoCode) => {
    const type = p.discount_type;
    const value = p.discount_value;
    if (type === 'percentage') {
      return (
        <div>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-block',
            }}
          >
            خصم {value}%
          </span>
          {p.max_discount_points && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              سقف: {p.max_discount_points} نقطة
            </div>
          )}
        </div>
      );
    }
    if (type === 'fixed') {
      return (
        <span
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          خصم {value} نقطة
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(192, 132, 252, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 700,
        }}
      >
        مجاني 100%
      </span>
    );
  };

  const renderStatusBadge = (status: PromoStatus) => {
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
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* 1. Header Redesign */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              إدارة أكواد الخصم والحملات الترويجية
            </h2>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              إنشاء وتخصيص ومتابعة أكواد الخصم الترويجية وسجل الاستخدام
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => refresh(false)}
            disabled={isLoading}
            title="تحديث البيانات"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>إضافة كود خصم</span>
          </button>
        </div>
      </div>

      {/* 2. Compact KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              الأكواد النشطة
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 800 }}>
              {kpiStats.activeCount}
            </strong>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              إجمالي الاستخدامات
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 800 }}>
              {kpiStats.totalRedemptions}
            </strong>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-coins"></i>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              النقاط الموفرة للطلاب
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 800 }}>
              {kpiStats.totalPointsSaved.toLocaleString()}
            </strong>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(192, 132, 252, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
              متوسط الخصم
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#c084fc', fontWeight: 800 }}>
              {kpiStats.avgDiscount} نقطة
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Professional Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '14px',
          background: 'var(--bg-card)',
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              right: isRtl ? '12px' : 'auto',
              left: isRtl ? 'auto' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          ></i>
          <input
            type="text"
            placeholder="البحث باسم الحملة أو رمز الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              paddingRight: isRtl ? '34px' : '12px',
              paddingLeft: isRtl ? '12px' : '34px',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: '36px',
            background: '#0d1527',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0 10px',
            color: '#f8fafc',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">كافة الحالات</option>
          <option value="active">نشط</option>
          <option value="paused">معطل مؤقتاً</option>
          <option value="archived">مؤرشف</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            height: '36px',
            background: '#0d1527',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0 10px',
            color: '#f8fafc',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">كافة أنواع الخصم</option>
          <option value="percentage">نسبة مئوية (%)</option>
          <option value="fixed">مبلغ ثابت (نقاط)</option>
          <option value="free">خدمة مجانية (100%)</option>
        </select>

        <span
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {filteredPromos.length} كود
        </span>

        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            style={{
              height: '36px',
              padding: '0 10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
            <span>إعادة ضبط</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f87171',
            marginBottom: '12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* 4 & 5. High-Density Table & Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.88rem' }}>جارِ تحميل أكواد الخصم...</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <i className="fa-solid fa-tags" style={{ fontSize: '2.2rem', marginBottom: '10px', opacity: 0.4 }}></i>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'لا توجد نتائج تطابق معايير البحث'
              : 'لم يتم إنشاء أي أكواد خصم بعد. انقر على "+ إضافة كود خصم" للبدء.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: isRtl ? 'right' : 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: '12px 14px' }}>الحملة والكود</th>
                  <th style={{ padding: '12px 14px' }}>نوع الخصم</th>
                  <th style={{ padding: '12px 14px' }}>الشروط والحدود</th>
                  <th style={{ padding: '12px 14px' }}>النطاق</th>
                  <th style={{ padding: '12px 14px' }}>الاستخدام</th>
                  <th style={{ padding: '12px 14px' }}>الحالة</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromos.map((p) => {
                  const usedCount = p.used_count || 0;
                  const totalLimit = p.total_usage_limit;
                  const usageRatio = totalLimit ? Math.min(100, Math.round((usedCount / totalLimit) * 100)) : null;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* 1. Campaign & Code */}
                      <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            fontSize: '0.88rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={p.campaign_name}
                        >
                          {p.campaign_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              background: '#0d1527',
                              border: '1px solid var(--border-color)',
                              color: '#38bdf8',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              letterSpacing: '0.5px',
                              maxWidth: '140px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'inline-block',
                            }}
                            title={p.code}
                          >
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(p.code)}
                            title="نسخ الكود"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedCode === p.code ? '#10b981' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '0.78rem',
                            }}
                          >
                            <i className={`fa-solid ${copiedCode === p.code ? 'fa-check' : 'fa-copy'}`}></i>
                          </button>
                        </div>
                      </td>

                      {/* 2. Discount Type */}
                      <td style={{ padding: '12px 14px' }}>
                        {renderTypeBadge(p)}
                      </td>

                      {/* 3. Conditions & Limits */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.78rem' }}>
                          {p.min_service_price_points > 0 ? `الحد الأدنى: ${p.min_service_price_points} نقطة` : 'بدون حد أدنى'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                          لكل طالب: {p.per_student_limit || 1} مرة
                        </div>
                      </td>

                      {/* 4. Scope */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-screwdriver-wrench" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}></i>
                          <span>{p.service_scope === 'all' ? 'كافة الخدمات' : `${p.service_ids?.length || 0} خدمة محددة`}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <i className="fa-solid fa-user-graduate" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}></i>
                          <span>{p.audience_scope === 'all' ? 'كافة الطلاب' : `${p.student_ids?.length || 0} طالب محدد`}</span>
                        </div>
                      </td>

                      {/* 5. Usage */}
                      <td style={{ padding: '12px 14px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{usedCount}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{totalLimit ? `/ ${totalLimit}` : '/ ∞'}</span>
                        </div>
                        {totalLimit ? (
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              background: '#0d1527',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${usageRatio}%`,
                                height: '100%',
                                background: (usageRatio || 0) >= 100 ? '#ef4444' : '#38bdf8',
                                borderRadius: '3px',
                              }}
                            ></div>
                          </div>
                        ) : null}
                      </td>

                      {/* 6. Status */}
                      <td style={{ padding: '12px 14px' }}>
                        {renderStatusBadge(p.status)}
                      </td>

                      {/* 7. Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setDetailsPromo(p)}
                            title="عرض التفاصيل وسجل الاستخدام"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              color: '#38bdf8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                            }}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>

                          {/* Edit */}
                          {p.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => setEditingPromo(p)}
                              title="تعديل كود الخصم"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                color: '#fbbf24',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          )}

                          {/* Pause / Activate */}
                          {p.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleToggle(p)}
                              title={p.status === 'active' ? 'تعطيل الكود مؤقتاً' : 'تفعيل الكود'}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: p.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: p.status === 'active' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                                color: p.status === 'active' ? '#fbbf24' : '#10b981',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                              }}
                            >
                              <i className={`fa-solid ${p.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                          )}

                          {/* Archive */}
                          {p.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(p)}
                              title="أرشفة الكود"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                              }}
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
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddPromoCodeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addPromoCode}
        />
      )}

      {editingPromo && (
        <EditPromoCodeModal
          isOpen={!!editingPromo}
          promo={editingPromo}
          onClose={() => setEditingPromo(null)}
          onUpdate={updatePromoCode}
        />
      )}

      {detailsPromo && (
        <PromoDetailsModal
          isOpen={!!detailsPromo}
          promo={detailsPromo}
          onClose={() => setDetailsPromo(null)}
          fetchRedemptions={fetchRedemptions}
        />
      )}
    </section>
  );
}
