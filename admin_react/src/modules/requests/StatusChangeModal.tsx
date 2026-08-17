import React, { useState, useEffect, useRef } from 'react';
import { ServiceRequest, StatusReplyTemplate, UpdateStatusPayload } from '../../types/request';
import { useI18n } from '../../lib/i18n';

interface StatusChangeModalProps {
  isOpen: boolean;
  request: ServiceRequest | null;
  targetStatus: string;
  templates: StatusReplyTemplate[];
  onClose: () => void;
  onConfirm: (payload: UpdateStatusPayload) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function getServiceTitleEn(titleAr: string): string {
  if (!titleAr) return titleAr;
  const t = titleAr.trim().toLowerCase();
  if (t.includes('تنظيف') || t.includes('clean')) return 'Cleaning Service';
  if (t.includes('شريك') || t.includes('roommate')) return 'Roommate Match';
  if (t.includes('حجز') || t.includes('معاينة') || t.includes('شقة') || t.includes('apartment')) return 'Apartment Viewing & Booking';
  if (t.includes('استقبال') || t.includes('مطار') || t.includes('airport')) return 'Airport Pickup';
  if (t.includes('ترجمة') || t.includes('translation')) return 'Translation Service';
  if (t.includes('صيانة') || t.includes('maintenance')) return 'Maintenance Service';
  if (t.includes('استشارة') || t.includes('consultation')) return 'Consultation Service';
  if (t.includes('توصيل') || t.includes('delivery')) return 'Delivery Service';
  return titleAr;
}

function getStatusLabelEn(st: string): string {
  const norm = (st || '').toLowerCase().replace(/[\s_-]+/g, '_');
  if (norm === 'قيد_المراجعة' || norm === 'under_review' || norm === 'pending') return 'Under Review';
  if (norm === 'قيد_التنفيذ' || norm === 'in_progress') return 'In Progress';
  if (norm === 'مكتمل' || norm === 'completed') return 'Completed';
  if (norm === 'ملغي' || norm === 'cancelled' || norm === 'canceled') return 'Cancelled';
  if (norm === 'pending_cash' || norm === 'pendingcash') return 'Pending Cash Payment';
  return st;
}

// Helper to render template text with request values
function renderTemplateText(tplText: string, req: ServiceRequest, targetStatus: string, reason = '', isEn = false) {
  const serviceTitle = isEn ? getServiceTitleEn(req.service_title) : req.service_title;
  const statusStr = isEn ? getStatusLabelEn(targetStatus) : targetStatus;
  const reasonStr = reason || (isEn ? 'Not specified' : 'لم يذكر سبب');
  return tplText
    .replace(/\{id\}/g, '')
    .replace(/\(#\)/g, '')
    .replace(/#\{id\}/g, '')
    .replace(/\{service\}/g, serviceTitle || (isEn ? 'Service' : 'خدمة'))
    .replace(/\{status\}/g, statusStr)
    .replace(/\{reason\}/g, reasonStr)
    .replace(/\{points\}/g, String(req.points_charged || 0));
}

export function StatusChangeModal({
  isOpen,
  request,
  targetStatus,
  templates,
  onClose,
  onConfirm,
  showToast,
}: StatusChangeModalProps) {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';

  const [cancellationReason, setCancellationReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sendChat, setSendChat] = useState(true);
  const [msgLang, setMsgLang] = useState<'ar' | 'en' | 'both'>('ar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // When modal opens or targetStatus / msgLang changes, prepare default text
  useEffect(() => {
    if (!isOpen || !request) return;

    setCancellationReason('');
    setIsSubmitting(false);
    submitLockRef.current = false;

    const tpl = templates.find((t) => t.status_key === targetStatus);
    if (tpl) {
      const renderedAr = renderTemplateText(tpl.template_ar, request, targetStatus, '', false);
      const renderedEn = renderTemplateText(tpl.template_en, request, targetStatus, '', true);

      if (msgLang === 'en') {
        setCustomMessage(renderedEn);
      } else if (msgLang === 'both') {
        setCustomMessage(`${renderedAr}\n\n--------------------\n\n${renderedEn}`);
      } else {
        setCustomMessage(renderedAr);
      }
    } else {
      if (targetStatus === 'ملغي') {
        if (msgLang === 'en') {
          setCustomMessage(`Request Update: We regret to inform you that your request for (${getServiceTitleEn(request.service_title)}) has been cancelled.`);
        } else if (msgLang === 'both') {
          setCustomMessage(`تحديث الطلب: نود إعلامك بأنه تم إلغاء طلبك الخاص بـ (${request.service_title}).\n\n--------------------\n\nRequest Update: We regret to inform you that your request for (${getServiceTitleEn(request.service_title)}) has been cancelled.`);
        } else {
          setCustomMessage(`تحديث الطلب: نود إعلامك بأنه تم إلغاء طلبك الخاص بـ (${request.service_title}).`);
        }
      } else {
        if (msgLang === 'en') {
          setCustomMessage(`Request Update: Your request for (${getServiceTitleEn(request.service_title)}) status has been updated to: ${getStatusLabelEn(targetStatus)}`);
        } else if (msgLang === 'both') {
          setCustomMessage(`تحديث الطلب: تم تغيير حالة طلبك الخاص بـ (${request.service_title}) إلى: ${targetStatus}\n\n--------------------\n\nRequest Update: Your request for (${getServiceTitleEn(request.service_title)}) status has been updated to: ${getStatusLabelEn(targetStatus)}`);
        } else {
          setCustomMessage(`تحديث الطلب: تم تغيير حالة طلبك الخاص بـ (${request.service_title}) إلى: ${targetStatus}`);
        }
      }
    }
  }, [isOpen, request, targetStatus, msgLang, templates]);

  // Update cancellation reason in text if reason changes
  const handleReasonChange = (reason: string) => {
    setCancellationReason(reason);
    if (targetStatus === 'ملغي' && request) {
      const tpl = templates.find((t) => t.status_key === 'ملغي');
      if (tpl) {
        const renderedAr = renderTemplateText(tpl.template_ar, request, targetStatus, reason, false);
        const renderedEn = renderTemplateText(tpl.template_en, request, targetStatus, reason, true);
        if (msgLang === 'en') {
          setCustomMessage(renderedEn);
        } else if (msgLang === 'both') {
          setCustomMessage(`${renderedAr}\n\n--------------------\n\n${renderedEn}`);
        } else {
          setCustomMessage(renderedAr);
        }
      }
    }
  };

  if (!isOpen || !request) return null;

  const getStatusLabel = (st: string) => {
    const norm = (st || '').toLowerCase().replace(/[\s_-]+/g, '_');
    if (norm === 'pending_cash' || norm === 'pendingcash') return t('status.pending_cash');
    if (norm === 'pending_payment' || norm === 'pendingpayment') return t('status.pending_payment');
    if (norm === 'قيد_المراجعة' || norm === 'under_review' || norm === 'pending') return t('status.under_review');
    if (norm === 'جديد' || norm === 'new') return t('status.new');
    if (norm === 'قيد_التنفيذ' || norm === 'in_progress') return t('status.in_progress');
    if (norm === 'مكتمل' || norm === 'completed') return t('status.completed');
    if (norm === 'ملغي' || norm === 'cancelled' || norm === 'canceled') return t('status.cancelled');
    return st;
  };

  const getStatusBadgeClass = (s: string) => {
    const norm = (s || '').toLowerCase().replace(/[\s_-]+/g, '_');
    switch (norm) {
      case 'قيد_المراجعة':
      case 'under_review':
      case 'pending':
        return 'badge-warning';
      case 'قيد_التنفيذ':
      case 'in_progress':
        return 'badge-primary';
      case 'مكتمل':
      case 'completed':
        return 'badge-success';
      case 'ملغي':
      case 'cancelled':
      case 'canceled':
        return 'badge-danger';
      case 'pending_cash':
      case 'pendingcash':
      case 'pending_payment':
      case 'pendingpayment':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const insertVariable = (tag: string) => {
    setCustomMessage((prev) => prev + ` ${tag}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    if (targetStatus === 'ملغي' && !cancellationReason.trim()) {
      showToast(t('promo.cancel_reason_label'), 'error');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const payload: UpdateStatusPayload = {
        id: request.id,
        status: targetStatus,
        cancellationReason: targetStatus === 'ملغي' ? cancellationReason.trim() : undefined,
        customMessage: sendChat ? customMessage.trim() : undefined,
        sendChat,
        msgLang,
      };

      const res = await onConfirm(payload);
      if (res.success) {
        showToast(
          isRtl ? 'تم تحديث حالة الطلب وإرسال الرد بنجاح' : 'Status updated and reply sent successfully',
          'success'
        );
        onClose();
      } else {
        showToast(res.error || t('msg.error_update_request_status'), 'error');
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
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
              <i className="fa-solid fa-paper-plane" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {t('req.change_status_modal_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {request.service_title} • {request.student_name || 'طالب كريم'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {/* Status Transition Header Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t('req.current_status')}
              </div>
              <span className={`badge ${getStatusBadgeClass(request.status)}`} style={{ padding: '4px 10px' }}>
                {getStatusLabel(request.status)}
              </span>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              <i className={`fa-solid ${isRtl ? 'fa-arrow-left' : 'fa-arrow-right'}`} />
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t('req.target_status')}
              </div>
              <span className={`badge ${getStatusBadgeClass(targetStatus)}`} style={{ padding: '4px 10px' }}>
                {getStatusLabel(targetStatus)}
              </span>
            </div>
          </div>

          {/* If Cancelled -> Mandatory Reason */}
          {targetStatus === 'ملغي' && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--danger)',
                }}
              >
                <i className="fa-solid fa-circle-exclamation" style={{ marginInlineEnd: '6px' }} />
                {t('promo.cancel_reason_label')} *
              </label>
              <textarea
                className="input-field"
                rows={2}
                value={cancellationReason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder={t('promo.cancel_reason_placeholder')}
                required
                style={{ width: '100%', borderRadius: '8px', padding: '10px' }}
              />
            </div>
          )}

          {/* Send Chat Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-comments" style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('req.send_chat_toggle')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('req.reply_message_desc')}</div>
              </div>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input
                type="checkbox"
                checked={sendChat}
                onChange={(e) => setSendChat(e.target.checked)}
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
                  backgroundColor: sendChat ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
                  transition: '0.3s',
                  borderRadius: '24px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: sendChat ? '22px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%',
                  }}
                />
              </span>
            </label>
          </div>

          {/* Language Selection Buttons (when sendChat is ON) */}
          {sendChat && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-language" style={{ marginInlineEnd: '6px', color: 'var(--primary)' }} />
                  {t('req.reply_message')}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`btn ${msgLang === 'ar' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setMsgLang('ar')}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    {t('req.lang_ar')}
                  </button>
                  <button
                    type="button"
                    className={`btn ${msgLang === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setMsgLang('en')}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    {t('req.lang_en')}
                  </button>
                  <button
                    type="button"
                    className={`btn ${msgLang === 'both' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setMsgLang('both')}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    {t('req.lang_both')}
                  </button>
                </div>
              </div>

              {/* Editable Message Textarea */}
              <textarea
                className="input-field custom-scrollbar"
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t('req.custom_message_placeholder')}
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  fontFamily: 'inherit',
                }}
              />

              {/* Quick Variable Tags */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{t('req.quick_tags')}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => insertVariable('{id}')}
                  style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '4px' }}
                >
                  <code>&#123;id&#125;</code> {t('req.tag_id')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => insertVariable('{service}')}
                  style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '4px' }}
                >
                  <code>&#123;service&#125;</code> {t('req.tag_service')}
                </button>
                {targetStatus === 'ملغي' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => insertVariable('{reason}')}
                    style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '4px' }}
                  >
                    <code>&#123;reason&#125;</code> {t('req.tag_reason')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 20px', borderRadius: '8px' }}
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '8px 24px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '160px',
                justifyContent: 'center',
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  <span>{t('form.saving')}</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" />
                  <span>{t('req.confirm_status_change')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
