import { Link } from 'react-router-dom';
import { ServiceRequest } from '../../types/request';
import { useI18n } from '../../lib/i18n';

interface RequestCardProps {
  request: ServiceRequest;
  onViewDetails: (request: ServiceRequest) => void;
  onDelete: (request: ServiceRequest) => void;
}

export function RequestCard({ request, onViewDetails, onDelete }: RequestCardProps) {
  const { t } = useI18n();

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
        return { background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)' };
      case 'قيد_التنفيذ':
      case 'in_progress':
        return { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'مكتمل':
      case 'completed':
        return { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'ملغي':
      case 'cancelled':
      case 'canceled':
        return { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' };
      case 'pending_cash':
      case 'pendingcash':
      case 'pending_payment':
      case 'pendingpayment':
        return { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'قيد_المراجعة':
      case 'under_review':
      case 'pending':
        return { background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.25)' };
      default:
        return { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.25)' };
    }
  };

  const statusStyle = getStatusBadgeStyle(request.status);

  const isRoommateReq =
    (request.service_title || '').includes('شريك') ||
    (request.service_title || '').toLowerCase().includes('roommate');

  return (
    <div
      className="item-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '14px',
        border: isRoommateReq ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header Row: Service Title + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
          {isRoommateReq && (
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-users" />
              طلب شريك سكن
            </span>
          )}
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={request.service_title}
          >
            {request.service_title}
          </h3>
        </div>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...statusStyle,
          }}
        >
          {getStatusLabel(request.status)}
        </span>
      </div>

      {/* Student Meta Rows (High Density) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          padding: '2px 0',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-regular fa-user" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('requests.student_name')}
          </span>
          <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>
            {request.student_name || 'طالب كريم'}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-phone" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('requests.student_phone')}
          </span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600, direction: 'ltr' }}>
            {request.student_phone || '—'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-regular fa-calendar" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('requests.created_date')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {request.created_at || '—'}
          </span>
        </div>
      </div>

      {/* Cohesive Action Footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {/* Tier 1: Communication Actions (WhatsApp + Support Chat) */}
        {(whatsappUrl || request.student_id) && (
          <div style={{ display: 'grid', gridTemplateColumns: whatsappUrl && request.student_id ? '1fr 1fr' : '1fr', gap: '6px' }}>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  color: '#25D366',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                title={t('requests.whatsapp_btn')}
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '0.9rem' }}></i>
                <span>{t('requests.whatsapp_btn')}</span>
              </a>
            )}

            {request.student_id ? (
              <Link
                to={`/chats?student_id=${request.student_id}`}
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                title={t('requests.chat_btn')}
              >
                <i className="fa-solid fa-headset" style={{ fontSize: '0.85rem' }}></i>
                <span>{t('requests.chat_btn')}</span>
              </Link>
            ) : null}
          </div>
        )}

        {/* Tier 2: Management Actions (Primary Details + Danger Delete) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onViewDetails(request)}
            style={{
              flex: 1,
              height: '36px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 12px',
            }}
          >
            <i className="fa-solid fa-eye" style={{ fontSize: '0.85rem' }}></i>
            <span>{t('requests.details_btn')}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => onDelete(request)}
            style={{
              width: '36px',
              height: '36px',
              flexShrink: 0,
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            title={t('btn.delete')}
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
