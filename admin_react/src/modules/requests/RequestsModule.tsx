import { useState, useMemo } from 'react';
import { useRequests } from '../../hooks/useRequests';
import { useStatusTemplates } from '../../hooks/useStatusTemplates';
import { ServiceRequest } from '../../types/request';
import { RequestCard } from './RequestCard';
import { RequestDetailsModal } from './RequestDetailsModal';
import { StatusTemplatesModal } from './StatusTemplatesModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function RequestsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { requests, isLoading, error, refetch, updateRequestStatus, deleteRequest } = useRequests();
  const { templates, updateTemplate } = useStatusTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Status Filter options
  const statusOptions = [
    { key: 'all', label: t('requests.status_all'), icon: 'fa-layer-group' },
    { key: 'جديد', label: t('requests.status_new'), icon: 'fa-bell' },
    { key: 'قيد التنفيذ', label: t('requests.status_in_progress'), icon: 'fa-clock' },
    { key: 'مكتمل', label: t('requests.status_completed'), icon: 'fa-circle-check' },
    { key: 'ملغي', label: t('requests.status_cancelled'), icon: 'fa-ban' },
  ];

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesStudent = r.student_name && r.student_name.toLowerCase().includes(q);
        const matchesPhone = r.student_phone && r.student_phone.toLowerCase().includes(q);
        const matchesService = r.service_title && r.service_title.toLowerCase().includes(q);
        const matchesId = String(r.id) === q || `#${r.id}` === q;
        if (!matchesStudent && !matchesPhone && !matchesService && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const handleDelete = async (request: ServiceRequest) => {
    const confirmed = await confirm({
      title: t('dialog.delete_request_title'),
      message: `${t('dialog.delete_request_msg')} (طلب #${request.id} - ${request.service_title})`,
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    const res = await deleteRequest(request.id);
    if (res.success) {
      showToast(t('msg.request_deleted'), 'success');
      if (selectedRequest?.id === request.id) {
        setSelectedRequest(null);
      }
    } else {
      showToast(res.error || t('msg.error_delete_request'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-bell" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('requests.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
            {t('requests.desc')}
          </p>
        </div>

        {/* Templates Management Action Button */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsTemplatesOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.88rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--primary)' }} />
          <span>{t('req.manage_templates')}</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt.key;
          const count = opt.key === 'all'
            ? requests.length
            : requests.filter((r) => r.status === opt.key).length;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setStatusFilter(opt.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-main)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                boxShadow: isActive ? '0 0 12px var(--primary-glow)' : '0 2px 6px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              <i className={`fa-solid ${opt.icon}`}></i>
              <span>{opt.label}</span>
              <span
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease',
              fontSize: '0.95rem',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="search-input"
            placeholder={t('requests.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingInlineStart: '44px',
              paddingInlineEnd: searchQuery ? '36px' : '16px',
              background: 'var(--bg-card)',
              border: isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
              boxShadow: isFocused
                ? '0 0 0 3px var(--primary-glow), 0 4px 12px rgba(0, 0, 0, 0.1)'
                : '0 2px 6px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                [isRtl ? 'left' : 'right']: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'var(--text-muted)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              &times;
            </button>
          )}
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '8px 16px',
            borderRadius: '20px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}
        >
          {t('requests.count', { count: filteredRequests.length })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '12px' }}></i>
          <p>{t('requests.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444', marginBottom: '24px' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x" style={{ marginBottom: '10px' }}></i>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: '12px' }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredRequests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-bell-slash fa-3x" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '16px' }}></i>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('requests.empty_state')}</h3>
        </div>
      )}

      {/* Requests Grid */}
      {!isLoading && !error && filteredRequests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onViewDetails={(r) => setSelectedRequest(r)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Request Details Modal */}
      <RequestDetailsModal
        isOpen={!!selectedRequest}
        request={selectedRequest}
        templates={templates}
        onClose={() => setSelectedRequest(null)}
        onStatusChange={updateRequestStatus}
        showToast={showToast}
      />

      {/* Status Reply Templates Management Modal */}
      <StatusTemplatesModal
        isOpen={isTemplatesOpen}
        templates={templates}
        onClose={() => setIsTemplatesOpen(false)}
        onUpdate={updateTemplate}
        showToast={showToast}
      />
    </section>
  );
}
