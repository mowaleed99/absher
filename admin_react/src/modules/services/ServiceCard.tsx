import { useState } from 'react';
import { Service } from '../../types/service';
import { useI18n } from '../../lib/i18n';
import { getMediaUrl, hasMedia } from '../../lib/media';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const { t } = useI18n();
  const [imageError, setImageError] = useState(false);

  const title = service.title_ar || service.title;
  const subtitle = service.title_en;
  const desc = service.description_ar || service.description;

  const imageUrl = getMediaUrl(service.image_url);
  const showImage = hasMedia(service.image_url) && !imageError;

  return (
    <div
      className="service-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Card Image Header */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '160px',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={title}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-screwdriver-wrench fa-2x" style={{ opacity: 0.35 }}></i>
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>خدمة طلابية</span>
          </div>
        )}

        {/* Gradient Overlay when image is shown */}
        {showImage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, transparent 60%)',
            }}
          />
        )}

        {/* Points Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: service.price_points > 0 ? 'rgba(99, 102, 241, 0.9)' : 'rgba(16, 185, 129, 0.9)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          <i className={`fa-solid ${service.price_points > 0 ? 'fa-coins' : 'fa-gift'}`}></i>
          <span>
            {service.price_points > 0 ? t('services.price_points', { points: service.price_points }) : t('services.free')}
          </span>
        </div>

        {/* Form Requirement Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#e2e8f0',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          {service.has_form !== 0 ? (
            <span>
              <i className="fa-solid fa-file-lines" style={{ color: 'var(--accent-amber)', marginLeft: '4px' }}></i>
              {t('services.has_form')}
            </span>
          ) : (
            <span>
              <i className="fa-solid fa-bolt" style={{ color: 'var(--accent-green)', marginLeft: '4px' }}></i>
              {t('services.no_form')}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {desc || '—'}
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onEdit(service)}
            style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-pen"></i> {t('btn.edit')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onDelete(service)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-trash"></i> {t('btn.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
