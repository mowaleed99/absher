import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ServiceRequest, StatusReplyTemplate, UpdateStatusPayload } from '../../types/request';
import { useI18n } from '../../lib/i18n';
import { StatusChangeModal } from './StatusChangeModal';

interface RequestDetailsModalProps {
  isOpen: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
  onStatusChange: (payload: UpdateStatusPayload) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  templates?: StatusReplyTemplate[];
}

export function RequestDetailsModal({
  isOpen,
  request,
  onClose,
  onStatusChange,
  showToast,
  templates = [],
}: RequestDetailsModalProps) {
  const { t } = useI18n();
  const [currentStatus, setCurrentStatus] = useState<string>('جديد');
  const [pendingTargetStatus, setPendingTargetStatus] = useState<string | null>(null);

  useEffect(() => {
    if (request) {
      setCurrentStatus(request.status || 'جديد');
      setPendingTargetStatus(null);
    }
  }, [request]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !pendingTargetStatus) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pendingTargetStatus, onClose]);

  if (!isOpen || !request) return null;

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setPendingTargetStatus(newStatus);
  };

  const handleStatusConfirm = async (payload: UpdateStatusPayload) => {
    const res = await onStatusChange(payload);
    if (res.success) {
      setCurrentStatus(payload.status);
      setPendingTargetStatus(null);
    }
    return res;
  };

  // Parse Form Data / Details
  const rawDetails = request.details || request.form_data || '';
  let parsedJson: Record<string, unknown> | null = null;
  if (rawDetails) {
    try {
      const parsed = JSON.parse(rawDetails);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedJson = parsed as Record<string, unknown>;
      }
    } catch {
      parsedJson = null;
    }
  }

  // Clean phone for WhatsApp link
  const cleanPhone = (request.student_phone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

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

  const getStatusBadgeStyle = (st: string) => {
    const norm = (st || '').toLowerCase().replace(/[\s_-]+/g, '_');
    switch (norm) {
      case 'جديد':
      case 'new':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'قيد_التنفيذ':
      case 'in_progress':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'مكتمل':
      case 'completed':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'ملغي':
      case 'cancelled':
      case 'canceled':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'pending_cash':
      case 'pendingcash':
      case 'pending_payment':
      case 'pendingpayment':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'قيد_المراجعة':
      case 'under_review':
      case 'pending':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      default:
        return { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pendingTargetStatus) onClose();
      }}
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
    >
      <div
        className="modal-box"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {request.service_title}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('requests.student_name')}: {request.student_name || 'طالب كريم'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(pendingTargetStatus)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
              borderRadius: '6px',
            }}
            title={t('btn.close')}
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
              background: 'var(--bg-main)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Student Name */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-user" style={{ marginLeft: '6px' }}></i>
                {t('requests.student_name')}
              </span>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                {request.student_name || 'طالب كريم'}
              </strong>
            </div>

            {/* Student Phone & Contact Buttons */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-phone" style={{ marginLeft: '6px' }}></i>
                {t('requests.student_phone')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', direction: 'ltr' }}>
                  {request.student_phone || '—'}
                </strong>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#25D366',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                    title={t('requests.whatsapp_btn')}
                  >
                    <i className="fa-brands fa-whatsapp"></i> {t('requests.whatsapp_btn')}
                  </a>
                )}
                {request.student_id ? (
                  <Link
                    to={`/chats?student_id=${request.student_id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--primary)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                    title={t('requests.chat_btn')}
                  >
                    <i className="fa-solid fa-headset"></i> {t('requests.chat_btn')}
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Status */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-signal" style={{ marginLeft: '6px' }}></i>
                {t('promo.status')}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  ...getStatusBadgeStyle(currentStatus),
                }}
              >
                {getStatusLabel(currentStatus)}
              </span>
            </div>

            {/* Created Date */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-calendar-days" style={{ marginLeft: '6px' }}></i>
                {t('requests.created_date')}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {request.created_at || '—'}
              </span>
            </div>

            {/* Points / Cost Info */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                <i className="fa-solid fa-coins" style={{ marginLeft: '6px' }}></i>
                تكلفة الطلب / النقاط
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {(request.points_charged || 0) > 0 ? (
                  <span style={{ color: 'var(--accent-amber)' }}>
                    {request.points_charged} نقطة
                    {request.discount_points ? ` (خصم ${request.discount_points} نقطة)` : ''}
                  </span>
                ) : (
                  <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-gift"></i>
                    خدمة مجانية (بدون نقاط)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Cancellation Info Banner (if already cancelled) */}
          {request.status === 'ملغي' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '14px', color: '#f87171' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-ban"></i>
                تم إلغاء هذا الطلب
              </div>
              {request.cancellation_reason && (
                <div style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-main)' }}>
                  <strong>سبب الإلغاء:</strong> {request.cancellation_reason}
                </div>
              )}
              {request.cancelled_at && (
                <div style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                  تاريخ الإلغاء: {request.cancelled_at}
                </div>
              )}
            </div>
          )}

          {/* Status Change Control */}
          {request.status !== 'ملغي' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {t('requests.change_status')}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {(['قيد المراجعة', 'قيد التنفيذ', 'مكتمل'] as const).map((st) => {
                  const isActive = currentStatus === st;
                  const badgeStyle = getStatusBadgeStyle(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusSelect(st)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isActive ? '2px solid var(--primary)' : badgeStyle.border,
                        background: isActive ? 'var(--primary)' : badgeStyle.background,
                        color: isActive ? '#fff' : badgeStyle.color,
                        boxShadow: isActive ? '0 0 10px var(--primary-glow)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {st}
                    </button>
                  );
                })}

                {/* Cancel Request Button */}
                {request.status !== 'مكتمل' && request.status !== 'ملغي' && (
                  <button
                    type="button"
                    onClick={() => handleStatusSelect('ملغي')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="fa-solid fa-ban" style={{ marginLeft: '4px' }}></i>
                    {(request.points_charged || 0) > 0 ? t('promo.cancel_request_title') : 'إلغاء الطلب'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submitted Form Data Section */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--primary)' }}></i>
              {t('requests.submitted_form_data')}
            </h4>

            {parsedJson ? (
              <div
                style={{
                  background: 'var(--bg-main)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                {Object.entries(parsedJson).map(([key, value], idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      padding: '12px 16px',
                      borderBottom: idx < Object.entries(parsedJson!).length - 1 ? '1px solid var(--border-color)' : 'none',
                      gap: '12px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '130px', fontWeight: 600 }}>
                      {key}:
                    </span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', wordBreak: 'break-word', flex: 1 }}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : rawDetails ? (
              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {rawDetails}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                {t('requests.no_form_data')}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}
          >
            {t('btn.close')}
          </button>
        </div>
      </div>

      {/* Interactive Status Change & Custom Reply Modal */}
      <StatusChangeModal
        isOpen={Boolean(pendingTargetStatus)}
        request={request}
        targetStatus={pendingTargetStatus || 'مكتمل'}
        templates={templates}
        onClose={() => setPendingTargetStatus(null)}
        onConfirm={handleStatusConfirm}
        showToast={showToast}
      />
    </div>
  );
}
