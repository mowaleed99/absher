import { useState, useMemo } from 'react';
import { useServices } from '../../hooks/useServices';
import { Service } from '../../types/service';
import { ServiceCard } from './ServiceCard';
import { AddServiceModal } from './AddServiceModal';
import { EditServiceModal } from './EditServiceModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function ServicesModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { services, isLoading, error, refetch, addService, updateService, deleteService } = useServices();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter((s) =>
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.title_ar && s.title_ar.toLowerCase().includes(q)) ||
      (s.title_en && s.title_en.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.description_ar && s.description_ar.toLowerCase().includes(q)) ||
      (s.description_en && s.description_en.toLowerCase().includes(q)) ||
      String(s.id) === q
    );
  }, [services, searchQuery]);

  const handleDelete = async (service: Service) => {
    const confirmed = await confirm({
      title: t('dialog.delete_service_title'),
      message: `${t('dialog.delete_service_msg')} (${service.title_ar || service.title})`,
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    const res = await deleteService(service.id);
    if (res.success) {
      showToast(t('msg.service_deleted'), 'success');
    } else {
      showToast(res.error || t('msg.error_delete_service'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-screwdriver-wrench" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('services.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
            {t('services.desc')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-glow"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '12px', fontWeight: 600 }}
        >
          <i className="fa-solid fa-plus-circle"></i>
          <span>{t('services.add_button')}</span>
        </button>
      </div>

      {/* Search and Stats Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '28px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 320px',
            maxWidth: '560px',
          }}
        >
          {/* Integrated Search Icon */}
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.95rem',
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          ></i>

          {/* Premium Dark Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('services.search_placeholder')}
            style={{
              width: '100%',
              height: '46px',
              paddingRight: isRtl ? '44px' : '40px',
              paddingLeft: isRtl ? '40px' : '44px',
              borderRadius: '12px',
              border: isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
              boxShadow: isFocused
                ? '0 0 0 3px rgba(99, 102, 241, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)'
                : '0 2px 6px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Clear Search Button */}
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
                lineHeight: 1,
              }}
              title={t('btn.cancel')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Count Badge */}
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
          {t('services.count', { count: filteredServices.length })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '12px' }}></i>
          <p>{t('services.loading')}</p>
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
      {!isLoading && !error && filteredServices.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-screwdriver-wrench fa-3x" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '16px' }}></i>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('services.empty_state')}</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ marginTop: '16px' }}
          >
            <i className="fa-solid fa-plus"></i> {t('services.add_button')}
          </button>
        </div>
      )}

      {/* Services Grid */}
      {!isLoading && !error && filteredServices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={(s) => setEditingService(s)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addService}
        showToast={showToast}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        isOpen={!!editingService}
        service={editingService}
        onClose={() => setEditingService(null)}
        onSubmit={updateService}
        showToast={showToast}
      />
    </section>
  );
}
