import { useState } from 'react';
import { ServiceReview } from '../../types/review';
import { useI18n } from '../../lib/i18n';

interface ReviewCardProps {
  review: ServiceReview;
  onModerate: (id: number, status: 'approved' | 'rejected') => void;
  onDelete: (review: ServiceReview) => void;
}

export function ReviewCard({ review, onModerate, onDelete }: ReviewCardProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'approved':
        return {
          label: t('reviews.status_approved'),
          style: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' },
        };
      case 'rejected':
        return {
          label: t('reviews.status_rejected'),
          style: { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' },
        };
      case 'pending':
      default:
        return {
          label: t('reviews.status_pending'),
          style: { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' },
        };
    }
  };

  const statusInfo = getStatusBadge(review.status);
  const isLongComment = (review.comment || '').length > 110;

  return (
    <div
      className="item-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Top Row: Student + Uni & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={review.student_name}
          >
            {review.student_name || 'طالب كريم'}
          </h4>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={review.uni}
          >
            {review.uni || 'جامعة في جورجيا'}
          </span>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...statusInfo.style,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Stars & Date Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '0.78rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={star <= review.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
              style={{ opacity: star <= review.rating ? 1 : 0.25 }}
            ></i>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          {review.date || '—'}
        </span>
      </div>

      {/* Review Comment (Compact with inline expand toggle for long comments) */}
      <div
        style={{
          background: 'var(--bg-main)',
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          lineHeight: 1.45,
          color: 'var(--text-main)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <p
          style={{
            margin: 0,
            display: isExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: isExpanded ? 'visible' : 'hidden',
          }}
        >
          "{review.comment}"
        </p>

        {isLongComment && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginTop: '4px',
              textAlign: 'left',
            }}
          >
            {isExpanded ? 'عرض أقل' : 'عرض المزيد...'}
          </button>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '5px',
          marginTop: 'auto',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {review.status !== 'approved' && (
          <button
            type="button"
            className="btn"
            onClick={() => onModerate(review.id, 'approved')}
            style={{
              height: '30px',
              padding: '0 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <i className="fa-solid fa-check"></i>
            <span>{t('reviews.approve_btn')}</span>
          </button>
        )}

        {review.status !== 'rejected' && (
          <button
            type="button"
            className="btn"
            onClick={() => onModerate(review.id, 'rejected')}
            style={{
              height: '30px',
              padding: '0 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
            <span>{t('reviews.reject_btn')}</span>
          </button>
        )}

        <button
          type="button"
          className="btn"
          onClick={() => onDelete(review)}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          title={t('btn.delete')}
        >
          <i className="fa-solid fa-trash" style={{ fontSize: '0.75rem' }}></i>
        </button>
      </div>
    </div>
  );
}
