import React, { useState, useRef, useEffect } from 'react';
import { NewsFormData } from '../../types/news';
import { useI18n } from '../../lib/i18n';
import { getMediaUrl, hasMedia } from '../../lib/media';

interface AddNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewsFormData) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AddNewsModal({ isOpen, onClose, onSubmit, showToast }: AddNewsModalProps) {
  const { t } = useI18n();
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitleAr('');
      setTitleEn('');
      setContentAr('');
      setContentEn('');
      setImageUrl('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const trimmedTitleAr = titleAr.trim();
    const trimmedTitleEn = titleEn.trim();
    const trimmedContentAr = contentAr.trim();
    const trimmedContentEn = contentEn.trim();

    if (!trimmedTitleAr || !trimmedContentAr) {
      showToast(t('msg.validation_required'), 'error');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        title_ar: trimmedTitleAr,
        title_en: trimmedTitleEn,
        content_ar: trimmedContentAr,
        content_en: trimmedContentEn,
        image_url: imageUrl,
      });

      if (res.success) {
        showToast(t('msg.news_added'), 'success');
        onClose();
      } else {
        showToast(res.error || t('msg.error_add_news'), 'error');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-box"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-newspaper"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('news.add_news')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title AR */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('news.title_ar')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="عنوان الخبر بالعربية..."
                required
                disabled={isSubmitting}
                style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
              />
            </div>

            {/* Title EN */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('news.title_en')}
              </label>
              <input
                type="text"
                className="form-control"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="News title in English..."
                disabled={isSubmitting}
                style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
              />
            </div>

            {/* Content AR */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('news.content_ar')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                value={contentAr}
                onChange={(e) => setContentAr(e.target.value)}
                placeholder="تفاصيل ومحتوى الخبر بالعربية..."
                rows={3}
                required
                disabled={isSubmitting}
                style={{ width: '100%', borderRadius: '8px', padding: '10px 12px', resize: 'vertical' }}
              />
            </div>

            {/* Content EN */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('news.content_en')}
              </label>
              <textarea
                className="form-control"
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                placeholder="News content in English..."
                rows={3}
                disabled={isSubmitting}
                style={{ width: '100%', borderRadius: '8px', padding: '10px 12px', resize: 'vertical' }}
              />
            </div>

            {/* Image */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('news.image')}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isSubmitting}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              {hasMedia(imageUrl) && (
                <div style={{ marginTop: '10px', position: 'relative', width: 'fit-content' }}>
                  <img
                    src={getMediaUrl(imageUrl)}
                    alt="Preview"
                    style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>{t('btn.save')}...</span>
                </>
              ) : (
                <span>{t('btn.save')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
