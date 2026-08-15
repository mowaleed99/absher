import React, { useState, useRef } from 'react';
import { PromoFormInput, DiscountType, ScopeType } from '../../types/promo';
import { useServices } from '../../hooks/useServices';
import { useStudents } from '../../hooks/useStudents';
import { useToast } from '../../components/Toast';

interface AddPromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: PromoFormInput) => Promise<unknown>;
}

export function AddPromoCodeModal({ isOpen, onClose, onAdd }: AddPromoCodeModalProps) {
  const { showToast } = useToast();
  const { services } = useServices();
  const { students } = useStudents();

  const [campaignName, setCampaignName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxDiscountPoints, setMaxDiscountPoints] = useState<string>('');
  const [minServicePrice, setMinServicePrice] = useState<number>(0);
  const [startAt, setStartAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [serviceScope, setServiceScope] = useState<ScopeType>('all');
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [audienceScope, setAudienceScope] = useState<ScopeType>('all');
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [totalUsageLimit, setTotalUsageLimit] = useState<string>('');
  const [perStudentLimit, setPerStudentLimit] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLockRef = useRef(false);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
  };

  const handleToggleService = (id: number) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]));
  };

  const handleToggleStudent = (id: number) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    if (!campaignName.trim()) {
      showToast('يرجى إدخال اسم الحملة', 'error');
      return;
    }
    if (!code.trim() || code.length < 3) {
      showToast('يرجى إدخال رمز كود صحيح (3 أحرف على الأقل)', 'error');
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

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      await onAdd({
        campaign_name: campaignName.trim(),
        code: code.trim(),
        discount_type: discountType,
        discount_value: discountType === 'free' ? 0 : Number(discountValue),
        max_discount_points: maxDiscountPoints ? Number(maxDiscountPoints) : null,
        min_service_price_points: Number(minServicePrice) || 0,
        start_at: startAt ? startAt.replace('T', ' ') : null,
        expires_at: expiresAt ? expiresAt.replace('T', ' ') : null,
        status: 'active',
        service_scope: serviceScope,
        service_ids: serviceScope === 'selected' ? serviceIds : [],
        audience_scope: audienceScope,
        student_ids: audienceScope === 'selected' ? studentIds : [],
        total_usage_limit: totalUsageLimit ? Number(totalUsageLimit) : null,
        per_student_limit: Number(perStudentLimit) || 1,
      });
      showToast('تم إنشاء كود الخصم بنجاح', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إنشاء كود الخصم';
      showToast(msg, 'error');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '38px',
    borderRadius: '8px',
    background: '#0d1527',
    border: '1px solid var(--border-color)',
    color: '#f8fafc',
    padding: '0 12px',
    fontSize: '0.85rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  };

  return (
    <div
      className="modal-overlay active"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="modal-box custom-scrollbar"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-tag"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 800 }}>
              إنشاء كود خصم ترويجي جديد
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.3rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            className="custom-scrollbar"
            style={{
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Section 1: Campaign & Code */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-circle-info"></i>
                <span>بيانات الحملة ورمز الخصم</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>
                    اسم الحملة <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: خصم بداية الفصل الدراسي"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    رمز الكود (بالإنجليزية) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: WELCOME20"
                    value={code}
                    onChange={handleCodeChange}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Discount Rules */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-percent"></i>
                <span>قيمة وقواعد الخصم</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>نوع الخصم</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    style={inputStyle}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (نقاط)</option>
                    <option value="free">خدمة مجانية (100%)</option>
                  </select>
                </div>

                {discountType !== 'free' && (
                  <div>
                    <label style={labelStyle}>
                      قيمة الخصم {discountType === 'percentage' ? '(%)' : '(نقاط)'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step={discountType === 'percentage' ? '0.1' : '1'}
                      min="1"
                      max={discountType === 'percentage' ? '100' : '100000'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      style={inputStyle}
                      required
                    />
                  </div>
                )}

                {discountType === 'percentage' && (
                  <div>
                    <label style={labelStyle}>سقف الخصم (نقاط - اختياري)</label>
                    <input
                      type="number"
                      placeholder="بدون سقف أقصى"
                      value={maxDiscountPoints}
                      onChange={(e) => setMaxDiscountPoints(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>الحد الأدنى لسعر الخدمة (نقاط)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = بدون حد أدنى"
                    value={minServicePrice}
                    onChange={(e) => setMinServicePrice(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Dates & Limits */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-calendar-check"></i>
                <span>الصلاحية وحدود الاستخدام</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>تاريخ بدء السريان (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>تاريخ انتهاء السريان (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>الحد الأقصى الكلي (مرات الاستخدام)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="فارغ = غير محدود (∞)"
                    value={totalUsageLimit}
                    onChange={(e) => setTotalUsageLimit(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>الحد المسموح لكل طالب</label>
                  <input
                    type="number"
                    min="1"
                    value={perStudentLimit}
                    onChange={(e) => setPerStudentLimit(Number(e.target.value))}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Scopes */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-filter"></i>
                <span>نطاق الخدمات والجمهور المستهدف</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>نطاق الخدمات</label>
                  <select
                    value={serviceScope}
                    onChange={(e) => setServiceScope(e.target.value as ScopeType)}
                    style={inputStyle}
                  >
                    <option value="all">كافة الخدمات الطلابية</option>
                    <option value="selected">خدمات محددة فقط</option>
                  </select>

                  {serviceScope === 'selected' && (
                    <div
                      className="custom-scrollbar"
                      style={{
                        marginTop: '8px',
                        background: '#0d1527',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {services.map((s) => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={serviceIds.includes(s.id)}
                            onChange={() => handleToggleService(s.id)}
                          />
                          <span>{s.title_ar || s.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>نطاق الجمهور</label>
                  <select
                    value={audienceScope}
                    onChange={(e) => setAudienceScope(e.target.value as ScopeType)}
                    style={inputStyle}
                  >
                    <option value="all">كافة الطلاب المسجلين</option>
                    <option value="selected">طلاب محددون فقط</option>
                  </select>

                  {audienceScope === 'selected' && (
                    <div
                      className="custom-scrollbar"
                      style={{
                        marginTop: '8px',
                        background: '#0d1527',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {students.map((st) => (
                        <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={studentIds.includes(st.id)}
                            onChange={() => handleToggleStudent(st.id)}
                          />
                          <span>{st.full_name} ({st.phone})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>جارِ الحفظ...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>إنشاء الكود</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
