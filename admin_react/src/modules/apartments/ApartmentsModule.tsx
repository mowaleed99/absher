import { useState, useMemo } from 'react';
import { Apartment } from '../../types/apartment';
import { useApartments } from '../../hooks/useApartments';
import { useDistricts } from '../../hooks/useDistricts';
import { useUniversities } from '../../hooks/useUniversities';
import { ApartmentCard } from './ApartmentCard';
import { AddApartmentModal } from './AddApartmentModal';
import { EditApartmentModal } from './EditApartmentModal';
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
          showToast(cascadeRes.error || t('msg.error_delete_apartment'), 'error');
        }
      }
    } else {
      showToast(res.error || t('msg.error_delete_apartment'), 'error');
    }
  };

  return (
    <section className="tab-pane active">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-building" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('apartments.title')}
          </h2>
          <p>{t('apartments.desc')}</p>
        </div>
        <button
          type="button"
          className="btn btn-glow"
          onClick={() => setIsAddOpen(true)}
        >
          <i className="fa-solid fa-plus-circle"></i>
          {t('apartments.add_button')}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div
        style={{
          margin: '0 0 24px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('apartments.search_placeholder')}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* District Filter */}
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">{t('filter.all_districts')}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name_ar || d.name}
            </option>
          ))}
        </select>

        {/* Rental Type Filter */}
        <select
          value={rentalTypeFilter}
          onChange={(e) => setRentalTypeFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">{t('rental_type.all')}</option>
          <option value="apartment">{t('rental_type.apartment')}</option>
          <option value="room_shared">{t('rental_type.room_shared')}</option>
          <option value="studio">{t('rental_type.studio')}</option>
        </select>
      </div>

      {/* Content State: Loading / Error / Empty / Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '16px' }}></i>
          <p style={{ fontSize: '1.1rem' }}>{t('apartments.loading')}</p>
        </div>
      ) : error ? (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            color: '#ef4444',
          }}
        >
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
          <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={refetch}>
            <i className="fa-solid fa-rotate-right"></i> إعادة المحاولة
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
    </section>
  );
}
