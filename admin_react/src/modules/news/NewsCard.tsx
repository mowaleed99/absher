import { NewsItem } from '../../types/news';
import { useI18n } from '../../lib/i18n';
import { getMediaUrl, hasMedia } from '../../lib/media';

interface NewsCardProps {
  news: NewsItem;
  onEdit: (news: NewsItem) => void;
  onDelete: (news: NewsItem) => void;
}

export function NewsCard({ news, onEdit, onDelete }: NewsCardProps) {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';

  const titleAr = news.title_ar || news.title || '';
  const titleEn = news.title_en || '';
  const contentAr = news.content_ar || news.content || '';
  const contentEn = news.content_en || '';

  const displayTitle = isRtl ? (titleAr || titleEn) : (titleEn || titleAr);
  const displayContent = isRtl ? (contentAr || contentEn) : (contentEn || contentAr);
  const secondaryTitle = isRtl ? titleEn : titleAr;

  return (
    <div
      className="item-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Media Thumbnail or Header Banner */}
      <div
        style={{
          height: '140px',
          width: '100%',
          backgroundColor: '#0d1527',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasMedia(news.image_url) ? (
          <img
            src={getMediaUrl(news.image_url)}
            alt={displayTitle}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-newspaper fa-2x" style={{ opacity: 0.5 }}></i>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t('news.no_image')}</span>
          </div>
        )}

        {/* Date Pill overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            [isRtl ? 'right' : 'left']: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.68rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <i className="fa-regular fa-clock" style={{ fontSize: '0.65rem' }}></i>
          <span>{news.date || news.created_at || '—'}</span>
        </div>

        {/* ID Badge overlay */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            [isRtl ? 'left' : 'right']: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            color: '#cbd5e1',
            fontWeight: 700,
          }}
        >
          #{news.id}
        </div>
      </div>

      {/* Card Content Area */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Main Title */}
        <h4
          style={{
            margin: '0 0 4px',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          title={displayTitle}
        >
          {displayTitle}
        </h4>

        {/* Secondary bilingual title subtitle if available */}
        {secondaryTitle && (
          <span
            style={{
              fontSize: '0.72rem',
              color: '#818cf8',
              marginBottom: '6px',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {secondaryTitle}
          </span>
        )}

        {/* Clamped Content Preview */}
        <p
          style={{
            margin: '0 0 12px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayContent}
        </p>

        {/* Actions Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => onEdit(news)}
            style={{
              height: '30px',
              padding: '0 12px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title={t('btn.edit')}
          >
            <i className="fa-solid fa-pen" style={{ fontSize: '0.7rem' }}></i>
            <span>{t('btn.edit')}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => onDelete(news)}
            style={{
              height: '30px',
              padding: '0 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title={t('btn.delete')}
          >
            <i className="fa-solid fa-trash" style={{ fontSize: '0.7rem' }}></i>
            <span>{t('btn.delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
