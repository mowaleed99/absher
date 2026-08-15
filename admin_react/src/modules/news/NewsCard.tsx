import { NewsItem } from '../../types/news';
import { useI18n } from '../../lib/i18n';
import { getMediaUrl, hasMedia } from '../../lib/media';

interface NewsCardProps {
  news: NewsItem;
  onEdit: (news: NewsItem) => void;
  onDelete: (news: NewsItem) => void;
}

export function NewsCard({ news, onEdit, onDelete }: NewsCardProps) {
  const { t } = useI18n();

  return (
    <div
      className="item-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Image Preview if present */}
      {hasMedia(news.image_url) && (
        <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-main)' }}>
          <img
            src={getMediaUrl(news.image_url)}
            alt={news.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Header: Title + Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35 }}>
          {news.title_ar || news.title}
        </h4>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {news.date ? news.date.split(' ')[0] : '—'}
        </span>
      </div>

      {news.title_en && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {news.title_en}
        </div>
      )}

      {/* Content Preview */}
      <p
        style={{
          margin: 0,
          fontSize: '0.82rem',
          lineHeight: 1.45,
          color: 'var(--text-main)',
          opacity: 0.85,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        {news.content_ar || news.content}
      </p>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => onEdit(news)}
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
          <i className="fa-solid fa-pen-to-square" style={{ fontSize: '0.7rem' }}></i>
          <span>{t('btn.edit')}</span>
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => onDelete(news)}
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
