import { useState } from 'react';
import { ApplicationFeedback, FeedbackStatus } from '../../types/feedback';
import { useI18n } from '../../lib/i18n';

interface FeedbackCardProps {
  feedback: ApplicationFeedback;
  onUpdateStatus: (id: number, status: FeedbackStatus) => void;
  onDelete: (feedback: ApplicationFeedback) => void;
}

export function FeedbackCard({ feedback, onUpdateStatus, onDelete }: FeedbackCardProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bug':
        return {
          label: t('feedback.type_bug'),
          icon: 'fa-bug',
          style: { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' },
        };
      case 'suggestion':
        return {
          label: t('feedback.type_suggestion'),
          icon: 'fa-lightbulb',
          style: { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' },
        };
      case 'ux':
        return {
          label: t('feedback.type_ux'),
          icon: 'fa-wand-magic-sparkles',
          style: { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' },
        };
      case 'feature':
        return {
          label: t('feedback.type_feature'),
          icon: 'fa-cube',
          style: { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' },
        };
      default:
        return {
          label: type,
          icon: 'fa-comment-dots',
          style: { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' },
        };
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'resolved':
        return {
          label: t('feedback.status_resolved'),
          style: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' },
        };
      case 'reviewed':
        return {
          label: t('feedback.status_reviewed'),
          style: { background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)' },
        };
      case 'pending':
      default:
        return {
          label: t('feedback.status_pending'),
          style: { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' },
        };
    }
  };

  const typeInfo = getTypeBadge(feedback.feedback_type);
  const statusInfo = getStatusBadge(feedback.status);
  const isLongComment = (feedback.comment || '').length > 110;

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
      {/* Top Header Row: Type Badge + Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            ...typeInfo.style,
          }}
        >
          <i className={`fa-solid ${typeInfo.icon}`} style={{ fontSize: '0.68rem' }}></i>
          <span>{typeInfo.label}</span>
        </span>

        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            ...statusInfo.style,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Student Meta & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
        <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--text-main)' }}>{feedback.student_name || 'طالب كريم'}</strong>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>•</span>
          <span style={{ color: 'var(--text-muted)' }}>{feedback.student_uni || 'جامعة في جورجيا'}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {feedback.date || '—'}
        </span>
      </div>

      {/* Feedback Comment Body */}
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
          {feedback.comment}
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

      {/* Action Footer (Unified and Aligned) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {/* Status Transition Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
          {feedback.status !== 'reviewed' && (
            <button
              type="button"
              className="btn"
              onClick={() => onUpdateStatus(feedback.id, 'reviewed')}
              style={{
                height: '30px',
                padding: '0 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <i className="fa-solid fa-eye" style={{ fontSize: '0.7rem' }}></i>
              <span>{t('feedback.mark_reviewed')}</span>
            </button>
          )}

          {feedback.status !== 'resolved' && (
            <button
              type="button"
              className="btn"
              onClick={() => onUpdateStatus(feedback.id, 'resolved')}
              style={{
                height: '30px',
                padding: '0 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <i className="fa-solid fa-check" style={{ fontSize: '0.7rem' }}></i>
              <span>{t('feedback.mark_resolved')}</span>
            </button>
          )}

          {feedback.status !== 'pending' && (
            <button
              type="button"
              className="btn"
              onClick={() => onUpdateStatus(feedback.id, 'pending')}
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
              <i className="fa-solid fa-clock" style={{ fontSize: '0.7rem' }}></i>
              <span>{t('feedback.mark_pending')}</span>
            </button>
          )}
        </div>

        {/* Delete Group (Stable Compact Action) */}
        <button
          type="button"
          className="btn"
          onClick={() => onDelete(feedback)}
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
            flexShrink: 0,
          }}
          title={t('btn.delete')}
        >
          <i className="fa-solid fa-trash" style={{ fontSize: '0.75rem' }}></i>
        </button>
      </div>
    </div>
  );
}
