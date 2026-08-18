import { useMemo } from 'react';
import { Apartment } from '../../../types/apartment';
import { useI18n } from '../../../lib/i18n';

interface DistrictDistributionChartProps {
  apartments: Apartment[];
}

export function DistrictDistributionChart({ apartments }: DistrictDistributionChartProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';

  const districtData = useMemo(() => {
    const counts: Record<string, number> = {};

    apartments.forEach((apt) => {
      let loc = (isRtl ? apt.location_ar || apt.location : apt.location_en || apt.location) || '';
      loc = loc.trim();
      if (!loc) {
        loc = isRtl ? 'تبليسي (أخرى)' : 'Tbilisi (Other)';
      } else {
        // Clean up common prefixes
        loc = loc.split(',')[0].trim();
      }
      counts[loc] = (counts[loc] || 0) + 1;
    });

    const total = apartments.length || 1;
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 districts

    return sorted;
  }, [apartments, isRtl]);

  const maxCount = Math.max(...districtData.map((d) => d.count), 1);

  // Palette for districts
  const colors = ['#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#f472b6'];

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
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(244, 114, 182, 0.2))',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
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
              {isRtl ? 'التوزيع الجغرافي للشقق' : 'Apartment District Distribution'}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isRtl ? 'أكثر المناطق توفراً للسكن الطلابي' : 'Top student accommodation locations'}
            </span>
          </div>
        </div>

        <span
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '3px 8px',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {apartments.length} {isRtl ? 'شقة' : 'Apartments'}
        </span>
      </div>

      {/* Progress Bars */}
      {districtData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          {isRtl ? 'لا توجد بيانات مناطق مسجلة' : 'No district data available'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          {districtData.map((d, idx) => {
            const color = colors[idx % colors.length];
            const barWidth = Math.max((d.count / maxCount) * 100, 8);
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: color, fontWeight: 700 }}>{d.count} {isRtl ? 'شقة' : 'apts'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({d.percent}%)</span>
                  </div>
                </div>
                <div
                  style={{
                    height: '7px',
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                      borderRadius: '10px',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
