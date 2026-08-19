import { useState, useMemo } from 'react';
import { useReviews } from '../../hooks/useReviews';
import { useBadges } from '../../contexts/BadgesContext';
import { ServiceReview, ReviewsAnalytics } from '../../types/review';
import { ReviewCard } from './ReviewCard';
import { ReviewsAnalyticsWidgets } from './ReviewsAnalyticsWidgets';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function ReviewsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { reviews, analytics, isLoading, error, refetch, moderateReview, deleteReview } = useReviews();
  const { refetchBadges } = useBadges();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFocused, setIsFocused] = useState(false);

  const statusOptions = [
    { key: 'all', label: t('reviews.status_all'), icon: 'fa-layer-group' },
    { key: 'pending', label: t('reviews.status_pending'), icon: 'fa-clock' },
    { key: 'approved', label: t('reviews.status_approved'), icon: 'fa-circle-check' },
    { key: 'rejected', label: t('reviews.status_rejected'), icon: 'fa-ban' },
    { key: 'low_rating', label: lang === 'ar' ? 'تقييمات منخفضة (1-2 ★)' : 'Low Ratings (1-2 ★)', icon: 'fa-triangle-exclamation', color: '#ef4444' },
  ];

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Status / Rating Filter
      if (statusFilter === 'low_rating') {
        if ((r.rating || 0) > 2) return false;
      } else if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesStudent = r.student_name && r.student_name.toLowerCase().includes(q);
        const matchesUni = r.uni && r.uni.toLowerCase().includes(q);
        const matchesComment = r.comment && r.comment.toLowerCase().includes(q);
        const matchesId = String(r.id) === q;
        if (!matchesStudent && !matchesUni && !matchesComment && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, statusFilter, searchQuery]);

  const liveAnalytics = useMemo<ReviewsAnalytics>(() => {
    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    const total = approvedReviews.length;
    const sum = approvedReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = total > 0 ? Number((sum / total).toFixed(2)) : 0;
    const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    approvedReviews.forEach((r) => {
      const star = String(Math.min(5, Math.max(1, Math.round(r.rating || 0))));
      dist[star] = (dist[star] || 0) + 1;
    });

    return {
      total_reviews: total,
      average_rating: avg,
      rating_distribution: dist,
      service_analytics: analytics?.service_analytics || [],
    };
  }, [reviews, analytics]);

  const handleModerate = async (id: number, status: 'approved' | 'rejected') => {
    const res = await moderateReview(id, status);
    if (res.success) {
      showToast(t('msg.review_moderated'), 'success');
      refetchBadges();
    } else {
      showToast(res.error || t('msg.error_moderate_review'), 'error');
    }
  };

  const handleDelete = async (review: ServiceReview) => {
    const confirmed = await confirm({
      title: t('dialog.delete_review_title'),
      message: `${t('dialog.delete_review_msg')} (تقييم #${review.id} - ${review.student_name})`,
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    const res = await deleteReview(review.id);
    if (res.success) {
      showToast(t('msg.review_deleted'), 'success');
      refetchBadges();
    } else {
      showToast(res.error || t('msg.error_delete_review'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-star" style={{ color: '#fbbf24', marginLeft: '8px' }}></i>
            {t('reviews.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.85rem' }}>
            {t('reviews.desc')}
          </p>
        </div>
      </div>

      {/* Analytics Overview Strip */}
      <ReviewsAnalyticsWidgets analytics={liveAnalytics} />

      {/* Unified Compact Toolbar: Status Filter Pills + Search + Count */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.key;
            const count = opt.key === 'all'
              ? reviews.length
              : opt.key === 'low_rating'
              ? reviews.filter((r) => (r.rating || 0) <= 2).length
              : reviews.filter((r) => r.status === opt.key).length;

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-main)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  boxShadow: isActive ? '0 0 10px var(--primary-glow)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className={`fa-solid ${opt.icon}`} style={{ fontSize: '0.75rem' }}></i>
                <span>{opt.label}</span>
                <span
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 240px',
            maxWidth: '440px',
          }}
        >
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          ></i>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('reviews.search_placeholder')}
            style={{
              width: '100%',
              height: '38px',
              paddingRight: isRtl ? '36px' : '32px',
              paddingLeft: isRtl ? '32px' : '36px',
              borderRadius: '10px',
              border: isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none',
              boxShadow: isFocused
                ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                [isRtl ? 'left' : 'right']: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'var(--text-muted)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                lineHeight: 1,
              }}
              title={t('btn.cancel')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Count Badge */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '6px 12px',
            borderRadius: '16px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {t('reviews.count', { count: filteredReviews.length })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '10px' }}></i>
          <p style={{ fontSize: '0.9rem' }}>{t('reviews.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444', marginBottom: '20px' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x" style={{ marginBottom: '8px' }}></i>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: '10px' }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredReviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-star-half-stroke fa-2x" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '12px' }}></i>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{t('reviews.empty_state')}</h3>
        </div>
      )}

      {/* High-Density Reviews Grid (3-4 cards on wide screens) */}
      {!isLoading && !error && filteredReviews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onModerate={handleModerate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
