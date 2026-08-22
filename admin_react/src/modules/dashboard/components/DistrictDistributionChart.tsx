import { useState, useMemo } from 'react';
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

  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'empty'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Palette for charts and badges
  const palette = [
    '#a855f7', '#38bdf8', '#10b981', '#fbbf24', '#f43f5e',
    '#6366f1', '#14b8a6', '#f97316', '#ec4899', '#8b5cf6'
  ];

  // Process and compute distribution across all districts
  const { allDistrictItems, activeDistricts, topDistricts, totalApartments } = useMemo(() => {
    const total = apartments.length || 0;
    const countByDistrictId = new Map<number, number>();
    let otherCount = 0;

    // Build lookup maps for fast matching
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

      // 1. Direct match by district_id
      if (apt.district_id && districtById.has(Number(apt.district_id))) {
        matchedId = Number(apt.district_id);
      }

      // 2. Match by location text
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

    // Map all 31 districts
    const items = districts.map((d, index) => {
      const count = countByDistrictId.get(d.id) || 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const displayName = isRtl ? (d.name_ar || d.name) : (d.name_en || d.name || d.name_ar);
      const color = palette[index % palette.length];

      return {
        id: d.id,
        name: displayName,
        count,
        percent,
        color,
      };
    });

    // If there are unassigned apartments, add "Other"
    if (otherCount > 0) {
      items.push({
        id: -1,
        name: isRtl ? 'مناطق أخرى' : 'Other Areas',
        count: otherCount,
        percent: total > 0 ? Math.round((otherCount / total) * 100) : 0,
        color: '#64748b',
      });
    }

    // Sort active ones first by count descending, then alphabetical
    items.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, isRtl ? 'ar' : 'en');
    });

    const active = items.filter((d) => d.count > 0);
    const top = active.slice(0, 4);

    return {
      allDistrictItems: items,
      activeDistricts: active,
      topDistricts: top,
      totalApartments: total,
    };
  }, [apartments, districts, isRtl]);

  // Filtered list based on user search and active/empty tab
  const displayedDistricts = useMemo(() => {
    return allDistrictItems.filter((d) => {
      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        if (!d.name.toLowerCase().includes(q)) return false;
      }

      // Tab filter
      if (filterMode === 'active' && d.count === 0) return false;
      if (filterMode === 'empty' && d.count > 0) return false;

      return true;
    });
  }, [allDistrictItems, searchTerm, filterMode]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(56, 189, 248, 0.2))',
              color: '#a855f7',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {isRtl ? 'التوزيع الجغرافي للشقق والأحياء' : 'District Distribution & Coverage'}
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isRtl
                ? `تغطية شاملة لـ ${districts.length || 31} حي ومنطقة سكنية في تبليسي`
                : `Comprehensive coverage across ${districts.length || 31} Tbilisi districts`}
            </span>
          </div>
        </div>

        {/* Coverage Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
            {activeDistricts.length} {isRtl ? `من أصل ${districts.length || 31} حي مغطى` : `of ${districts.length || 31} active`}
          </span>
          <span
            style={{
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#a855f7',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {totalApartments} {isRtl ? 'شقة مسجلة' : 'Apartments'}
          </span>
        </div>
      </div>

      {/* Proportional Multi-Segment Ribbon Bar */}
      {activeDistricts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              height: '8px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {activeDistricts.map((d, i) => (
              <div
                key={d.id}
                title={`${d.name}: ${d.count} (${d.percent}%)`}
                style={{
                  height: '100%',
                  width: `${d.percent}%`,
                  background: d.color,
                  transition: 'width 0.4s ease',
                  borderRight: i < activeDistricts.length - 1 ? '1px solid #0f172a' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Highlights Spotlight Cards */}
      {topDistricts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
          }}
        >
          {topDistricts.map((d, index) => {
            const rankBadges = ['🥇', '🥈', '🥉', '⭐'];
            return (
              <div
                key={d.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${d.color}35`,
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{rankBadges[index] || '📍'}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: d.color,
                      background: `${d.color}15`,
                      padding: '1px 6px',
                      borderRadius: '8px',
                    }}
                  >
                    {d.percent}%
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: d.color }}>{d.count}</strong> {isRtl ? 'شقة' : 'apts'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Tabs & Quick Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.2)', padding: '3px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              border: 'none',
              background: filterMode === 'all' ? 'var(--primary, #a855f7)' : 'transparent',
              color: filterMode === 'all' ? '#fff' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isRtl ? `كل الأحياء (${allDistrictItems.length})` : `All (${allDistrictItems.length})`}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            style={{
              border: 'none',
              background: filterMode === 'active' ? '#10b981' : 'transparent',
              color: filterMode === 'active' ? '#fff' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isRtl ? `نشطة بها سكن (${activeDistricts.length})` : `Active (${activeDistricts.length})`}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('empty')}
            style={{
              border: 'none',
              background: filterMode === 'empty' ? '#64748b' : 'transparent',
              color: filterMode === 'empty' ? '#fff' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isRtl
              ? `شاغرة (${allDistrictItems.length - activeDistricts.length})`
              : `Empty (${allDistrictItems.length - activeDistricts.length})`}
          </button>
        </div>

        {/* Quick Search within 31 Districts */}
        <div style={{ position: 'relative', minWidth: '160px', flex: '1 1 180px', maxWidth: '240px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'بحث في الـ 31 حي...' : 'Filter 31 districts...'}
            style={{
              width: '100%',
              padding: '6px 12px',
              paddingLeft: isRtl ? '28px' : '12px',
              paddingRight: isRtl ? '12px' : '28px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                left: isRtl ? '8px' : 'auto',
                right: isRtl ? 'auto' : '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Full 31 Districts Interactive Chips Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '8px',
          maxHeight: '220px',
          overflowY: 'auto',
          paddingRight: isRtl ? '0' : '4px',
          paddingLeft: isRtl ? '4px' : '0',
        }}
      >
        {displayedDistricts.map((d) => {
          const hasApts = d.count > 0;
          return (
            <div
              key={d.id}
              style={{
                padding: '7px 10px',
                borderRadius: '10px',
                background: hasApts ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.15)',
                border: hasApts ? `1px solid ${d.color}50` : '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: hasApts ? d.color : '#475569',
                    flexShrink: 0,
                  }}
                />
                <span
                  title={d.name}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: hasApts ? 700 : 500,
                    color: hasApts ? 'var(--text-main)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.name}
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: hasApts ? d.color : '#64748b',
                  background: hasApts ? `${d.color}18` : 'rgba(255, 255, 255, 0.03)',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
