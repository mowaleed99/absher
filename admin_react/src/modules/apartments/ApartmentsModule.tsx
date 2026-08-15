import { useState, useMemo } from 'react';
import { Apartment } from '../../types/apartment';
import { useApartments } from '../../hooks/useApartments';
import { useDistricts } from '../../hooks/useDistricts';
import { useUniversities } from '../../hooks/useUniversities';
import { ApartmentCard } from './ApartmentCard';
import { AddApartmentModal } from './AddApartmentModal';
import { EditApartmentModal } from './EditApartmentModal';
import { PinApartmentModal } from './PinApartmentModal';
import { useI18n } from '../../lib/i18n';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export function ApartmentsModule() {
  const { t } = useI18n();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  const {
    apartments,
    isLoading,
    error,
    addApartment,
    updateApartment,
    deleteApartment,
    toggleFeatured,
    refetch,
  } = useApartments();

  const { districts } = useDistricts();
  const { universities } = useUniversities();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [rentalTypeFilter, setRentalTypeFilter] = useState('all');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [pinningApartment, setPinningApartment] = useState<Apartment | null>(null);

  // Filtered Apartments
  const filteredApartments = useMemo(() => {
    return apartments.filter((apt) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const idStr = String(apt.id);
        const matchesId = idStr === q || `#${idStr}` === q || `no. ${idStr}` === q || `no ${idStr}` === q;
        const matchesTitle =
          (apt.title || '').toLowerCase().includes(q) ||
          (apt.title_ar || '').toLowerCase().includes(q) ||
          (apt.title_en || '').toLowerCase().includes(q);
        const matchesLocation =
          (apt.location || '').toLowerCase().includes(q) ||
          (apt.location_ar || '').toLowerCase().includes(q) ||
          (apt.location_en || '').toLowerCase().includes(q);
        const matchesDesc =
          (apt.description || '').toLowerCase().includes(q) ||
          (apt.description_ar || '').toLowerCase().includes(q) ||
          (apt.description_en || '').toLowerCase().includes(q);

        if (!matchesId && !matchesTitle && !matchesLocation && !matchesDesc) {
          return false;
        }
      }

      // 2. District Filter
      if (districtFilter !== '') {
        if (String(apt.district_id) !== String(districtFilter)) {
          return false;
        }
      }

      // 3. Rental Type Filter
      if (rentalTypeFilter !== 'all') {
        if (apt.rental_type !== rentalTypeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [apartments, searchQuery, districtFilter, rentalTypeFilter]);

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: t('dialog.delete_apartment_title'),
      message: t('dialog.delete_apartment_msg'),
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!isConfirmed) return;

    const res = await deleteApartment(id);
    if (res.success) {
      showToast(t('msg.apartment_deleted'), 'success');
    } else if (res.requiresConfirmation) {
      // Cascade delete confirmation
      const cascadeConfirm = await confirm({
        title: t('dialog.delete_apartment_offers_title'),
        message: res.message || 'هذه الشقة مرتبطة بعروض سكنية. هل ترغب في حذفها وحذف العروض المرتبطة بها؟',
        confirmText: t('btn.delete'),
        cancelText: t('btn.cancel'),
        variant: 'danger',
      });
      if (cascadeConfirm) {
        const cascadeRes = await deleteApartment(id, true);
        if (cascadeRes.success) {
          showToast(t('msg.apartment_deleted'), 'success');
        } else {
          showToast(cascadeRes.error || t('msg.delete_failed'), 'error');
        }
      }
    } else {
      showToast(res.error || t('msg.delete_failed'), 'error');
    }
  };

  return (
    <section className="dashboard-module active">
      {/* Header & Controls */}
      <div className="module-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="module-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
              <i className="fa-solid fa-building" style={{ color: 'var(--primary)', marginInlineEnd: '10px' }} />
              {t('nav.apartments')}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t('apartments.count_label', { count: apartments.length })}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddOpen(true)}
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-plus" />
            <span>{t('apartments.add_new')}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '20px',
            background: 'var(--bg-card)',
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            alignItems: 'center',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                insetInlineStart: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder={t('apartments.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingInlineStart: '36px',
                width: '100%',
                borderRadius: '10px',
              }}
            />
          </div>

          {/* District Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="input-field"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{ width: '100%', borderRadius: '10px' }}
            >
              <option value="">{t('apartments.all_districts')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ar || d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rental Type Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="input-field"
              value={rentalTypeFilter}
              onChange={(e) => setRentalTypeFilter(e.target.value)}
              style={{ width: '100%', borderRadius: '10px' }}
            >
              <option value="all">{t('apartments.all_types')}</option>
              <option value="apartment">{t('rental_type.apartment')}</option>
              <option value="room_shared">{t('rental_type.room_shared')}</option>
              <option value="studio">{t('rental_type.studio')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Apartment Grid / List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            color: '#ef4444',
          }}
        >
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
          <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={refetch}>
            <i className="fa-solid fa-rotate-right"></i> {t('common.retry')}
          </button>
        </div>
      ) : filteredApartments.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <i className="fa-solid fa-building" style={{ fontSize: '3rem', opacity: 0.4, marginBottom: '16px' }}></i>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>
            {t('apartments.empty_state')}
          </p>
        </div>
      ) : (
        <div className="grid-container" id="apartmentsList">
          {filteredApartments.map((apt) => (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              onEdit={(apartment) => setEditingApartment(apartment)}
              onDelete={handleDelete}
              onPin={(apartment) => setPinningApartment(apartment)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddApartmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={addApartment}
        districts={districts}
        universities={universities}
      />

      {/* Edit Modal */}
      <EditApartmentModal
        apartment={editingApartment}
        isOpen={!!editingApartment}
        onClose={() => setEditingApartment(null)}
        onSubmit={updateApartment}
        districts={districts}
        universities={universities}
      />

      {/* Pin Modal */}
      <PinApartmentModal
        isOpen={!!pinningApartment}
        apartment={pinningApartment}
        onClose={() => setPinningApartment(null)}
        onConfirm={toggleFeatured}
        showToast={showToast}
      />
    </section>
  );
}
