import React, { useState, useRef, useMemo, useEffect } from 'react';
import { HousingOffer, HousingOfferFormInput } from '../../types/offer';
import { useApartments } from '../../hooks/useApartments';
import { useToast } from '../../components/Toast';
import { DateTimePickerField } from '../../components/DateTimePickerField';

interface EditHousingOfferModalProps {
  isOpen: boolean;
  offer: HousingOffer | null;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<HousingOfferFormInput>) => Promise<unknown>;
}

export function EditHousingOfferModal({ isOpen, offer, onClose, onUpdate }: EditHousingOfferModalProps) {
  const { showToast } = useToast();
  const { apartments } = useApartments();

  const [apartmentId, setApartmentId] = useState<number>(0);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [badgeTextAr, setBadgeTextAr] = useState('');
  const [badgeTextEn, setBadgeTextEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLockRef = useRef(false);

  // Prepopulate state when offer changes
  useEffect(() => {
    if (offer) {
      setApartmentId(offer.apartment_id);
      setTitleAr(offer.title_ar || offer.title || '');
      setTitleEn(offer.title_en || '');
      setDescriptionAr(offer.description_ar || offer.description || '');
      setDescriptionEn(offer.description_en || '');
      setOriginalPrice(offer.original_price);
      setOfferPrice(offer.offer_price);
      setBadgeTextAr(offer.badge_text_ar || offer.badge_text || '');
      setBadgeTextEn(offer.badge_text_en || '');
      setImageUrl(offer.image_url || '');
      setStartsAt(offer.starts_at ? offer.starts_at.replace(' ', 'T').slice(0, 16) : '');
      setExpiresAt(offer.expires_at ? offer.expires_at.replace(' ', 'T').slice(0, 16) : '');
      setIsActive(offer.is_active === 1 || offer.is_active === true);
    }
  }, [offer]);

  const selectedApartment = useMemo(() => {
    return apartments.find((a) => a.id === apartmentId);
  }, [apartments, apartmentId]);

  const discountStats = useMemo(() => {
    if (originalPrice > 0 && offerPrice < originalPrice && offerPrice >= 0) {
      const saving = originalPrice - offerPrice;
      const percent = Math.round((saving / originalPrice) * 100);
      return { saving, percent, isValid: true };
    }
    return { saving: 0, percent: 0, isValid: false };
  }, [originalPrice, offerPrice]);

  const dateError = useMemo(() => {
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      return 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء';
    }
    return undefined;
  }, [startsAt, expiresAt]);

  if (!isOpen || !offer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    if (apartmentId <= 0) {
      showToast('يرجى اختيار الشقة السكنية المرتبطة بالعرض', 'error');
      return;
    }
    if (!titleAr.trim()) {
      showToast('يرجى إدخال عنوان العرض بالعربية', 'error');
      return;
    }
    if (!descriptionAr.trim()) {
      showToast('يرجى إدخال وصف العرض بالعربية', 'error');
      return;
    }
    if (originalPrice <= 0) {
      showToast('السعر الأصلي يجب أن يكون أكبر من الصفر', 'error');
      return;
    }
    if (offerPrice < 0) {
      showToast('سعر العرض لا يمكن أن يكون سالباً', 'error');
      return;
    }
    if (offerPrice >= originalPrice) {
      showToast('يجب أن يكون سعر العرض المخفض أقل من السعر الأصلي', 'error');
      return;
    }
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      showToast('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء', 'error');
      return;
    }

    try {
      submitLockRef.current = true;
      setIsSubmitting(true);

      const payload: Partial<HousingOfferFormInput> = {
        apartment_id: apartmentId,
        title_ar: titleAr.trim(),
        title_en: titleEn.trim() || undefined,
        description_ar: descriptionAr.trim(),
        description_en: descriptionEn.trim() || undefined,
        original_price: originalPrice,
        offer_price: offerPrice,
        badge_text_ar: badgeTextAr.trim() || null,
        badge_text_en: badgeTextEn.trim() || null,
        image_url: imageUrl.trim() || null,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        is_active: isActive ? 1 : 0,
      };

      await onUpdate(offer.id, payload);
      showToast('تم تعديل عرض السكن بنجاح', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تعديل عرض السكن';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

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
          maxWidth: '750px',
          maxHeight: '92vh',
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
            background: 'linear-gradient(to right, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                تعديل عرض السكن #{offer.id}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                تحديث بيانات العرض، الأسعار، التواريخ وحالة التفعيل
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

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Linked Apartment */}
          <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              الشقة السكنية المرتبطة <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={apartmentId}
              onChange={(e) => setApartmentId(parseInt(e.target.value, 10) || 0)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0d1527',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.88rem',
              }}
            >
              <option value={0}>-- اختر الشقة المراد ربطها بالعرض --</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  #{apt.id} - {apt.title} ({apt.price} $ / {apt.location})
                </option>
              ))}
            </select>
            {selectedApartment && (
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#38bdf8', display: 'flex', gap: '12px' }}>
                <span>السعر الأصلي الحالي للشقة: <strong>{selectedApartment.price} $</strong></span>
                <span>الموقع: <strong>{selectedApartment.location}</strong></span>
              </div>
            )}
          </div>

          {/* Section 2: Pricing & Discount Live Preview */}
          <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  السعر الأصلي ($) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={originalPrice || ''}
                  onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                  placeholder="مثال: 500"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#0d1527',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  سعر العرض المخفض ($) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerPrice || ''}
                  onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                  placeholder="مثال: 420"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#0d1527',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            {/* Live Discount Calculation Pill */}
            {discountStats.isValid && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: '#34d399',
                }}
              >
                <span>نسبة الخصم المحسوبة: <strong>%{discountStats.percent}</strong></span>
                <span>مقدار التوفير للطلاب: <strong>{discountStats.saving.toFixed(2)} $</strong></span>
              </div>
            )}
          </div>

          {/* Section 3: Titles & Descriptions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                عنوان العرض (عربي) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="عنوان العرض..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                عنوان العرض (إنجليزي - اختياري)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Offer title in English..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                وصف العرض والشروط (عربي) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                placeholder="تفاصيل العرض، الشروط..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                وصف العرض والشروط (إنجليزي - اختياري)
              </label>
              <textarea
                rows={3}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Offer details and terms..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Section 4: Badge & Image */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                شارة العرض الترويجية (عربي)
              </label>
              <input
                type="text"
                value={badgeTextAr}
                onChange={(e) => setBadgeTextAr(e.target.value)}
                placeholder="مثال: عرض خاص، لفترة محدودة"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                شارة العرض (إنجليزي)
              </label>
              <input
                type="text"
                value={badgeTextEn}
                onChange={(e) => setBadgeTextEn(e.target.value)}
                placeholder="e.g. Special Offer"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                رابط صورة العرض (اختياري)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="رابط الصورة..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0d1527',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          {/* Section 5: Start and Expiration Dates with High-Contrast Pickers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <DateTimePickerField
              label="تاريخ ووقت بدء العرض (اختياري)"
              value={startsAt}
              onChange={setStartsAt}
              max={expiresAt || undefined}
            />

            <DateTimePickerField
              label="تاريخ ووقت انتهاء العرض (اختياري)"
              value={expiresAt}
              onChange={setExpiresAt}
              min={startsAt || undefined}
              error={dateError}
            />
          </div>

          {/* Section 6: Active Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: '#1e293b',
              borderRadius: '8px',
              border: '1px solid #334155',
            }}
          >
            <input
              type="checkbox"
              id="edit_is_active_checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#38bdf8' }}
            />
            <label htmlFor="edit_is_active_checkbox" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', cursor: 'pointer' }}>
              العرض نشط حالياً ومتاح للطلاب في التطبيق
            </label>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #1e293b',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>جارِ الحفظ...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
