import React, { useState, useRef } from 'react';
import { useI18n } from '../../lib/i18n';
import { hasMedia, getMediaUrl } from '../../lib/media';

interface AddNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title_ar: string;
    title_en?: string;
    content_ar: string;
    content_en?: string;
    image_url?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AddNewsModal({ isOpen, onClose, onSubmit, showToast }: AddNewsModalProps) {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    if (!titleAr.trim() && !titleEn.trim()) {
      showToast(isRtl ? 'يرجى إدخال عنوان الخبر' : 'Please enter news title', 'error');
      return;
    }

    if (!contentAr.trim() && !contentEn.trim()) {
      showToast(isRtl ? 'يرجى إدخال تفاصيل الخبر' : 'Please enter news content', 'error');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        title_ar: titleAr.trim() || titleEn.trim(),
        title_en: titleEn.trim() || titleAr.trim(),
        content_ar: contentAr.trim() || contentEn.trim(),
        content_en: contentEn.trim() || contentAr.trim(),
        image_url: imageUrl.trim() || undefined,
      });

      if (res.success) {
        showToast(isRtl ? 'تم نشر الخبر بنجاح' : 'News published successfully', 'success');
        onClose();
        setTitleAr('');
        setTitleEn('');
        setContentAr('');
        setContentEn('');
        setImageUrl('');
      } else {
        showToast(res.error || (isRtl ? 'فشل نشر الخبر' : 'Failed to publish news'), 'error');
      }
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
          borderRadius: '14px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
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
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-newspaper"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>
              {t('news.add_news')}
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
              fontSize: '1.2rem',
              cursor: 'pointer',
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
            {/* Arabic Section */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700 }}>
                <i className="fa-solid fa-language"></i>
                <span>القسم العربي (Arabic)</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('news.title_ar')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="أدخل عنوان الخبر بالعربية..."
                  dir="rtl"
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '0 10px',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('news.content_ar')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  value={contentAr}
                  onChange={(e) => setContentAr(e.target.value)}
                  placeholder="أدخل محتوى وتفاصيل الخبر بالعربية..."
                  rows={3}
                  dir="rtl"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* English Section */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.78rem', fontWeight: 700 }}>
                <i className="fa-solid fa-globe"></i>
                <span>English Section (Optional)</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('news.title_en')}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Enter news title in English..."
                  dir="ltr"
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '0 10px',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('news.content_en')}
                </label>
                <textarea
                  className="form-control"
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  placeholder="Enter news details in English..."
                  rows={3}
                  dir="ltr"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Custom Image Upload & Preview Section */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('news.image')}
              </label>

              {hasMedia(imageUrl) ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <img
                    src={getMediaUrl(imageUrl)}
                    alt="Preview"
                    style={{
                      width: '70px',
                      height: '50px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'block', fontWeight: 600 }}>
                      صورة مرفقة
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      تم تحديد الصورة بنجاح
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {t('news.change_image')}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {t('news.remove_image')}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1px dashed #334155',
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                >
                  <i className="fa-solid fa-cloud-arrow-up fa-2x" style={{ color: 'var(--primary)', marginBottom: '6px' }}></i>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {t('news.upload_image')}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    PNG, JPG, WebP حتى 5 ميجابايت
                  </span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>{t('btn.save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
