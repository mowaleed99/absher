import { ReviewsAnalytics } from '../../types/review';
import { useI18n } from '../../lib/i18n';

interface ReviewsAnalyticsWidgetsProps {
  analytics: ReviewsAnalytics | null;
}

export function ReviewsAnalyticsWidgets({ analytics }: ReviewsAnalyticsWidgetsProps) {
  const { t } = useI18n();

  if (!analytics) return null;

  const total = analytics.total_reviews || 0;
  const avg = analytics.average_rating || 0;
  const dist = analytics.rating_distribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Left / Score & Total */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            padding: '4px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{avg.toFixed(1)}</span>
          <i className="fa-solid fa-star" style={{ fontSize: '0.85rem' }}></i>
        </div>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
            {t('reviews.average_rating')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('reviews.total_reviews')}: <strong style={{ color: 'var(--text-main)' }}>{total}</strong>
          </span>
        </div>
      </div>

      {/* Right / Horizontal Mini Star Bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '1 1 300px',
          justifyContent: 'flex-end',
          maxWidth: '520px',
        }}
      >
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = dist[String(stars)] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={stars}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem',
                flex: 1,
                minWidth: '50px',
              }}
              title={`${stars} نجوم: ${count} تقييم (${percentage.toFixed(0)}%)`}
            >
              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                {stars}★
              </span>
              <div
                style={{
                  flex: 1,
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: '#fbbf24',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: '12px', textAlign: 'right' }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
