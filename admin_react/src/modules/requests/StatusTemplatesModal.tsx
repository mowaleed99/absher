import React, { useState, useEffect } from 'react';
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

  const defaultList: StatusReplyTemplate[] = [
    {
      id: 1,
      status_key: 'قيد المراجعة',
      status_name_ar: 'قيد المراجعة',
      status_name_en: 'Under Review',
      template_ar: 'تحديث الطلب (#{id}): تم استلام طلبك الخاص بـ ({service}) وجارٍ مراجعته والتدقيق فيه بعناية.',
      template_en: 'Request Update (#{id}): Your request for ({service}) has been received and is being reviewed.',
      is_enabled: 1,
    },
    {
      id: 2,
      status_key: 'قيد التنفيذ',
      status_name_ar: 'قيد التنفيذ',
      status_name_en: 'In Progress',
      template_ar: 'تحديث الطلب (#{id}): طلبك الخاص بـ ({service}) قيد التنفيذ والعمل عليه الآن من قبل فريقنا.',
      template_en: 'Request Update (#{id}): Your request for ({service}) is now in progress and being handled by our team.',
      is_enabled: 1,
    },
    {
      id: 3,
      status_key: 'مكتمل',
      status_name_ar: 'مكتمل',
      status_name_en: 'Completed',
      template_ar: 'تحديث الطلب (#{id}): تهانينا! تم إنجاز طلبك الخاص بـ ({service}) بنجاح. شكراً لثقتك بنا!',
      template_en: 'Request Update (#{id}): Congratulations! Your request for ({service}) has been completed successfully.',
      is_enabled: 1,
    },
    {
      id: 4,
      status_key: 'ملغي',
      status_name_ar: 'ملغي',
      status_name_en: 'Cancelled',
      template_ar: 'تحديث الطلب (#{id}): نود إعلامك بأنه تم إلغاء طلبك الخاص بـ ({service}).\nالسبب: {reason}',
      template_en: 'Request Update (#{id}): We regret to inform you that your request for ({service}) has been cancelled.\nReason: {reason}',
      is_enabled: 1,
    },
  ];

  const [localTemplates, setLocalTemplates] = useState<StatusReplyTemplate[]>(defaultList);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (templates && templates.length > 0) {
        const merged = templates.map((t, idx) => ({
          ...t,
          status_name_ar: t.status_name_ar || t.status_key,
          status_name_en: t.status_name_en || t.status_key,
          id: t.id || idx + 1,
        }));
        setLocalTemplates(merged);
        setSelectedId(merged[0].id);
      } else {
        setLocalTemplates(defaultList);
        setSelectedId(1);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = localTemplates.find((t) => t.id === selectedId) || localTemplates[0] || defaultList[0];

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleArChange = (val: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === current.id ? { ...t, template_ar: val } : t))
    );
  };

  const handleEnChange = (val: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === current.id ? { ...t, template_en: val } : t))
    );
  };

  const handleToggleEnabled = (checked: boolean) => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === current.id ? { ...t, is_enabled: checked ? 1 : 0 } : t))
    );
  };

  const insertTag = (tag: string, target: 'ar' | 'en') => {
    if (target === 'ar') {
      handleArChange((current.template_ar || '') + ` ${tag}`);
    } else {
      handleEnChange((current.template_en || '') + ` ${tag}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || isSaving) return;

    if (!current.template_ar?.trim()) {
      showToast('يرجى كتابة نص القالب بالعربية', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await onUpdate(
        current.id,
        current.template_ar.trim(),
        (current.template_en || '').trim(),
        current.is_enabled ? 1 : 0
      );

      if (res.success) {
        showToast('تم حفظ قالب الرد التلقائي بنجاح', 'success');
      } else {
        showToast(res.error || 'فشل حفظ القالب', 'error');
      }
    } finally {
      setIsSaving(false);
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
            {localTemplates.map((tpl) => {
              const isSelected = tpl.id === current.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelect(tpl.id)}
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
                  <span>{tpl.status_name_ar || tpl.status_key}</span>
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
                تفعيل الإرسال التلقائي لحالة ({current.status_name_ar || current.status_key})
              </span>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                <input
                  type="checkbox"
                  checked={Boolean(current.is_enabled)}
                  onChange={(e) => handleToggleEnabled(e.target.checked)}
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
                    backgroundColor: current.is_enabled ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
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
                      left: current.is_enabled ? '20px' : '3px',
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
                  {(current.status_key === 'ملغي' || current.status_name_ar === 'ملغي') && (
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
                value={current.template_ar || ''}
                onChange={(e) => handleArChange(e.target.value)}
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
                  {(current.status_key === 'ملغي' || current.status_name_ar === 'ملغي') && (
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
                value={current.template_en || ''}
                onChange={(e) => handleEnChange(e.target.value)}
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
