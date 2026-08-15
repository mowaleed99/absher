import { useState, useMemo } from 'react';
import { useDistricts } from '../../hooks/useDistricts';
import { District } from '../../types/district';
import { AddDistrictModal } from './AddDistrictModal';
import { EditDistrictModal } from './EditDistrictModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function DistrictsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { districts, isLoading, error, refetch, addDistrict, updateDistrict, deleteDistrict } = useDistricts();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return districts;
    const q = searchQuery.toLowerCase().trim();
    return districts.filter(d =>
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.name_ar && d.name_ar.toLowerCase().includes(q)) ||
      (d.name_en && d.name_en.toLowerCase().includes(q)) ||
      String(d.id) === q
    );
  }, [districts, searchQuery]);

  const handleDelete = async (district: District) => {
    const confirmed = await confirm({
      title: t('dialog.delete_district_title'),
      message: `${t('dialog.delete_district_msg')} (${district.name_ar || district.name})`,
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    const res = await deleteDistrict(district.id);
    if (res.success) {
      showToast(t('msg.district_deleted'), 'success');
    } else {
      showToast(res.error || t('msg.error_delete_district'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* Module Header */}
      <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--accent-amber)', marginLeft: '8px' }}></i>
            {t('districts.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
            {t('districts.desc')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-glow"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '12px', fontWeight: 600 }}
        >
          <i className="fa-solid fa-plus-circle"></i>
          <span>{t('districts.add_button')}</span>
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
            placeholder={t('districts.search_placeholder')}
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
                transition: 'background 0.2s',
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
          {t('districts.count', { count: filteredDistricts.length })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '12px' }}></i>
          <p>{t('districts.loading')}</p>
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
      {!isLoading && !error && filteredDistricts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-map-location-dot fa-3x" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '16px' }}></i>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{t('districts.empty_state')}</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ marginTop: '16px' }}
          >
            <i className="fa-solid fa-plus"></i> {t('districts.add_button')}
          </button>
        </div>
      )}

      {/* Districts Grid / List */}
      {!isLoading && !error && filteredDistricts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredDistricts.map((district) => (
            <div
              key={district.id}
              className="service-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 20px',
                background: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-amber)',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {district.name_ar || district.name}
                  </h3>
                  {district.name_en && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {district.name_en}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingDistrict(district)}
                  style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.9rem' }}
                  title={t('btn.edit')}
                >
                  <i className="fa-solid fa-pen"></i> {t('btn.edit')}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleDelete(district)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                  title={t('btn.delete')}
                >
                  <i className="fa-solid fa-trash"></i> {t('btn.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddDistrictModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addDistrict}
        showToast={showToast}
      />

      {/* Edit Modal */}
      <EditDistrictModal
        isOpen={!!editingDistrict}
        district={editingDistrict}
        onClose={() => setEditingDistrict(null)}
        onSubmit={updateDistrict}
        showToast={showToast}
      />
    </section>
  );
}
