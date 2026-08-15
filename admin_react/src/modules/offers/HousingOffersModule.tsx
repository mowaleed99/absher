import { useState, useMemo } from 'react';
import { useHousingOffers } from '../../hooks/useHousingOffers';
import { useApartments } from '../../hooks/useApartments';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { HousingOffer } from '../../types/offer';
import { AddHousingOfferModal } from './AddHousingOfferModal';
import { EditHousingOfferModal } from './EditHousingOfferModal';
import { HousingOfferDetailsModal } from './HousingOfferDetailsModal';

export function HousingOffersModule() {
  const { offers, isLoading, error, fetchOffers, addOffer, updateOffer, deleteOffer, toggleActive } = useHousingOffers();
  const { apartments } = useApartments();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<HousingOffer | null>(null);
  const [viewingOffer, setViewingOffer] = useState<HousingOffer | null>(null);

  // Helper map for apartments
  const apartmentMap = useMemo(() => {
    const map = new Map<number, (typeof apartments)[0]>();
    apartments.forEach((apt) => map.set(apt.id, apt));
    return map;
  }, [apartments]);

  // Filtered offers list
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const isAct = offer.is_active === 1 || offer.is_active === true;
      const isExp = offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();

      // Status filter
      if (statusFilter === 'active' && (!isAct || isExp)) return false;
      if (statusFilter === 'inactive' && isAct) return false;
      if (statusFilter === 'expired' && !isExp) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const apt = apartmentMap.get(offer.apartment_id);
        const matchTitle = (offer.display_title || offer.title || '').toLowerCase().includes(term);
        const matchDesc = (offer.display_desc || offer.description || '').toLowerCase().includes(term);
        const matchBadge = (offer.badge_text || '').toLowerCase().includes(term);
        const matchApt = apt ? apt.title.toLowerCase().includes(term) : false;
        const matchId = String(offer.id).includes(term) || String(offer.apartment_id).includes(term);

        return matchTitle || matchDesc || matchBadge || matchApt || matchId;
      }

      return true;
    });
  }, [offers, statusFilter, searchTerm, apartmentMap]);

  // Summary KPIs calculation
  const stats = useMemo(() => {
    const total = offers.length;
    const now = Date.now();
    const active = offers.filter((o) => (o.is_active === 1 || o.is_active === true) && (!o.expires_at || new Date(o.expires_at).getTime() >= now)).length;
    const expired = offers.filter((o) => o.expires_at && new Date(o.expires_at).getTime() < now).length;
    const inactive = offers.filter((o) => (o.is_active === 0 || o.is_active === false) && (!o.expires_at || new Date(o.expires_at).getTime() >= now)).length;

    let totalDiscount = 0;
    let discountCount = 0;
    offers.forEach((o) => {
      if (o.original_price > 0 && o.offer_price < o.original_price) {
        const pct = o.discount_percent || Math.round(((o.original_price - o.offer_price) / o.original_price) * 100);
        totalDiscount += pct;
        discountCount++;
      }
    });

    const avgDiscount = discountCount > 0 ? Math.round(totalDiscount / discountCount) : 0;

    return { total, active, expired, inactive, avgDiscount };
  }, [offers]);

  // Actions
  const handleDelete = async (offer: HousingOffer) => {
    const ok = await confirm({
      title: 'حذف عرض السكن الحصري',
      message: `هل أنت متأكد من حذف العرض #${offer.id} (${offer.display_title || offer.title})؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'نعم، احذف العرض',
      cancelText: 'إلغاء',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteOffer(offer.id);
      showToast('تم حذف عرض السكن بنجاح', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف العرض';
      showToast(msg, 'error');
    }
  };

  const handleToggleActive = async (offer: HousingOffer) => {
    try {
      const currentActive = offer.is_active === 1 || offer.is_active === true;
      await toggleActive(offer.id, currentActive);
      showToast(currentActive ? 'تم تعطيل العرض مؤقتاً' : 'تم تفعيل العرض بنجاح', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تغيير حالة العرض';
      showToast(msg, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)',
            }}
          >
            <i className="fa-solid fa-house-circle-check"></i>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              عروض السكن الحصرية
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              إدارة الخصومات والعروض الترويجية للشقق السكنية المتاحة للطلاب في تبليسي
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchOffers}
            disabled={isLoading}
            title="تحديث القائمة"
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0d1527';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#38bdf8' }}></i>
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            style={{
              height: '38px',
              padding: '0 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <i className="fa-solid fa-plus"></i>
            <span>إضافة عرض سكن</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* KPI 1: Total Offers */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '115px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي العروض</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-tags"></i>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '1.45rem', color: 'var(--text-main)', fontWeight: 800 }}>
              {stats.total}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              عرض سكن مسجل
            </span>
          </div>
        </div>

        {/* KPI 2: Active Offers */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '115px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>العروض النشطة</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '1.45rem', color: '#34d399', fontWeight: 800 }}>
              {stats.active}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              متاحة للطلاب في التطبيق
            </span>
          </div>
        </div>

        {/* KPI 3: Avg Discount */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '115px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>متوسط نسبة الخصم</span>
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
              <i className="fa-solid fa-percent"></i>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '1.45rem', color: '#fbbf24', fontWeight: 800 }}>
              %{stats.avgDiscount}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              متوسط التخفيض للشقق
            </span>
          </div>
        </div>

        {/* KPI 4: Inactive / Expired */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '115px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>المعطلة والمنتهية</span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '1.45rem', color: stats.expired + stats.inactive > 0 ? '#f87171' : 'var(--text-main)', fontWeight: 800 }}>
              {stats.expired + stats.inactive}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              {stats.expired} منتهي • {stats.inactive} معطل
            </span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Filters */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            ></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم العرض أو العنوان أو الشقة..."
              style={{
                width: '100%',
                padding: '8px 36px 8px 12px',
                borderRadius: '8px',
                background: '#0d1527',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">النشطة فقط</option>
            <option value="inactive">المعطلة مؤقتاً</option>
            <option value="expired">المنتهية الصلاحية</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            النتائج: <strong style={{ color: 'var(--text-main)' }}>{filteredOffers.length}</strong> من أصل {offers.length}
          </span>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              إعادة ضبط
            </button>
          )}
        </div>
      </div>

      {/* 4. Offers Data Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {isLoading && offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#38bdf8' }}></i>
            <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>جارِ تحميل عروض السكن الحصرية...</p>
          </div>
        ) : error && offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
            <i className="fa-solid fa-triangle-exclamation fa-2x"></i>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>
            <button
              type="button"
              onClick={fetchOffers}
              style={{
                marginTop: '10px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-tags fa-2x" style={{ opacity: 0.3, marginBottom: '10px' }}></i>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>لا توجد عروض سكن تطابق معايير البحث</p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              يمكنك إضافة عرض جديد أو إعادة ضبط معايير الفلترة
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 14px', width: '50px' }}>#</th>
                  <th style={{ padding: '12px 14px' }}>العرض والشقة المرتبطة</th>
                  <th style={{ padding: '12px 14px' }}>السعر الأصلي</th>
                  <th style={{ padding: '12px 14px' }}>سعر العرض والخصم</th>
                  <th style={{ padding: '12px 14px' }}>الشارة</th>
                  <th style={{ padding: '12px 14px' }}>فترة الصلاحية</th>
                  <th style={{ padding: '12px 14px' }}>الحالة</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const apt = apartmentMap.get(offer.apartment_id);
                  const isAct = offer.is_active === 1 || offer.is_active === true;
                  const isExp = offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();
                  const isFut = offer.starts_at && new Date(offer.starts_at).getTime() > Date.now();
                  const saving = offer.original_price - offer.offer_price;
                  const discountPct = offer.discount_percent || (offer.original_price > 0 ? Math.round((saving / offer.original_price) * 100) : 0);

                  return (
                    <tr
                      key={offer.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* ID */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        #{offer.id}
                      </td>

                      {/* Offer & Linked Apartment */}
                      <td style={{ padding: '12px 14px' }}>
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)', display: 'block' }}>
                            {offer.display_title || offer.title_ar || offer.title}
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <i className="fa-solid fa-building" style={{ fontSize: '0.68rem' }}></i>
                            <span>شقة #{offer.apartment_id}: {apt ? apt.title : `شقة ${offer.apartment_id}`}</span>
                          </span>
                        </div>
                      </td>

                      {/* Original Price */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 600 }}>
                        {offer.original_price} $
                      </td>

                      {/* Offer Price & Discount Badge */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
                            {offer.offer_price} $
                          </strong>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            %{discountPct}-
                          </span>
                        </div>
                      </td>

                      {/* Badge */}
                      <td style={{ padding: '12px 14px' }}>
                        {offer.badge_text ? (
                          <span
                            style={{
                              background: 'rgba(99, 102, 241, 0.12)',
                              color: '#818cf8',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {offer.badge_text}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>—</span>
                        )}
                      </td>

                      {/* Validity Dates */}
                      <td style={{ padding: '12px 14px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <div>{offer.starts_at ? `من: ${offer.starts_at.split(' ')[0]}` : 'فوري'}</div>
                        <div>{offer.expires_at ? `إلى: ${offer.expires_at.split(' ')[0]}` : 'مستمر'}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        {isExp ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            منتهي
                          </span>
                        ) : isFut ? (
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            مجدول
                          </span>
                        ) : isAct ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            نشط
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            معطل
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewingOffer(offer)}
                            title="عرض تفاصيل العرض"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              background: '#0d1527',
                              border: '1px solid var(--border-color)',
                              color: '#38bdf8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="fa-solid fa-eye" style={{ fontSize: '0.76rem' }}></i>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setEditingOffer(offer)}
                            title="تعديل العرض"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              background: '#0d1527',
                              border: '1px solid var(--border-color)',
                              color: '#818cf8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: '0.76rem' }}></i>
                          </button>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(offer)}
                            title={isAct ? 'تعطيل العرض مؤقتاً' : 'تفعيل العرض'}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              background: '#0d1527',
                              border: '1px solid var(--border-color)',
                              color: isAct ? '#fbbf24' : '#34d399',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className={`fa-solid ${isAct ? 'fa-pause' : 'fa-play'}`} style={{ fontSize: '0.76rem' }}></i>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(offer)}
                            title="حذف العرض"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              background: '#0d1527',
                              border: '1px solid var(--border-color)',
                              color: '#f87171',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="fa-solid fa-trash-can" style={{ fontSize: '0.76rem' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AddHousingOfferModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addOffer}
      />

      {/* Edit Modal */}
      <EditHousingOfferModal
        isOpen={!!editingOffer}
        offer={editingOffer}
        onClose={() => setEditingOffer(null)}
        onUpdate={updateOffer}
      />

      {/* Details Modal */}
      <HousingOfferDetailsModal
        isOpen={!!viewingOffer}
        offer={viewingOffer}
        apartment={viewingOffer ? apartmentMap.get(viewingOffer.apartment_id) : null}
        onClose={() => setViewingOffer(null)}
        onEdit={() => {
          if (viewingOffer) {
            setEditingOffer(viewingOffer);
          }
        }}
      />
    </div>
  );
}
