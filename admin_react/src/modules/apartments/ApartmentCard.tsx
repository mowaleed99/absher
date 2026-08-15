import React from 'react';
import { Apartment } from '../../types/apartment';
import { resolveImageUrl } from '../../config/api';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../components/Toast';

interface ApartmentCardProps {
  apartment: Apartment;
  onEdit: (apt: Apartment) => void;
  onDelete: (id: number) => void;
}

export function ApartmentCard({ apartment: apt, onEdit, onDelete }: ApartmentCardProps) {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const rtLabels: Record<string, string> = {
    apartment: t('rental_type.apartment'),
    room_shared: t('rental_type.room_shared'),
    studio: t('rental_type.studio'),
  };

  const rtColors: Record<string, string> = {
    apartment: '#fbbf24',
    room_shared: '#38bdf8',
    studio: '#a78bfa',
  };

  const rtRgb: Record<string, string> = {
    apartment: '251,191,36',
    room_shared: '56,189,248',
    studio: '167,139,250',
  };

  const rtLabel = rtLabels[apt.rental_type] || apt.rental_type;
  const rtColor = rtColors[apt.rental_type] || '#fbbf24';
  const rtRgbVal = rtRgb[apt.rental_type] || '251,191,36';

  const firstImg = apt.images && apt.images.length > 0 ? apt.images[0] : '';
  const displayTitle = lang === 'en' && apt.title_en ? apt.title_en : (apt.title_ar || apt.title);
  const displayLocation = lang === 'en' && apt.location_en ? apt.location_en : (apt.location_ar || apt.location);
  const displayCapacity = lang === 'en' && apt.capacity_en ? apt.capacity_en : (apt.capacity_ar || apt.capacity);
  const displayDescription = lang === 'en' && apt.description_en ? apt.description_en : (apt.description_ar || apt.description);
  const displayFeatures = lang === 'en' && apt.features_en && apt.features_en.length > 0
    ? apt.features_en
    : (apt.features_ar && apt.features_ar.length > 0 ? apt.features_ar : apt.features);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (apt.owner_phone) {
      navigator.clipboard.writeText(apt.owner_phone);
      showToast(t('msg.owner_phone_copied'), 'info');
    }
  };

  return (
    <div className="item-card">
      <div className="card-img-wrap" style={{ background: '#1f2937' }}>
        {firstImg ? (
          <img
            src={resolveImageUrl(firstImg)}
            alt={displayTitle}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-image" style={{ fontSize: '2.5rem' }}></i>
          </div>
        )}
        <span className="price-tag">${apt.price}</span>
      </div>

      <div className="card-body">
        <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span
            style={{
              background: 'rgba(37, 211, 102, 0.18)',
              color: '#25D366',
              border: '1px solid #25D366',
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
          >
            {t('apartments.apartment_number')}: #{apt.id}
          </span>

          {apt.owner_phone && (
            <span
              onClick={handleCopyPhone}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid #ef4444',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
              title={t('msg.owner_phone_copied')}
            >
              <i className="fa-solid fa-lock"></i> {t('apartments.owner_phone_label')}: {apt.owner_phone}
            </span>
          )}

          {rtLabel && (
            <span
              style={{
                background: `rgba(${rtRgbVal}, 0.18)`,
                color: rtColor,
                border: `1px solid ${rtColor}`,
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
              }}
            >
              {rtLabel}
            </span>
          )}

          {apt.rooms_count !== null && apt.rooms_count !== undefined && (
            <span
              style={{
                background: 'rgba(37, 211, 102, 0.15)',
                color: '#25D366',
                border: '1px solid #25D366',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 'bold',
              }}
            >
              {t('apartments.bedrooms_count', { count: apt.rooms_count })}
            </span>
          )}
        </div>

        <h3 className="card-title">{displayTitle}</h3>
        <p className="card-loc">
          <i className="fa-solid fa-location-dot"></i> {t('apartments.district_label')}: {displayLocation}
        </p>

        <div style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'var(--primary)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            {t('apartments.rooms_count_label')}: {displayCapacity || t('apartments.default_rooms_desc')}
          </span>
        </div>

        {(apt.roommate_reqs || apt.roommate_facilities) && (
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px dashed #fbbf24',
              padding: '10px',
              borderRadius: '10px',
              margin: '8px 0',
              fontSize: '0.85rem',
            }}
          >
            {apt.roommate_reqs && (
              <div style={{ marginBottom: '4px' }}>
                <strong style={{ color: '#fbbf24' }}>{t('apartments.roommate_reqs_label')}: </strong>
                {apt.roommate_reqs}
              </div>
            )}
            {apt.roommate_facilities && (
              <div>
                <strong style={{ color: '#fbbf24' }}>{t('apartments.roommate_facilities_label')}: </strong>
                {apt.roommate_facilities}
              </div>
            )}
          </div>
        )}

        <div className="features-list">
          {displayFeatures.map((f, i) => (
            <span key={i} className="feature-pill">
              {f}
            </span>
          ))}
        </div>

        <p className="card-desc">{displayDescription}</p>

        <div className="card-actions">
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid #6366f1', color: '#a5b4fc' }}
            onClick={() => onEdit(apt)}
          >
            <i className="fa-solid fa-pen-to-square"></i> {t('btn.edit')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete(apt.id)}
          >
            <i className="fa-solid fa-trash"></i> {t('btn.delete')}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', alignSelf: 'center' }}>
            {t('apartments.status_active')}
          </span>
        </div>
      </div>
    </div>
  );
}
