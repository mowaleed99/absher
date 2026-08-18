import { useI18n } from '../../../lib/i18n';

interface RatingBreakdownChartProps {
  avgRating: number;
  ratingDistribution: Record<string, number>;
}

export function RatingBreakdownChart({ avgRating, ratingDistribution }: RatingBreakdownChartProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';

  const totalReviews = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);
  const displayRating = avgRating > 0 ? avgRating.toFixed(1) : '5.0';

  const stars = [5, 4, 3, 2, 1];

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
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            <i className="fa-solid fa-star-half-stroke"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {isRtl ? 'مؤشر رضا الطلاب والتقييمات' : 'Student Rating & Satisfaction'}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isRtl ? 'تحليل جودة الخدمات ورضا العملاء' : 'Service quality & feedback analytics'}
            </span>
          </div>
        </div>

        <span
          style={{
            background: 'rgba(251, 191, 36, 0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            padding: '3px 8px',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {totalReviews} {isRtl ? 'تقييم مسجل' : 'Reviews'}
        </span>
      </div>

      {/* Main Stats Grid: Big Score + Bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '18px',
          alignItems: 'center',
          marginTop: '4px',
        }}
      >
        {/* Big Score Box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(251, 191, 36, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '12px',
            padding: '12px 18px',
            minWidth: '100px',
          }}
        >
          <strong style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
            {displayRating}
          </strong>
          <div style={{ display: 'flex', gap: '3px', color: '#fbbf24', fontSize: '0.82rem', margin: '4px 0' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <i
                key={s}
                className={
                  s <= Math.floor(Number(displayRating))
                    ? 'fa-solid fa-star'
                    : s - Number(displayRating) <= 0.5
                    ? 'fa-solid fa-star-half-stroke'
                    : 'fa-regular fa-star'
                }
              />
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'من 5.0 نقاط' : 'out of 5.0'}
          </span>
        </div>

        {/* 5-Star Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {stars.map((star) => {
            const count = ratingDistribution[String(star)] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : (star === 5 ? 100 : 0);
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                <span style={{ minWidth: '24px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {star} <i className="fa-solid fa-star" style={{ color: '#fbbf24', fontSize: '0.65rem' }}></i>
                </span>
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
                      width: `${pct}%`,
                      background: star >= 4 ? '#fbbf24' : star === 3 ? '#60a5fa' : '#f87171',
                      borderRadius: '10px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <span style={{ minWidth: '32px', textAlign: isRtl ? 'left' : 'right', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
