import React, { useState, useRef, useEffect } from 'react';
import { Apartment } from '../../types/apartment';
import { District } from '../../types/district';
import { University } from '../../types/university';
import { useUpload } from '../../hooks/useUpload';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../components/Toast';
import { resolveImageUrl } from '../../config/api';

interface EditApartmentModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  districts: District[];
  universities: University[];
}

export function EditApartmentModal({
  apartment: apt,
  isOpen,
  onClose,
  onSubmit,
  districts,
  universities,
}: EditApartmentModalProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { uploadImages, isUploading } = useUpload();

  // Form State
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [price, setPrice] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [rentalType, setRentalType] = useState('apartment');
  const [roomsCount, setRoomsCount] = useState('');
  const [locationAr, setLocationAr] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [proximityAr, setProximityAr] = useState('');
  const [proximityEn, setProximityEn] = useState('');
  const [capacityAr, setCapacityAr] = useState('');
  const [capacityEn, setCapacityEn] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [featuresAr, setFeaturesAr] = useState('');
  const [featuresEn, setFeaturesEn] = useState('');
  const [moveInType, setMoveInType] = useState('immediate');
  const [calendarDate, setCalendarDate] = useState('');
  const [moveInDateAr, setMoveInDateAr] = useState('');
  const [moveInDateEn, setMoveInDateEn] = useState('');
  const [roommateReqs, setRoommateReqs] = useState('');
  const [roommateFacilities, setRoommateFacilities] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');

  // Universities selection
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);

  // Images state (existing + newly uploaded)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  // Double-submit protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCalendar = () => {
    try {
      dateInputRef.current?.showPicker?.();
    } catch {
      dateInputRef.current?.focus();
    }
  };

  const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const ENGLISH_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const parseDateStringToISO = (dateStr: string): string => {
    if (!dateStr || dateStr.includes('فوري') || dateStr.includes('Immediate')) return '';
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // Try finding Arabic months
    const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'اغسطس', 'سبتمبر', 'أكتوبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];
    const arMonthNums = [1, 2, 3, 4, 4, 5, 6, 7, 8, 8, 9, 10, 10, 11, 12];
    for (let i = 0; i < arMonths.length; i++) {
      if (trimmed.includes(arMonths[i])) {
        const nums = trimmed.match(/\d+/g);
        if (nums && nums.length >= 2) {
          const d = nums[0].length <= 2 ? nums[0] : nums[1];
          const y = nums[0].length === 4 ? nums[0] : (nums[1].length === 4 ? nums[1] : (nums[2] || '2026'));
          const m = String(arMonthNums[i]).padStart(2, '0');
          return `${y}-${m}-${String(d).padStart(2, '0')}`;
        }
      }
    }

    // Try finding English months
    const enMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const lower = trimmed.toLowerCase();
    for (let i = 0; i < enMonths.length; i++) {
      if (lower.includes(enMonths[i])) {
        const nums = lower.match(/\d+/g);
        if (nums && nums.length >= 2) {
          const d = nums[0].length <= 2 ? nums[0] : nums[1];
          const y = nums[0].length === 4 ? nums[0] : (nums[1].length === 4 ? nums[1] : (nums[2] || '2026'));
          const m = String(i + 1).padStart(2, '0');
          return `${y}-${m}-${String(d).padStart(2, '0')}`;
        }
      }
    }

    return '';
  };

  const handleCalendarChange = (val: string) => {
    setCalendarDate(val);
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        setMoveInDateAr(`${d} ${ARABIC_MONTHS[m]} ${y}`);
        setMoveInDateEn(`${d} ${ENGLISH_MONTHS[m]} ${y}`);
      } else {
        setMoveInDateAr(val);
        setMoveInDateEn(val);
      }
    }
  };

  // Pre-populate fields on apartment change
  useEffect(() => {
    if (!apt) return;

    setTitleAr(apt.title_ar || apt.title || '');
    setTitleEn(apt.title_en || '');
    setPrice(String(apt.price ?? ''));
    setDistrictId(apt.district_id ? String(apt.district_id) : '');
    setRentalType(apt.rental_type || 'apartment');
    setRoomsCount(apt.rooms_count ? String(apt.rooms_count) : '');
    setLocationAr(apt.location_ar || apt.location || '');
    setLocationEn(apt.location_en || '');
    setProximityAr(apt.proximity_ar || apt.proximity || '');
    setProximityEn(apt.proximity_en || '');
    setCapacityAr(apt.capacity_ar || apt.capacity || '');
    setCapacityEn(apt.capacity_en || '');
    setOwnerPhone(apt.owner_phone || '');
    setRoommateReqs(apt.roommate_reqs || '');
    setRoommateFacilities(apt.roommate_facilities || '');
    setDescAr(apt.description_ar || apt.description || '');
    setDescEn(apt.description_en || '');

    const featsAr = apt.features_ar && apt.features_ar.length > 0 ? apt.features_ar : apt.features;
    setFeaturesAr(featsAr.join(' ، '));
    setFeaturesEn(apt.features_en ? apt.features_en.join(', ') : '');

    const isImm = apt.move_in_type === 'فوري' || apt.move_in_type === 'Immediate' || apt.move_in_type_en === 'Immediate';
    setMoveInType(isImm ? 'immediate' : 'scheduled');
    const existingDate = !isImm ? (apt.move_in_date_ar || apt.move_in_date || apt.move_in_date_en || '') : '';
    setCalendarDate(parseDateStringToISO(existingDate));
    setMoveInDateAr(!isImm ? (apt.move_in_date_ar || apt.move_in_date || '') : '');
    setMoveInDateEn(!isImm ? (apt.move_in_date_en || '') : '');

    // Existing universities
    const existingUniList = (apt.universities || []).map(String);
    setSelectedUnis(existingUniList);

    // Existing images
    setExistingImages(apt.images || []);
    setNewImages([]);
  }, [apt]);

  if (!isOpen || !apt) return null;

  const handleUniToggle = (uniName: string) => {
    setSelectedUnis(prev =>
      prev.includes(uniName) ? prev.filter(u => u !== uniName) : [...prev, uniName]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileCount = e.target.files.length;
    showToast(t('msg.compressing_images', { count: fileCount }), 'info');

    const uploaded = await uploadImages(e.target.files, 'apartments');
    if (uploaded.length > 0) {
      setNewImages(prev => [...prev, ...uploaded]);
      showToast(t('msg.images_uploaded', { count: uploaded.length }), 'success');
    }
  };

  const handleRemoveExistingImage = (idxToRemove: number) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleRemoveNewImage = (idxToRemove: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!titleAr.trim() || !price.trim()) {
      showToast(t('msg.validation_required'), 'error');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const featArrAr = featuresAr.split(/[،,]/).map(f => f.trim()).filter(Boolean);
      const featArrEn = featuresEn.split(/[,،]/).map(f => f.trim()).filter(Boolean);

      // Final images: if user uploaded new images, combine or replace based on state
      const finalImages = [...existingImages, ...newImages];

      const isImmediate = moveInType === 'immediate';

      const payload: Record<string, unknown> = {
        id: apt.id,
        title: titleAr,
        title_ar: titleAr,
        title_en: titleEn,
        price,
        location: locationAr,
        location_ar: locationAr,
        location_en: locationEn,
        proximity: proximityAr,
        proximity_ar: proximityAr,
        proximity_en: proximityEn,
        universities: selectedUnis,
        capacity: capacityAr || t('apartments.default_rooms_desc'),
        capacity_ar: capacityAr || t('apartments.default_rooms_desc'),
        capacity_en: capacityEn || '',
        rental_type: rentalType,
        rooms_count: roomsCount ? parseInt(roomsCount, 10) : null,
        district_id: districtId ? parseInt(districtId, 10) : null,
        move_in_type: isImmediate ? 'فوري' : 'ميعاد',
        move_in_type_ar: isImmediate ? 'فوري' : 'ميعاد',
        move_in_type_en: isImmediate ? 'Immediate' : 'Scheduled',
        move_in_date: isImmediate ? 'انتقال فوري' : moveInDateAr,
        move_in_date_ar: isImmediate ? 'انتقال فوري' : moveInDateAr,
        move_in_date_en: isImmediate ? 'Immediate Move-in' : moveInDateEn,
        owner_phone: ownerPhone || null,
        roommate_reqs: rentalType === 'room_shared' ? roommateReqs : null,
        roommate_facilities: rentalType === 'room_shared' ? roommateFacilities : null,
        features: featArrAr,
        features_ar: featArrAr,
        features_en: featArrEn,
        images: finalImages,
        description: descAr,
        description_ar: descAr,
        description_en: descEn,
        is_available: apt.is_available,
        is_featured: apt.is_featured ? 1 : 0,
        featured_until: apt.featured_until || null,
      };

      const result = await onSubmit(payload);
      if (result.success) {
        showToast(t('msg.apartment_updated'), 'success');
        onClose();
      } else {
        showToast(result.error || t('msg.error_update_apartment'), 'error');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 10000 }}>
      <div className="modal-box" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <h3>
            <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('btn.edit')} #{apt.id} - {titleAr || titleEn}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row: Titles AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.title_ar')}</label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('form.title_en')}</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
              />
            </div>
          </div>

          {/* Row: Price, District, Rental Type */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>{t('form.price')}</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('form.district')}</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                }}
              >
                <option value="">{t('apartments.select_district')}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_ar || d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('form.rental_type')}</label>
              <select
                value={rentalType}
                onChange={(e) => setRentalType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                }}
              >
                <option value="apartment">{t('rental_type.apartment')}</option>
                <option value="room_shared">{t('rental_type.room_shared')}</option>
                <option value="studio">{t('rental_type.studio')}</option>
              </select>
            </div>
          </div>

          {/* Row: Bedrooms & Owner Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.rooms_count')}</label>
              <input
                type="number"
                min="1"
                max="20"
                value={roomsCount}
                onChange={(e) => setRoomsCount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('form.owner_phone')}</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+995 555 123 456"
              />
            </div>
          </div>

          {/* Roommate Section (Conditional) */}
          {rentalType === 'room_shared' && (
            <div
              style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px dashed #fbbf24',
                padding: '1.2rem',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <h4 style={{ color: '#fbbf24', fontSize: '1rem', margin: 0 }}>
                <i className="fa-solid fa-users"></i> إعدادات واشتراطات شريك السكن
              </h4>
              <div className="form-group">
                <label>{t('form.roommate_reqs')}</label>
                <input
                  type="text"
                  value={roommateReqs}
                  onChange={(e) => setRoommateReqs(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{t('form.roommate_facilities')}</label>
                <input
                  type="text"
                  value={roommateFacilities}
                  onChange={(e) => setRoommateFacilities(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Row: Location AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.location_ar')}</label>
              <input
                type="text"
                value={locationAr}
                onChange={(e) => setLocationAr(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('form.location_en')}</label>
              <input
                type="text"
                value={locationEn}
                onChange={(e) => setLocationEn(e.target.value)}
              />
            </div>
          </div>

          {/* Row: Proximity AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.proximity_ar')}</label>
              <input
                type="text"
                value={proximityAr}
                onChange={(e) => setProximityAr(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('form.proximity_en')}</label>
              <input
                type="text"
                value={proximityEn}
                onChange={(e) => setProximityEn(e.target.value)}
              />
            </div>
          </div>

          {/* Row: Capacity AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.capacity_ar')}</label>
              <input
                type="text"
                value={capacityAr}
                onChange={(e) => setCapacityAr(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('form.capacity_en')}</label>
              <input
                type="text"
                value={capacityEn}
                onChange={(e) => setCapacityEn(e.target.value)}
              />
            </div>
          </div>

          {/* Move-in Type and Date */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.move_in_type')}</label>
              <select
                value={moveInType}
                onChange={(e) => setMoveInType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                }}
              >
                <option value="immediate">{t('move_in.immediate')}</option>
                <option value="scheduled">{t('move_in.scheduled')}</option>
              </select>
            </div>
          </div>

          {moveInType === 'scheduled' && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '16px',
                borderRadius: '14px',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 'bold', margin: 0, fontSize: '0.92rem' }}>
                    <i className="fa-solid fa-calendar-days" style={{ fontSize: '1.1rem' }}></i>
                    {t('form.move_in_date_picker')}
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenCalendar}
                    style={{
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px var(--primary-glow)',
                    }}
                  >
                    <i className="fa-solid fa-arrow-pointer"></i>
                    {t('form.click_to_pick_date')}
                  </button>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={calendarDate}
                  onChange={(e) => handleCalendarChange(e.target.value)}
                  onClick={handleOpenCalendar}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--primary)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div className="form-row" style={{ margin: 0 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>{t('form.move_in_date_ar')}</label>
                  <input
                    type="text"
                    value={moveInDateAr}
                    onChange={(e) => setMoveInDateAr(e.target.value)}
                    placeholder="مثال: 1 سبتمبر 2026"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>{t('form.move_in_date_en')}</label>
                  <input
                    type="text"
                    value={moveInDateEn}
                    onChange={(e) => setMoveInDateEn(e.target.value)}
                    placeholder="e.g. 1 September 2026"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.features_ar')}</label>
              <input
                type="text"
                value={featuresAr}
                onChange={(e) => setFeaturesAr(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('form.features_en')}</label>
              <input
                type="text"
                value={featuresEn}
                onChange={(e) => setFeaturesEn(e.target.value)}
              />
            </div>
          </div>

          {/* Universities Checkboxes */}
          <div className="form-group">
            <label>{t('form.nearby_unis')}</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
                background: 'rgba(0,0,0,0.2)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              {universities.map((uni) => {
                const isChecked = selectedUnis.includes(uni.name) || selectedUnis.includes(uni.name_ar) || selectedUnis.includes(String(uni.id));
                return (
                  <label key={uni.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleUniToggle(uni.name_ar || uni.name)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>{uni.name_ar || uni.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Images Section: Current Images & Upload New */}
          <div className="form-group">
            <label>{t('apartments.current_images')}</label>
            {existingImages.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {existingImages.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '65px', height: '65px' }}>
                    <img
                      src={resolveImageUrl(url)}
                      alt="current"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid var(--accent-amber)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="حذف الصورة"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                {t('apartments.no_current_images')}
              </span>
            )}

            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {t('apartments.replace_images_notice')}
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '12px',
                border: '1px dashed var(--border-color)',
                background: 'rgba(0,0,0,0.15)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            />
            {newImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {newImages.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '65px', height: '65px' }}>
                    <img
                      src={resolveImageUrl(url)}
                      alt="new upload"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid #25D366',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.desc_ar')}</label>
              <textarea
                rows={3}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('form.desc_en')}</label>
              <textarea
                rows={3}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn btn-glow"
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> {t('form.saving')}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> {t('form.save_changes')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
