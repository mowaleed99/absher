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
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const { uploadImages, isUploading } = useUpload();
  const isRtl = lang === 'ar';

  // Form State
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [price, setPrice] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [rentalType, setRentalType] = useState('apartment');
  const [roomsCount, setRoomsCount] = useState('');
  const [bathrooms, setBathrooms] = useState('1 حمام');
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
  const [uniTimes, setUniTimes] = useState<Record<string, string>>({});

  // Images state (existing + newly uploaded)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  // Double-submit protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isSharedRoom = rentalType === 'room_shared' || apt?.rental_type === 'room_shared';

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
          const mm = String(arMonthNums[i]).padStart(2, '0');
          const dd = String(d).padStart(2, '0');
          return `${y}-${mm}-${dd}`;
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

  // Populate form when apartment prop changes
  useEffect(() => {
    if (apt) {
      setTitleAr(apt.title_ar || apt.title || '');
      setTitleEn(apt.title_en || apt.title || '');
      setPrice(apt.price !== undefined && apt.price !== null ? String(apt.price) : '');
      setDistrictId(apt.district_id ? String(apt.district_id) : '');
      setRentalType(apt.rental_type || 'apartment');
      setRoomsCount(apt.rooms_count ? String(apt.rooms_count) : '');
      setLocationAr(apt.location_ar || apt.location || '');
      setLocationEn(apt.location_en || apt.location || '');
      setProximityAr(apt.proximity_ar || apt.proximity || '');
      setProximityEn(apt.proximity_en || apt.proximity || '');
      setCapacityAr(apt.capacity_ar || apt.capacity || '');
      setCapacityEn(apt.capacity_en || apt.capacity || '');
      setOwnerPhone(apt.owner_phone || '');

      // Parse features
      const fAr = Array.isArray(apt.features_ar) ? apt.features_ar : (Array.isArray(apt.features) ? apt.features : []);
      const fEn = Array.isArray(apt.features_en) ? apt.features_en : [];
      setFeaturesAr(fAr.join(' ، '));
      setFeaturesEn(fEn.join(' , '));

      // Extract bathroom info
      const foundBath = fAr.find(f => f.includes('حمام') || f.includes('Bath'));
      if (foundBath) {
        setBathrooms(foundBath.includes('3') ? '3+ حمامات' : (foundBath.includes('2') ? '2 حمام' : '1 حمام'));
      } else {
        setBathrooms('1 حمام');
      }

      // Move-in
      const isImmed = !apt.move_in_type || apt.move_in_type === 'فوري' || apt.move_in_type === 'immediate';
      setMoveInType(isImmed ? 'immediate' : 'scheduled');
      const dAr = apt.move_in_date_ar || apt.move_in_date || 'انتقال فوري';
      const dEn = apt.move_in_date_en || 'Immediate Move-in';
      setMoveInDateAr(dAr);
      setMoveInDateEn(dEn);
      setCalendarDate(parseDateStringToISO(dAr));

      setRoommateReqs(apt.roommate_reqs || '');
      setRoommateFacilities(apt.roommate_facilities || '');
      setDescAr(apt.description_ar || apt.description || '');
      setDescEn(apt.description_en || apt.description || '');

      // Universities
      const unis = Array.isArray(apt.universities) ? apt.universities : [];
      setSelectedUnis(unis.map(String));

      // Images
      const imgs = Array.isArray(apt.images) ? apt.images : [];
      setExistingImages(imgs);
      setNewImages([]);
    }
  }, [apt]);

  if (!isOpen || !apt) return null;

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
      setNewImages(prev => [...prev, ...newUrls]);
      showToast(t('msg.images_uploaded', { count: newUrls.length }), 'success');
    }
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
      if (isSharedRoom && !featArrAr.includes('استئجار مع شريك')) featArrAr.push('استئجار مع شريك');
      if (!isSharedRoom && rentalType === 'apartment' && !featArrAr.includes('شقة بمفردك')) featArrAr.push('شقة بمفردك');

      const isImmediate = moveInType === 'immediate';
      const finalImages = [...existingImages, ...newImages];

      const payload: Record<string, unknown> = {
        id: apt.id,
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
        capacity: capacityAr || (isSharedRoom ? 'طالبين' : '3 أفراد'),
        capacity_ar: capacityAr || (isSharedRoom ? 'طالبين' : '3 أفراد'),
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
        roommate_reqs: isSharedRoom ? roommateReqs : null,
        roommate_facilities: isSharedRoom ? roommateFacilities : null,
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
        is_special_offer: apt.is_special_offer ? 1 : 0,
      };

      const result = await onSubmit(payload);
      if (result.success) {
        showToast(
          isSharedRoom
            ? (isRtl ? 'تم تعديل بيانات الغرفة المشتركة بنجاح' : 'Shared room updated successfully')
            : t('msg.apartment_updated'),
          'success'
        );
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
            <i
              className={`fa-solid ${isSharedRoom ? 'fa-people-roof' : 'fa-pen-to-square'}`}
              style={{ color: isSharedRoom ? '#a855f7' : 'var(--primary)', marginLeft: '8px' }}
            ></i>
            {isSharedRoom
              ? `${isRtl ? 'تعديل بيانات الغرفة المشتركة' : 'Edit Shared Room'} #${apt.id} - ${titleAr || titleEn}`
              : `${t('btn.edit')} #${apt.id} - ${titleAr || titleEn}`}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row: Titles AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'عنوان الغرفة / السكن المشترك (عربي):' : 'Shared Room Title (Arabic):')
                  : t('form.title_ar')}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={
                  isSharedRoom
                    ? 'مثال: سرير في غرفة ماستر لشابين بسابورتالو'
                    : 'مثال: شقة مودرن بإطلالة مفتوحة'
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'عنوان الغرفة (إنجليزي):' : 'Shared Room Title (English):')
                  : t('form.title_en')}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder={
                  isSharedRoom
                    ? 'e.g. Master bedroom for 2 students'
                    : 'e.g. Modern Apartment with Open View'
                }
              />
            </div>
          </div>

          {/* Row: Price, District, Rental Type */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'الإيجار الشهري للسرير/الغرفة (دولار):' : 'Monthly Rent per Bed ($):')
                  : t('form.price')}
              </label>
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
              <label>{isRtl ? 'نوع السكن' : 'Category'}</label>
              {isSharedRoom ? (
                <div
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#c084fc',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    height: '46px',
                  }}
                >
                  <i className="fa-solid fa-people-roof"></i>
                  <span>{isRtl ? 'سكن مشترك وغرف للطلاب' : 'Shared Room / Co-Living'}</span>
                </div>
              ) : (
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
                  <option value="studio">{t('rental_type.studio')}</option>
                </select>
              )}
            </div>
          </div>

          {/* Row: Bedrooms & Bathrooms */}
          <div className="form-row">
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'إجمالي غرف الشقة المشتركة:' : 'Total Rooms in Flat:')
                  : t('form.rooms_count')}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={roomsCount}
                onChange={(e) => setRoomsCount(e.target.value)}
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
          {isSharedRoom && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(251, 191, 36, 0.06))',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                padding: '1.2rem',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <h4 style={{ color: '#c084fc', fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>
                    {isRtl ? 'اشتراطات ومواصفات السكن المشترك' : 'Roommate Requirements & Shared Facilities'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {isRtl
                      ? 'تظهر هذه التفاصيل بدقة للطلاب عند تصفح الغرف في تطبيق الهاتف'
                      : 'Displayed directly in the mobile app for student roommate matching'}
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  {isRtl ? 'شروط ومواصفات شريك السكن المطلوب:' : 'Roommate Requirements:'}
                </label>
                <input
                  type="text"
                  value={roommateReqs}
                  onChange={(e) => setRoommateReqs(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'مثال: طالب غير مدخن، هادئ وملتزم، دراسة طبية أو هندسة'
                      : 'e.g. Non-smoker, quiet, medical or engineering student'
                  }
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  {isRtl ? 'المساحة والمرافق المتاحة لشريك السكن:' : 'Available Space & Shared Amenities:'}
                </label>
                <input
                  type="text"
                  value={roommateFacilities}
                  onChange={(e) => setRoommateFacilities(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'مثال: سرير ومكتب مستقل، دولاب ملابس، مطبخ وصالة مشتركة، إنترنت فائق السرعة'
                      : 'e.g. Independent bed & desk, wardrobe, equipped kitchen, shared lounge, fast Wi-Fi'
                  }
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
              <label>
                {isSharedRoom
                  ? (isRtl ? 'السعة الاستيعابية للغرفة (عربي):' : 'Room Capacity (Arabic):')
                  : t('form.capacity_ar')}
              </label>
              <input
                type="text"
                value={capacityAr}
                onChange={(e) => setCapacityAr(e.target.value)}
                placeholder={isSharedRoom ? 'مثال: طالبين (سريرين)' : 'مثال: 3 أفراد'}
              />
            </div>
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'السعة الاستيعابية (إنجليزي):' : 'Room Capacity (English):')
                  : t('form.capacity_en')}
              </label>
              <input
                type="text"
                value={capacityEn}
                onChange={(e) => setCapacityEn(e.target.value)}
                placeholder={isSharedRoom ? 'e.g. 2 Students (2 Beds)' : 'e.g. 3 People'}
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
                    }}
                  >
                    <i className="fa-solid fa-calendar"></i>
                    {t('btn.choose_date')}
                  </button>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={calendarDate}
                  onChange={(e) => handleCalendarChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div className="form-row" style={{ margin: 0 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem' }}>{t('form.move_in_date_ar')}</label>
                  <input
                    type="text"
                    value={moveInDateAr}
                    onChange={(e) => setMoveInDateAr(e.target.value)}
                    placeholder="مثال: 1 سبتمبر 2026"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem' }}>{t('form.move_in_date_en')}</label>
                  <input
                    type="text"
                    value={moveInDateEn}
                    onChange={(e) => setMoveInDateEn(e.target.value)}
                    placeholder="e.g. September 1, 2026"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Universities Multi-Select & Proximity Times */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '8px' }}>
              <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--primary)' }}></i>
              {t('form.universities_nearby')}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '10px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.2)',
                marginBottom: '12px',
              }}
            >
              {universities.map((uni) => {
                const uName = isRtl ? (uni.name_ar || uni.name) : (uni.name_en || uni.name || uni.name_ar);
                const isSelected = selectedUnis.includes(uni.name) || selectedUnis.includes(uni.name_ar || '') || selectedUnis.includes(uni.name_en || '') || selectedUnis.includes(String(uni.id));
                return (
                  <label
                    key={uni.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleUniToggle(uni.name_ar || uni.name)}
                      style={{ width: '17px', height: '17px', flexShrink: 0, cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ flex: 1, color: isSelected ? '#fff' : 'var(--text-main)', fontWeight: isSelected ? 700 : 500, lineHeight: 1.35, textAlign: isRtl ? 'right' : 'left' }}>
                      {uName}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Time inputs for selected universities */}
            {selectedUnis.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <span style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600 }}>
                  <i className="fa-solid fa-person-walking" style={{ marginInlineEnd: '6px' }}></i>
                  {t('form.uni_time_instruction')}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', marginTop: '4px' }}>
                  {selectedUnis.map((uName) => {
                    const uniObj = universities.find(u => u.name === uName || u.name_ar === uName || u.name_en === uName || String(u.id) === uName);
                    if (!uniObj) return null;
                    const displayName = isRtl ? (uniObj.name_ar || uniObj.name) : (uniObj.name_en || uniObj.name || uniObj.name_ar);
                    return (
                      <div key={uniObj.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.83rem', flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          placeholder="5"
                          value={uniTimes[String(uniObj.id)] || ''}
                          onChange={(e) => handleUniTimeChange(uniObj.id, e.target.value)}
                          style={{ width: '65px', padding: '4px 8px', borderRadius: '6px', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {t('form.uni_walk_time')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Features / Amenities AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>{t('form.features_ar')}</label>
              <input
                type="text"
                value={featuresAr}
                onChange={(e) => setFeaturesAr(e.target.value)}
                placeholder="إنترنت فائق السرعة، مكتب دراسي، تدفئة مركزية..."
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group">
              <label>{t('form.features_en')}</label>
              <input
                type="text"
                value={featuresEn}
                onChange={(e) => setFeaturesEn(e.target.value)}
                placeholder="High-Speed Wi-Fi, Study Desk, Central Heating, AC..."
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Images Section (Existing + New Uploads) */}
          <div className="form-group">
            <label>{t('form.apartment_images')}</label>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                style={{ display: 'none' }}
                id="editAptImageUpload"
              />
              <label
                htmlFor="editAptImageUpload"
                style={{
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-card)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {isUploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> {t('msg.uploading')}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: 'var(--primary)' }}></i>
                    {t('form.choose_images')}
                  </>
                )}
              </label>

              {/* Existing & New Images Preview */}
              {(existingImages.length > 0 || newImages.length > 0) && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginTop: '16px',
                    justifyContent: 'center',
                  }}
                >
                  {existingImages.map((imgUrl, idx) => (
                    <div
                      key={`existing-${idx}`}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <img
                        src={resolveImageUrl(imgUrl)}
                        alt={`Existing ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(239, 68, 68, 0.85)',
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

                  {newImages.map((imgUrl, idx) => (
                    <div
                      key={`new-${idx}`}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid var(--primary)',
                      }}
                    >
                      <img
                        src={resolveImageUrl(imgUrl)}
                        alt={`New ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(239, 68, 68, 0.85)',
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
          </div>

          {/* Description AR & EN */}
          <div className="form-row">
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'وصف وتفاصيل الغرفة المشتركة (عربي):' : 'Shared Room Details (Arabic):')
                  : t('form.desc_ar')}
              </label>
              <textarea
                rows={3}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="تفاصيل العرض..."
              />
            </div>
            <div className="form-group">
              <label>
                {isSharedRoom
                  ? (isRtl ? 'وصف الغرفة (إنجليزي):' : 'Shared Room Details (English):')
                  : t('form.desc_en')}
              </label>
              <textarea
                rows={3}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Details..."
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
              style={{
                background: isSharedRoom ? 'linear-gradient(135deg, #9333ea, #6366f1)' : undefined,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> {t('form.saving')}
                </>
              ) : (
                <>
                  <i className={`fa-solid ${isSharedRoom ? 'fa-people-roof' : 'fa-check'}`}></i>{' '}
                  {isSharedRoom
                    ? (isRtl ? 'حفظ تعديلات الغرفة المشتركة' : 'Save Shared Room Changes')
                    : (isRtl ? 'حفظ تعديلات الشقة' : 'Save Apartment Changes')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
