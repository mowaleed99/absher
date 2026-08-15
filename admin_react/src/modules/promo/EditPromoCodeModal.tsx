import React, { useState } from 'react';
import { PromoCode, PromoFormInput, DiscountType, ScopeType, PromoStatus } from '../../types/promo';
import { useServices } from '../../hooks/useServices';
import { useStudents } from '../../hooks/useStudents';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

interface EditPromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  promo: PromoCode | null;
  onUpdate: (id: number, data: PromoFormInput) => Promise<unknown>;
}

export function EditPromoCodeModal({ isOpen, onClose, promo, onUpdate }: EditPromoCodeModalProps) {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const { services } = useServices();
  const { students } = useStudents();

  const [campaignName, setCampaignName] = useState(promo?.campaign_name || '');
  const [code, setCode] = useState(promo?.code || '');
  const [discountType, setDiscountType] = useState<DiscountType>(promo?.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState<number>(promo?.discount_value || 20);
  const [maxDiscountPoints, setMaxDiscountPoints] = useState<string>(promo?.max_discount_points ? String(promo.max_discount_points) : '');
  const [minServicePrice, setMinServicePrice] = useState<number>(promo?.min_service_price_points || 0);
  const [startAt, setStartAt] = useState<string>(promo?.start_at ? promo.start_at.replace(' ', 'T').slice(0, 16) : '');
  const [expiresAt, setExpiresAt] = useState<string>(promo?.expires_at ? promo.expires_at.replace(' ', 'T').slice(0, 16) : '');
  const [status, setStatus] = useState<PromoStatus>(promo?.status || 'active');
  const [serviceScope, setServiceScope] = useState<ScopeType>(promo?.service_scope || 'all');
  const [serviceIds, setServiceIds] = useState<number[]>(promo?.service_ids || []);
  const [audienceScope, setAudienceScope] = useState<ScopeType>(promo?.audience_scope || 'all');
  const [studentIds, setStudentIds] = useState<number[]>(promo?.student_ids || []);
  const [totalUsageLimit, setTotalUsageLimit] = useState<string>(promo?.total_usage_limit ? String(promo.total_usage_limit) : '');
  const [perStudentLimit, setPerStudentLimit] = useState<number>(promo?.per_student_limit || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !promo) return null;

  const isCodeLocked = (promo.used_count || 0) > 0;

  const handleToggleService = (id: number) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]));
  };

  const handleToggleStudent = (id: number) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      showToast('يرجى إدخال اسم الحملة', 'error');
      return;
    }
    if (!code.trim() || code.length < 3) {
      showToast('يرجى إدخال رمز كود صحيح', 'error');
      return;
    }
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      showToast('نسبة الخصم يجب أن تكون بين 1% و 100%', 'error');
      return;
    }
    if (discountType === 'fixed' && discountValue <= 0) {
      showToast('قيمة الخصم الثابت يجب أن تكون أكبر من 0', 'error');
      return;
    }
    if (startAt && expiresAt && startAt >= expiresAt) {
      showToast('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء', 'error');
      return;
    }
    if (serviceScope === 'selected' && serviceIds.length === 0) {
      showToast('يرجى اختيار خدمة واحدة على الأقل عند تحديد نطاق الخدمات', 'error');
      return;
    }
    if (audienceScope === 'selected' && studentIds.length === 0) {
      showToast('يرجى اختيار طالب واحد على الأقل عند تحديد نطاق الجمهور', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(promo.id, {
        campaign_name: campaignName.trim(),
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === 'free' ? 0 : Number(discountValue),
        max_discount_points: maxDiscountPoints ? Number(maxDiscountPoints) : null,
        min_service_price_points: Number(minServicePrice) || 0,
        start_at: startAt ? startAt.replace('T', ' ') : null,
        expires_at: expiresAt ? expiresAt.replace('T', ' ') : null,
        status,
        service_scope: serviceScope,
        service_ids: serviceScope === 'selected' ? serviceIds : [],
        audience_scope: audienceScope,
        student_ids: audienceScope === 'selected' ? studentIds : [],
        total_usage_limit: totalUsageLimit ? Number(totalUsageLimit) : null,
        per_student_limit: Number(perStudentLimit) || 1,
      });
      showToast('تم تحديث كود الخصم بنجاح', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحديث كود الخصم';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>
            <i className="fa-solid fa-pen-to-square" style={{ color: '#38bdf8', marginLeft: lang === 'ar' ? '8px' : 0, marginRight: lang === 'en' ? '8px' : 0 }}></i>
            {t('promo.edit')} ({promo.code})
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {isCodeLocked && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '12px', color: '#fbbf24', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '1.1rem' }}></i>
              <span>{t('promo.code_locked_notice')}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('promo.campaign_name')} *</label>
              <input
                type="text"
                className="input-field"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('promo.code')} *</label>
              <input
                type="text"
                className="input-field"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                disabled={isCodeLocked}
                style={{
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  opacity: isCodeLocked ? 0.7 : 1,
                  cursor: isCodeLocked ? 'not-allowed' : 'text',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('promo.discount_type')}</label>
              <select className="input-field" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
                <option value="percentage">{t('promo.filter_percentage')} (%)</option>
                <option value="fixed">{t('promo.filter_fixed')} (نقاط)</option>
                <option value="free">{t('promo.filter_free')} (100%)</option>
              </select>
            </div>

            {discountType !== 'free' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  {t('promo.discount_value')} {discountType === 'percentage' ? '(%)' : '(نقاط)'} *
                </label>
                <input
                  type="number"
                  step={discountType === 'percentage' ? '0.1' : '1'}
                  min="1"
                  max={discountType === 'percentage' ? '100' : '100000'}
                  className="input-field"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  required
                />
              </div>
            )}

            {discountType === 'percentage' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('promo.max_discount')} (نقاط)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="اختياري"
                  value={maxDiscountPoints}
                  onChange={(e) => setMaxDiscountPoints(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('promo.min_price')} (نقاط)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={minServicePrice}
                onChange={(e) => setMinServicePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>الحد الأقصى الكلي (اختياري)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="عدد مرات الاستخدام"
                value={totalUsageLimit}
                onChange={(e) => setTotalUsageLimit(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>الحد لكل طالب</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={perStudentLimit}
                onChange={(e) => setPerStudentLimit(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>تاريخ بدء الصلاحية (اختياري)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>تاريخ انتهاء الصلاحية (اختياري)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>نطاق الخدمات</label>
              <select className="input-field" value={serviceScope} onChange={(e) => setServiceScope(e.target.value as ScopeType)}>
                <option value="all">كل الخدمات (All Services)</option>
                <option value="selected">خدمات محددة فقط (Selected Services)</option>
              </select>

              {serviceScope === 'selected' && (
                <div style={{ marginTop: '8px', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                  {services.map((svc) => (
                    <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={serviceIds.includes(svc.id)}
                        onChange={() => handleToggleService(svc.id)}
                      />
                      <span>{svc.display_title || svc.title} ({svc.price_points} نقطة)</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>نطاق الطلاب المستهدفين</label>
              <select className="input-field" value={audienceScope} onChange={(e) => setAudienceScope(e.target.value as ScopeType)}>
                <option value="all">كل الطلاب (Public / All Students)</option>
                <option value="selected">طلاب محددون فقط (Private Audience)</option>
              </select>

              {audienceScope === 'selected' && (
                <div style={{ marginTop: '8px', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                  {students.map((std) => (
                    <label key={std.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={studentIds.includes(std.id)}
                        onChange={() => handleToggleStudent(std.id)}
                      />
                      <span>{std.full_name} ({std.phone || std.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>حالة الكود</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as PromoStatus)}>
              <option value="active">نشط ومتاح (Active)</option>
              <option value="paused">معطل مؤقتاً (Paused)</option>
              <option value="archived">مؤرشف (Archived)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span><i className="fa-solid fa-spinner fa-spin"></i> جارِ الحفظ...</span>
              ) : (
                <span><i className="fa-solid fa-check"></i> حفظ التعديلات</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
