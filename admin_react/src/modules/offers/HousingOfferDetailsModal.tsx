import { HousingOffer } from '../../types/offer';
import { Apartment } from '../../types/apartment';

interface HousingOfferDetailsModalProps {
  isOpen: boolean;
  offer: HousingOffer | null;
  apartment?: Apartment | null;
  onClose: () => void;
  onEdit: () => void;
}

export function HousingOfferDetailsModal({ isOpen, offer, apartment, onClose, onEdit }: HousingOfferDetailsModalProps) {
  if (!isOpen || !offer) return null;

  const isActive = offer.is_active === 1 || offer.is_active === true;
  const isExpired = offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();
  const isFuture = offer.starts_at && new Date(offer.starts_at).getTime() > Date.now();

  const saving = offer.original_price - offer.offer_price;
  const discountPercent = offer.discount_percent || (offer.original_price > 0 ? Math.round((saving / offer.original_price) * 100) : 0);

  const displayImage = offer.image_url || (apartment?.images && apartment.images.length > 0 ? apartment.images[0] : null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(56, 189, 248, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                تفاصيل عرض السكن #{offer.id}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                نظرة شاملة على بيانات العرض، الشقة المرتبطة ومؤشرات الخصم
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '6px',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Hero Card */}
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #334155',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {offer.display_title || offer.title_ar || offer.title}
                </h4>
                {offer.title_en && (
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    {offer.title_en}
                  </p>
                )}
              </div>

              {/* Status Pill */}
              <div>
                {isExpired ? (
                  <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    منتهي الصلاحية
                  </span>
                ) : isFuture ? (
                  <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    مجدول للمستقبل
                  </span>
                ) : isActive ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    نشط وفعال
                  </span>
                ) : (
                  <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    معطل مؤقتاً
                  </span>
                )}
              </div>
            </div>

            {/* Badges & Tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {offer.badge_text && (
                <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-tag" style={{ marginLeft: '4px' }}></i>
                  {offer.badge_text}
                </span>
              )}
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                خصم %{discountPercent}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {offer.display_desc || offer.description_ar || offer.description}
            </p>
          </div>

          {/* Pricing Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', padding: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>السعر الأصلي</span>
              <strong style={{ fontSize: '1.25rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                {offer.original_price} $
              </strong>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', padding: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block' }}>سعر العرض</span>
              <strong style={{ fontSize: '1.25rem', color: '#38bdf8' }}>
                {offer.offer_price} $
              </strong>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', padding: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'block' }}>مقدار التوفير</span>
              <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>
                {saving > 0 ? `${saving.toFixed(2)} $` : '0 $'}
              </strong>
            </div>
          </div>

          {/* Linked Apartment Card */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <i className="fa-solid fa-building" style={{ color: '#818cf8' }}></i>
              <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>الشقة السكنية المرتبطة</strong>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {displayImage && (
                <img
                  src={displayImage}
                  alt="Apartment"
                  style={{
                    width: '80px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '0.88rem', color: '#f8fafc', display: 'block' }}>
                  #{offer.apartment_id} - {apartment?.title || offer.apartment_title || `شقة رقم ${offer.apartment_id}`}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {apartment?.location || 'تبليسي'} {apartment?.proximity ? `• ${apartment.proximity}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Validity Timeline */}
          <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <i className="fa-solid fa-clock" style={{ color: '#fbbf24' }}></i>
              <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>فترة صلاحية العرض</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>تاريخ البدء:</span>
                <strong style={{ color: '#f8fafc' }}>{offer.starts_at || 'متاح فوراً (بدون قيد)'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>تاريخ الانتهاء:</span>
                <strong style={{ color: '#f8fafc' }}>{offer.expires_at || 'ساري ومستمر (بدون انتهاء)'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit();
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>تعديل العرض</span>
          </button>
        </div>
      </div>
    </div>
  );
}
