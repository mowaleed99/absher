import { useState, useMemo } from 'react';
import { Apartment } from '../../types/apartment';
import { useApartments } from '../../hooks/useApartments';
import { useDistricts } from '../../hooks/useDistricts';
import { useUniversities } from '../../hooks/useUniversities';
import { ApartmentCard } from '../apartments/ApartmentCard';
import { AddApartmentModal } from '../apartments/AddApartmentModal';
import { EditApartmentModal } from '../apartments/EditApartmentModal';
import { PinApartmentModal } from '../apartments/PinApartmentModal';
import { useI18n } from '../../lib/i18n';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export function SharedRoomsModule() {
  const { t, lang } = useI18n();
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'special' | 'featured'>('all');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [pinningApartment, setPinningApartment] = useState<Apartment | null>(null);

  // All shared room apartments
  const sharedRooms = useMemo(() => {
    return apartments.filter((apt) => apt.rental_type === 'room_shared');
  }, [apartments]);

  // Summary KPIs
  const stats = useMemo(() => {
    const total = sharedRooms.length;
    const available = sharedRooms.filter((a) => Boolean(a.is_available)).length;
    const special = sharedRooms.filter((a) => Boolean(a.is_special_offer)).length;
    const featured = sharedRooms.filter((a) => Boolean(a.is_featured)).length;

    return { total, available, special, featured };
  }, [sharedRooms]);

  // Filtered shared rooms
  const filteredRooms = useMemo(() => {
    return sharedRooms.filter((apt) => {
      // 1. Status Filter
      if (statusFilter === 'available' && !apt.is_available) return false;
      if (statusFilter === 'special' && !apt.is_special_offer) return false;
      if (statusFilter === 'featured' && !apt.is_featured) return false;

      // 2. District Filter
      if (districtFilter !== '') {
        if (String(apt.district_id) !== String(districtFilter)) {
          return false;
        }
      }

      // 3. Search Query
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
        const matchesReqs =
          (apt.roommate_reqs || '').toLowerCase().includes(q) ||
          (apt.roommate_facilities || '').toLowerCase().includes(q);
        const matchesDesc =
          (apt.description || '').toLowerCase().includes(q) ||
          (apt.description_ar || '').toLowerCase().includes(q) ||
          (apt.description_en || '').toLowerCase().includes(q);

        if (!matchesId && !matchesTitle && !matchesLocation && !matchesReqs && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [sharedRooms, statusFilter, districtFilter, searchQuery]);

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: lang === 'ar' ? 'حذف الغرفة المشتركة' : 'Delete Shared Room',
      message: lang === 'ar'
        ? 'هل أنت متأكد من حذف هذه الغرفة المشتركة؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this shared room listing? This action cannot be undone.',
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!isConfirmed) return;

    const res = await deleteApartment(id);
    if (res.success) {
      showToast(lang === 'ar' ? 'تم حذف الغرفة المشتركة بنجاح' : 'Shared room deleted successfully', 'success');
    } else if (res.requiresConfirmation) {
      const cascadeConfirm = await confirm({
        title: lang === 'ar' ? 'تأكيد الحذف المرتبط' : 'Confirm Cascade Delete',
        message: res.message || 'هذه الغرفة مرتبطة بعروض سكنية. هل ترغب في حذفها وحذف العروض المرتبطة بها؟',
        confirmText: t('btn.delete'),
        cancelText: t('btn.cancel'),
        variant: 'danger',
      });
      if (cascadeConfirm) {
        const cascadeRes = await deleteApartment(id, true);
        if (cascadeRes.success) {
          showToast(lang === 'ar' ? 'تم حذف الغرفة المشتركة بنجاح' : 'Shared room deleted successfully', 'success');
        } else {
          showToast(cascadeRes.error || t('msg.delete_failed'), 'error');
        }
      }
    } else {
      showToast(res.error || t('msg.delete_failed'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header */}
      <div className="section-header">
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-house-circle-check" style={{ color: '#a855f7', marginLeft: '8px' }}></i>
            {t('shared_rooms.title')}
          </h2>
          <p>
            {t('shared_rooms.desc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-glow"
            style={{
              background: 'linear-gradient(135deg, #9333ea, #6366f1)',
              boxShadow: '0 4px 14px rgba(147, 51, 234, 0.35)',
            }}
            onClick={() => setIsAddOpen(true)}
          >
            <i className="fa-solid fa-plus-circle"></i>
            {t('btn.add_shared_room')}
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Total Rooms */}
        <div
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: `1px solid ${statusFilter === 'all' ? '#a855f7' : 'var(--border-color)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            <i className="fa-solid fa-door-open"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.total}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('shared_rooms.total')}
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: `1px solid ${statusFilter === 'available' ? '#10b981' : 'var(--border-color)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{stats.available}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('shared_rooms.available')}
            </div>
          </div>
        </div>

        {/* Special Offers */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'special' ? 'all' : 'special')}
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: `1px solid ${statusFilter === 'special' ? '#ef4444' : 'var(--border-color)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            <i className="fa-solid fa-fire"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{stats.special}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('shared_rooms.special_offers')}
            </div>
          </div>
        </div>

        {/* Featured / Pinned */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'featured' ? 'all' : 'featured')}
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: `1px solid ${statusFilter === 'featured' ? '#f59e0b' : 'var(--border-color)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{stats.featured}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('shared_rooms.featured')}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('shared_rooms.search_placeholder')}
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
                left: lang === 'ar' ? '12px' : 'auto',
                right: lang === 'en' ? '12px' : 'auto',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'special' | 'featured')}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
            }}
          >
            <option value="all">{t('filter.all_statuses')}</option>
            <option value="available">{t('filter.status_available')}</option>
            <option value="special">{t('filter.status_special')}</option>
            <option value="featured">{t('filter.status_featured')}</option>
          </select>
        </div>

        {/* District Filter */}
        <div>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
            }}
          >
            <option value="">{t('filter.all_districts')}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {lang === 'ar' ? (d.name_ar || d.name) : (d.name_en || d.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Content Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#a855f7' }}></i>
          <p>{t('apartments.loading')}</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', marginBottom: '12px' }}></i>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => refetch?.()} style={{ marginTop: '12px' }}>
            {t('btn.retry')}
          </button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <i className="fa-solid fa-house-circle-xmark" style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text-muted)' }}></i>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            {t('shared_rooms.empty_title')}
          </h3>
          <p style={{ maxWidth: '450px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            {searchQuery || districtFilter || statusFilter !== 'all'
              ? (lang === 'ar' ? 'جرب تغيير معايير البحث أو تصفية الحالة.' : 'Try changing your search or status filter criteria.')
              : t('shared_rooms.empty_desc')}
          </p>
          <button
            type="button"
            className="btn btn-glow"
            style={{ background: 'linear-gradient(135deg, #9333ea, #6366f1)' }}
            onClick={() => setIsAddOpen(true)}
          >
            <i className="fa-solid fa-plus-circle"></i>
            {t('btn.add_shared_room')}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredRooms.map((room) => (
            <ApartmentCard
              key={room.id}
              apartment={room}
              onEdit={(apt) => setEditingApartment(apt)}
              onDelete={handleDelete}
              onPin={(apt) => setPinningApartment(apt)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddApartmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={addApartment}
        districts={districts}
        universities={universities}
        defaultRentalType="room_shared"
      />

      <EditApartmentModal
        isOpen={!!editingApartment}
        apartment={editingApartment}
        onClose={() => setEditingApartment(null)}
        onSubmit={updateApartment}
        districts={districts}
        universities={universities}
      />

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
