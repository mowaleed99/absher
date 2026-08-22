import React, { useState, useRef } from 'react';
import { District } from '../../types/district';
import { University } from '../../types/university';
import { useUpload } from '../../hooks/useUpload';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../components/Toast';
import { resolveImageUrl } from '../../config/api';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  districts: District[];
  universities: University[];
}

export function AddApartmentModal({
  isOpen,
  onClose,
  onSubmit,
  districts,
  universities,
}: AddApartmentModalProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { uploadImages, isUploading } = useUpload();

  // Form State
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [price, setPrice] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [rentalType, setRentalType] = useState('apartment');
  const [roomsCount, setRoomsCount] = useState('2');
  const [bathrooms, setBathrooms] = useState('1 حمام');
  const [locationAr, setLocationAr] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [proximityAr, setProximityAr] = useState('');
  const [proximityEn, setProximityEn] = useState('');
  const [capacityAr, setCapacityAr] = useState('3 أفراد');
  const [capacityEn, setCapacityEn] = useState('3 People');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [featuresAr, setFeaturesAr] = useState('تكييف ، تدفئة مركزية ، غسالة');
  const [featuresEn, setFeaturesEn] = useState('AC, Central Heating, Washing Machine');
  const [moveInType, setMoveInType] = useState('immediate');
  const [calendarDate, setCalendarDate] = useState('');
  const [moveInDateAr, setMoveInDateAr] = useState('');
  const [moveInDateEn, setMoveInDateEn] = useState('');
  const [roommateReqs, setRoommateReqs] = useState('');
  const [roommateFacilities, setRoommateFacilities] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');

  // Universities & Proximity map
  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);
  const [uniTimes, setUniTimes] = useState<Record<string, string>>({});

  // Uploaded Image URLs
  const [images, setImages] = useState<string[]>([]);
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

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

  const resetForm = () => {
    setTitleAr('');
    setTitleEn('');
    setPrice('');
    setDistrictId('');
    setRentalType('apartment');
    setRoomsCount('');
    setBathrooms('1 حمام');
    setLocationAr('');
    setLocationEn('');
    setOwnerPhone('');
    setMoveInType('immediate');
    setCalendarDate('');
    setMoveInDateAr('انتقال فوري');
    setMoveInDateEn('Immediate Move-in');
    setCapacityAr('');
    setCapacityEn('');
    setProximityAr('');
    setProximityEn('');
    setFeaturesAr('تكييف، تدفئة مركزية، غسالة، مصعد، أمن وحراسة');
    setFeaturesEn('Air Conditioning, Central Heating, Washing Machine, Elevator, Security');
    setRoommateReqs('غير مدخن، طالب، ملتزم بالهدوء');
    setRoommateFacilities('غرفة نوم خاصة، صالة مشتركة، حمام ومطبخ مجهزان بالكامل');
    setDescAr('');
    setDescEn('');
    setSelectedUnis([]);
    setUniTimes({});
    setImages([]);
    setIsSpecialOffer(false);
    setIsFeatured(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleUniToggle = (uniName: string) => {
    setSelectedUnis(prev =>
      prev.includes(uniName) ? prev.filter(u => u !== uniName) : [...prev, uniName]
    );
  };

  const handleUniTimeChange = (uniId: number, time: string) => {
    setUniTimes(prev => ({ ...prev, [String(uniId)]: time }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileCount = e.target.files.length;
    showToast(t('msg.compressing_images', { count: fileCount }), 'info');

    const newUrls = await uploadImages(e.target.files, 'apartments');
    if (newUrls.length > 0) {
      setImages(prev => [...prev, ...newUrls]);
      showToast(t('msg.images_uploaded', { count: newUrls.length }), 'success');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!titleAr.trim() || !price.trim() || !districtId) {
      showToast(t('msg.validation_required'), 'error');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Build bilingual proximity lists
      const proxListAr: string[] = [];
      const proxListEn: string[] = [];
      const allSelectedUniIds: (string | number)[] = [];

      selectedUnis.forEach(uniName => {
        const uniObj = universities.find(u => u.name === uniName || u.name_ar === uniName || u.name_en === uniName || String(u.id) === uniName);
        if (uniObj) {
          allSelectedUniIds.push(uniObj.id);
          const time = uniTimes[String(uniObj.id)];
          const uNameAr = uniObj.name_ar || uniObj.name;
          const uNameEn = uniObj.name_en || uniObj.name;
          if (time) {
            proxListAr.push(`${uNameAr} (${time} ${t('form.uni_walk_time')})`);
            proxListEn.push(`${uNameEn} (${time} min walk)`);
          } else {
            proxListAr.push(uNameAr);
            proxListEn.push(uNameEn);
          }
        }
      });

      const finalProximityAr = proxListAr.length > 0
        ? `${proximityAr} | ${proxListAr.join(' ، ')}`.replace(/^ \| /, '')
        : proximityAr;

      const finalProximityEn = proxListEn.length > 0
        ? (proximityEn ? `${proximityEn} | ${proxListEn.join(' , ')}` : proxListEn.join(' , '))
        : proximityEn;

      const featArrAr = featuresAr.split(/[،,]/).map(f => f.trim()).filter(Boolean);
      const featArrEn = featuresEn.split(/[,،]/).map(f => f.trim()).filter(Boolean);
      if (!featArrAr.includes(bathrooms)) featArrAr.unshift(bathrooms);
      if (rentalType === 'room_shared' && !featArrAr.includes('استئجار مع شريك')) featArrAr.push('استئجار مع شريك');
      if (rentalType === 'apartment' && !featArrAr.includes('شقة بمفردك')) featArrAr.push('شقة بمفردك');

      const isImmediate = moveInType === 'immediate';

      const payload: Record<string, unknown> = {
        title: titleAr,
        title_ar: titleAr,
        title_en: titleEn,
        price,
        location: locationAr,
        location_ar: locationAr,
        location_en: locationEn,
        proximity: finalProximityAr,
        proximity_ar: finalProximityAr,
        proximity_en: finalProximityEn,
        universities: Array.from(new Set([...allSelectedUniIds.map(String), ...selectedUnis])),
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
        images,
        description: descAr,
        description_ar: descAr,
        description_en: descEn,
        is_special_offer: isSpecialOffer ? 1 : 0,
        is_featured: isFeatured ? 1 : 0,
      };

      const result = await onSubmit(payload);
      if (result.success) {
        showToast(t('msg.apartment_added'), 'success');
        resetForm();
        onClose();
      } else {
        showToast(result.error || t('msg.error_add_apartment'), 'error');
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
            <i className="fa-solid fa-plus-circle" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('apartments.add_button')}
          </h3>
          <button type="button" className="close-btn" onClick={handleClose}>
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
                placeholder="مثال: شقة مودرن بإطلالة مفتوحة"
                required
              />
            </div>
            <div className="form-group">
              <label>{t('form.title_en')}</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Modern Apartment with Open View"
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
                placeholder="مثال: 450"
                required
              />
            </div>
            <div className="form-group">
              <label>{t('form.district')}</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                required
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

          {/* Row: Bedrooms & Bathrooms */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.rooms_count')}</label>
              <input
                type="number"
                min="1"
                max="20"
                value={roomsCount}
                onChange={(e) => setRoomsCount(e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="form-group">
              <label>{t('form.bathrooms')}</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
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
                <option value="1 حمام">{t('bathrooms.1')}</option>
                <option value="2 حمام">{t('bathrooms.2')}</option>
                <option value="3+ حمامات">{t('bathrooms.3plus')}</option>
              </select>
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
                  placeholder="مثال: طالب غير مدخن، هادئ وملتزم"
                />
              </div>
              <div className="form-group">
                <label>{t('form.roommate_facilities')}</label>
                <input
                  type="text"
                  value={roommateFacilities}
                  onChange={(e) => setRoommateFacilities(e.target.value)}
                  placeholder="مثال: غرفة مستقلة، حمام خاص"
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
                placeholder="مثال: شارع بيكيني، سابورتالو"
              />
            </div>
            <div className="form-group">
              <label>{t('form.location_en')}</label>
              <input
                type="text"
                value={locationEn}
                onChange={(e) => setLocationEn(e.target.value)}
                placeholder="e.g. Pekini Ave, Saburtalo"
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
                placeholder="مثال: يبعد 5 دقائق عن محطة المترو"
              />
            </div>
            <div className="form-group">
              <label>{t('form.proximity_en')}</label>
              <input
                type="text"
                value={proximityEn}
                onChange={(e) => setProximityEn(e.target.value)}
                placeholder="e.g. 5 minutes from metro station"
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
                placeholder="مثال: 3 أفراد"
              />
            </div>
            <div className="form-group">
              <label>{t('form.capacity_en')}</label>
              <input
                type="text"
                value={capacityEn}
                onChange={(e) => setCapacityEn(e.target.value)}
                placeholder="e.g. 3 People"
              />
            </div>
          </div>

          {/* Row: Owner Phone */}
          <div className="form-group">
            <label>{t('form.owner_phone')}</label>
            <input
              type="text"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+995 555 123 456"
            />
          </div>

          {/* Move-in Type and Scheduled Date */}
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
                placeholder="تكييف ، تدفئة ، مصعد ، بلكونة"
              />
            </div>
            <div className="form-group">
              <label>{t('form.features_en')}</label>
              <input
                type="text"
                value={featuresEn}
                onChange={(e) => setFeaturesEn(e.target.value)}
                placeholder="AC, Heating, Elevator, Balcony"
              />
            </div>
          </div>

          {/* Nearby Universities Checkboxes */}
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
                const isChecked = selectedUnis.includes(uni.name) || selectedUnis.includes(uni.name_ar);
                return (
                  <div key={uni.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleUniToggle(uni.name_ar || uni.name)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>{uni.name_ar || uni.name}</span>
                    </label>
                    {isChecked && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '24px' }}>
                        <input
                          type="number"
                          placeholder="5"
                          value={uniTimes[String(uni.id)] || ''}
                          onChange={(e) => handleUniTimeChange(uni.id, e.target.value)}
                          style={{ width: '60px', padding: '4px 8px', fontSize: '0.85rem' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {t('form.uni_walk_time')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="form-group">
            <label>{t('apartments.upload_images_btn')}</label>
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
            {isUploading && (
              <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '4px' }}>
                <i className="fa-solid fa-spinner fa-spin"></i> جارِ رفع وضغط الصور...
              </p>
            )}
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {images.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '65px', height: '65px' }}>
                    <img
                      src={resolveImageUrl(url)}
                      alt="preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid var(--accent-amber)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
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
                placeholder="شقة ممتازة قريبة من الخدمات..."
              />
            </div>
            <div className="form-group">
              <label>{t('form.desc_en')}</label>
              <textarea
                rows={3}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Excellent apartment close to services..."
              />
            </div>
          </div>

          {/* Badges Toggles: Special Offer & Featured */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={isSpecialOffer}
                onChange={(e) => setIsSpecialOffer(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
              />
              <span style={{ fontWeight: 700, color: isSpecialOffer ? '#f87171' : 'var(--text-main)', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-fire" style={{ color: '#ef4444', marginLeft: '4px' }}></i>
                {t('apt.is_special_offer_field')}
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
              />
              <span style={{ fontWeight: 700, color: isFeatured ? '#fbbf24' : 'var(--text-main)', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-star" style={{ color: '#f59e0b', marginLeft: '4px' }}></i>
                {t('apt.is_featured_field')}
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
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
                  <i className="fa-solid fa-check"></i> {t('form.add_apartment_btn')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
