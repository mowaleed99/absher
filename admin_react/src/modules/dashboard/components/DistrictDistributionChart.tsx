import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Apartment } from '../../../types/apartment';
import { useI18n } from '../../../lib/i18n';
import { useDistricts } from '../../../hooks/useDistricts';

interface DistrictDistributionChartProps {
  apartments: Apartment[];
}

export function DistrictDistributionChart({ apartments }: DistrictDistributionChartProps) {
  const { lang } = useI18n();
  const { districts } = useDistricts();
  const isRtl = lang === 'ar';
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Curated elegant color palette for the ranks
  const rankColors = [
    { text: '#a855f7', bar: 'linear-gradient(90deg, #a855f7, #c084fc)', bg: 'rgba(168, 85, 247, 0.15)' },
    { text: '#38bdf8', bar: 'linear-gradient(90deg, #0284c7, #38bdf8)', bg: 'rgba(56, 189, 248, 0.15)' },
    { text: '#10b981', bar: 'linear-gradient(90deg, #059669, #10b981)', bg: 'rgba(16, 185, 129, 0.15)' },
    { text: '#fbbf24', bar: 'linear-gradient(90deg, #d97706, #fbbf24)', bg: 'rgba(251, 191, 36, 0.15)' },
    { text: '#f43f5e', bar: 'linear-gradient(90deg, #e11d48, #f43f5e)', bg: 'rgba(244, 63, 94, 0.15)' },
  ];

  // Process and compute distribution across all districts
  const { activeDistricts, allDistrictItems, totalApartments, topDistrictName } = useMemo(() => {
    const total = apartments.length || 0;
    const countByDistrictId = new Map<number, number>();
    let otherCount = 0;

    const districtById = new Map<number, typeof districts[0]>();
    const districtNames: Array<{ id: number; name: string; name_ar: string; name_en: string }> = [];

    districts.forEach((d) => {
      districtById.set(d.id, d);
      districtNames.push({
        id: d.id,
        name: (d.name || '').toLowerCase().trim(),
        name_ar: (d.name_ar || '').toLowerCase().trim(),
        name_en: (d.name_en || '').toLowerCase().trim(),
      });
    });

    apartments.forEach((apt) => {
      let matchedId: number | undefined;

      if (apt.district_id && districtById.has(Number(apt.district_id))) {
        matchedId = Number(apt.district_id);
      }

      if (!matchedId) {
        const rawLoc = `${apt.location || ''} ${apt.location_ar || ''} ${apt.location_en || ''}`.toLowerCase();
        for (const d of districtNames) {
          if (
            (d.name_ar && rawLoc.includes(d.name_ar)) ||
            (d.name_en && rawLoc.includes(d.name_en)) ||
            (d.name && rawLoc.includes(d.name))
          ) {
            matchedId = d.id;
            break;
          }
        }
      }

      if (matchedId) {
        countByDistrictId.set(matchedId, (countByDistrictId.get(matchedId) || 0) + 1);
      } else {
        otherCount++;
      }
    });

    // Map all districts
    const items = districts.map((d, idx) => {
      const count = countByDistrictId.get(d.id) || 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const displayName = isRtl ? (d.name_ar || d.name) : (d.name_en || d.name || d.name_ar);

      return {
        id: d.id,
        name: displayName,
        count,
        percent,
        colorObj: rankColors[idx % rankColors.length],
      };
    });

    if (otherCount > 0) {
      items.push({
        id: -1,
        name: isRtl ? 'مناطق أخرى' : 'Other Areas',
        count: otherCount,
        percent: total > 0 ? Math.round((otherCount / total) * 100) : 0,
        colorObj: { text: '#94a3b8', bar: 'linear-gradient(90deg, #64748b, #94a3b8)', bg: 'rgba(148, 163, 184, 0.15)' },
      });
    }

    // Sort active ones first descending
    items.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, isRtl ? 'ar' : 'en');
    });

    const active = items.filter((d) => d.count > 0);
    const topName = active.length > 0 ? active[0].name : '';

    return {
      activeDistricts: active,
      allDistrictItems: items,
      totalApartments: total,
      topDistrictName: topName,
    };
  }, [apartments, districts, isRtl]);

  const coveragePercent = districts.length > 0 ? Math.round((activeDistricts.length / districts.length) * 100) : 0;

  // Filtered districts for the full list modal
  const modalFilteredDistricts = useMemo(() => {
    if (!modalSearch.trim()) return allDistrictItems;
    const q = modalSearch.trim().toLowerCase();
    return allDistrictItems.filter(d => d.name.toLowerCase().includes(q));
  }, [allDistrictItems, modalSearch]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        justifyContent: 'space-between',
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(56, 189, 248, 0.2))',
              color: '#a855f7',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {isRtl ? 'التوزيع الجغرافي للشقق' : 'District Distribution'}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isRtl ? 'تغطية الأحياء والمناطق في تبليسي' : 'Neighborhoods & housing coverage in Tbilisi'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          style={{
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)';
          }}
        >
          <i className="fa-solid fa-layer-group" style={{ fontSize: '0.7rem' }}></i>
          {isRtl ? `كافة الأحياء (${districts.length || 31})` : `All 31 Districts`}
        </button>
      </div>

      {/* 2. Main Stats Grid: Big Coverage Box + Sleek Horizontal Rank Bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '18px',
          alignItems: 'center',
          marginTop: '2px',
        }}
      >
        {/* Big Coverage Highlight Box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(56, 189, 248, 0.05))',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            minWidth: '110px',
            textAlign: 'center',
          }}
        >
          <strong style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a855f7', lineHeight: 1 }}>
            {activeDistricts.length}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{districts.length || 31}</span>
          </strong>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {isRtl ? `تغطية ${coveragePercent}% من الأحياء` : `${coveragePercent}% Coverage`}
          </span>
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '8px',
            }}
          >
            {totalApartments} {isRtl ? 'شقة مسجلة' : 'Apartments'}
          </div>
        </div>

        {/* Horizontal Progress Bars for Top Active Districts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeDistricts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-map-pin" style={{ marginBottom: '6px', fontSize: '1.2rem', display: 'block', opacity: 0.5 }}></i>
              {isRtl ? 'لا توجد شقق مسجلة حالياً' : 'No active apartments registered yet'}
            </div>
          ) : (
            activeDistricts.slice(0, 4).map((d, index) => {
              const colorInfo = rankColors[index % rankColors.length];
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  {/* Rank number */}
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: colorInfo.bg,
                      color: colorInfo.text,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>

                  {/* District Name */}
                  <span
                    style={{
                      width: '95px',
                      color: 'var(--text-main)',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '0.76rem',
                    }}
                    title={d.name}
                  >
                    {d.name}
                  </span>

                  {/* Progress bar */}
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${d.percent}%`,
                        background: colorInfo.bar,
                        borderRadius: '10px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {/* Count & Percentage Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: colorInfo.text, fontWeight: 700 }}>
                      {d.count} {isRtl ? 'شقة' : 'apt'}
                    </span>
                    <span
                      style={{
                        background: colorInfo.bg,
                        color: colorInfo.text,
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '6px',
                      }}
                    >
                      {d.percent}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Subtle Footer Link / Quick Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '8px',
        }}
      >
        <span>
          {topDistrictName ? (
            <>
              <i className="fa-solid fa-fire" style={{ color: '#f59e0b', marginLeft: '4px' }}></i>
              {isRtl ? `الأكثر طلباً: ${topDistrictName}` : `Top area: ${topDistrictName}`}
            </>
          ) : (
            isRtl ? '31 حي معتمد في تبليسي' : '31 official Tbilisi districts'
          )}
        </span>

        <Link
          to="/districts"
          style={{
            color: 'var(--primary)',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isRtl ? 'إدارة المناطق' : 'Manage Districts'}
          <i className={`fa-solid ${isRtl ? 'fa-arrow-left' : 'fa-arrow-right'}`} style={{ fontSize: '0.65rem' }}></i>
        </Link>
      </div>

      {/* 4. Sleek Interactive Modal for All 31 Districts (Opened on clicking button) */}
      {showAllModal && (
        <div
          className="modal-overlay active"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllModal(false);
          }}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: '650px',
              width: '90%',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                  }}
                >
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    {isRtl ? 'توزيع الشقق في كافة أحياء تبليسي' : 'All 31 Tbilisi Districts Distribution'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isRtl
                      ? `${activeDistricts.length} حي نشط به شقق من أصل ${districts.length || 31} حي`
                      : `${activeDistricts.length} active with listings out of ${districts.length || 31} total`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث عن أي حي من الـ 31 حي في تبليسي...' : 'Search any of the 31 districts...'}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  [isRtl ? 'left' : 'right']: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              ></i>
            </div>

            {/* District Grid / Cards in Modal */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '8px',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {modalFilteredDistricts.map((d) => {
                const isActive = d.count > 0;
                return (
                  <div
                    key={d.id}
                    style={{
                      background: isActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isActive ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ overflow: 'hidden', paddingRight: isRtl ? '0' : '6px', paddingLeft: isRtl ? '6px' : '0' }}>
                      <strong
                        style={{
                          fontSize: '0.82rem',
                          color: isActive ? '#fff' : 'var(--text-muted)',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {d.name}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: isActive ? '#c084fc' : '#64748b' }}>
                        {isActive ? `${d.count} ${isRtl ? 'شقة مسجلة' : 'listings'}` : (isRtl ? 'شاغر' : 'Empty')}
                      </span>
                    </div>

                    {isActive && (
                      <span
                        style={{
                          background: 'rgba(168, 85, 247, 0.2)',
                          color: '#c084fc',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                      >
                        {d.percent}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAllModal(false)}
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
