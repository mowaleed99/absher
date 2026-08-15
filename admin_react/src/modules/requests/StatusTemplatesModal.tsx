import React, { useState } from 'react';
import { StatusReplyTemplate } from '../../types/request';
import { useI18n } from '../../lib/i18n';

interface StatusTemplatesModalProps {
  isOpen: boolean;
  templates: StatusReplyTemplate[];
  onClose: () => void;
  onUpdate: (
    id: number,
    templateAr: string,
    templateEn: string,
    isEnabled: number
  ) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function StatusTemplatesModal({
  isOpen,
  templates,
  onClose,
  onUpdate,
  showToast,
}: StatusTemplatesModalProps) {
  const { t } = useI18n();
  const [selectedKey, setSelectedKey] = useState<string>('قيد المراجعة');
  const [templateAr, setTemplateAr] = useState<string>('');
  const [templateEn, setTemplateEn] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state when selected template changes or modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    const current = templates.find((t) => t.status_key === selectedKey) || templates[0];
    if (current) {
      setSelectedKey(current.status_key);
      setTemplateAr(current.template_ar);
      setTemplateEn(current.template_en);
      setIsEnabled(Boolean(current.is_enabled));
    }
  }, [isOpen, selectedKey, templates]);

  if (!isOpen) return null;

  const currentTemplate = templates.find((t) => t.status_key === selectedKey);

  const handleSelectTemplate = (key: string) => {
    setSelectedKey(key);
    const item = templates.find((t) => t.status_key === key);
    if (item) {
      setTemplateAr(item.template_ar);
      setTemplateEn(item.template_en);
      setIsEnabled(Boolean(item.is_enabled));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate || isSaving) return;

    if (!templateAr.trim()) {
      showToast('يرجى كتابة نص القالب بالعربية', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await onUpdate(
        currentTemplate.id,
        templateAr.trim(),
        templateEn.trim(),
        isEnabled ? 1 : 0
      );

      if (res.success) {
        showToast(t('req.template_save_success'), 'success');
      } else {
        showToast(res.error || 'فشل حفظ القالب', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const insertTag = (tag: string, target: 'ar' | 'en') => {
    if (target === 'ar') {
      setTemplateAr((prev) => prev + ` ${tag}`);
    } else {
      setTemplateEn((prev) => prev + ` ${tag}`);
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
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="modal-box custom-scrollbar"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-card-hover)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {t('req.templates_modal_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('req.templates_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSaving}
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, minHeight: '400px', overflow: 'hidden' }}>
          {/* Status Navigation Sidebar */}
          <div
            style={{
              width: '180px',
              borderInlineEnd: '1px solid var(--border-color)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            {templates.map((tpl) => {
              const isSelected = tpl.status_key === selectedKey;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.status_key)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'start',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--text-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: '0.2s ease',
                  }}
                >
                  <span>{tpl.status_name_ar}</span>
                  {tpl.is_enabled ? (
                    <i className="fa-solid fa-check-circle" style={{ fontSize: '0.75rem', opacity: 0.8 }} />
                  ) : (
                    <i className="fa-solid fa-ban" style={{ fontSize: '0.75rem', opacity: 0.4 }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Area */}
          <form
            onSubmit={handleSave}
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Active Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                تفعيل الإرسال التلقائي لحالة ({currentTemplate?.status_name_ar})
              </span>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isEnabled ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
                    transition: '0.3s',
                    borderRadius: '22px',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: isEnabled ? '20px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%',
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Arabic Template */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-language" style={{ marginInlineEnd: '6px', color: 'var(--primary)' }} />
                  نص القالب بالعربية (Arabic Template) *
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => insertTag('{id}', 'ar')}
                    style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                  >
                    <code>&#123;id&#125;</code>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => insertTag('{service}', 'ar')}
                    style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                  >
                    <code>&#123;service&#125;</code>
                  </button>
                  {selectedKey === 'ملغي' && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => insertTag('{reason}', 'ar')}
                      style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                    >
                      <code>&#123;reason&#125;</code>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                className="input-field custom-scrollbar"
                rows={3}
                value={templateAr}
                onChange={(e) => setTemplateAr(e.target.value)}
                required
                style={{ width: '100%', borderRadius: '8px', padding: '10px', fontSize: '0.85rem', lineHeight: '1.5' }}
              />
            </div>

            {/* English Template */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-globe" style={{ marginInlineEnd: '6px', color: 'var(--primary)' }} />
                  نص القالب بالإنجليزية (English Template)
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => insertTag('{id}', 'en')}
                    style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                  >
                    <code>&#123;id&#125;</code>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => insertTag('{service}', 'en')}
                    style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                  >
                    <code>&#123;service&#125;</code>
                  </button>
                  {selectedKey === 'ملغي' && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => insertTag('{reason}', 'en')}
                      style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                    >
                      <code>&#123;reason&#125;</code>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                className="input-field custom-scrollbar"
                rows={3}
                value={templateEn}
                onChange={(e) => setTemplateEn(e.target.value)}
                dir="ltr"
                style={{ width: '100%', borderRadius: '8px', padding: '10px', fontSize: '0.85rem', lineHeight: '1.5' }}
              />
            </div>

            {/* Save Button */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin" />
                    <span>{t('form.saving')}</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" />
                    <span>حفظ القالب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
