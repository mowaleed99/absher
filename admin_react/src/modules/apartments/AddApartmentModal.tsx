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

  // Double-submit protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

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
      // Build proximity list
      const proxList: string[] = [];
      selectedUnis.forEach(uniName => {
        const uniObj = universities.find(u => u.name === uniName || u.name_ar === uniName);
        if (uniObj) {
          const time = uniTimes[String(uniObj.id)];
          if (time) {
            proxList.push(`${uniName} (${time} ${t('form.uni_walk_time')})`);
          } else {
            proxList.push(uniName);
          }
        }
      });

      const finalProximityAr = proxList.length > 0
        ? `${proximityAr} | ${proxList.join(' ، ')}`.replace(/^ \| /, '')
        : proximityAr;

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
        images,
        description: `${descAr} (${bathrooms})`.trim(),
        description_ar: descAr,
        description_en: descEn,
      };

      const result = await onSubmit(payload);
      if (result.success) {
        showToast(t('msg.apartment_added'), 'success');
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
            {moveInType === 'scheduled' && (
              <div className="form-row">
                <div className="form-group">
                  <label>{t('form.move_in_date_ar')}</label>
                  <input
                    type="text"
                    value={moveInDateAr}
                    onChange={(e) => setMoveInDateAr(e.target.value)}
                    placeholder="مثال: 1 سبتمبر 2026"
                  />
                </div>
                <div className="form-group">
                  <label>{t('form.move_in_date_en')}</label>
                  <input
                    type="text"
                    value={moveInDateEn}
                    onChange={(e) => setMoveInDateEn(e.target.value)}
                    placeholder="e.g. 1 September 2026"
                  />
                </div>
              </div>
            )}
          </div>

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
