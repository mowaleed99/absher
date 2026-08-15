import { appData } from '../state.js';
import { showToast, resolveImgUrl } from '../ui.js';
import { loadDashboardData } from '../api.js';

export function renderApartments() {
    const container = document.getElementById('apartmentsList');
    if (!container) return;

    const searchVal = (document.getElementById('aptSearchInput')?.value || '').trim().toLowerCase();

    const filtered = appData.apartments.filter(apt => {
        if (!searchVal) return true;
        const idMatch = apt.id?.toString() === searchVal || `#${apt.id}` === searchVal || `no. ${apt.id}` === searchVal || `no ${apt.id}` === searchVal;
        const titleMatch = (apt.title || '').toLowerCase().includes(searchVal);
        const descMatch = (apt.description || '').toLowerCase().includes(searchVal);
        return idMatch || titleMatch || descMatch;
    });

    const rtLabels = { apartment: window.t('apartments.type.apartment'), room_shared: window.t('apartments.type.room_shared'), studio: window.t('apartments.type.studio') };
    const rtColors = { apartment: '#fbbf24', room_shared: '#38bdf8', studio: '#a78bfa' };
    const rtRgb   = { apartment: '251,191,36', room_shared: '56,189,248', studio: '167,139,250' };

    container.innerHTML = filtered.map(apt => {
        const rtLabel = rtLabels[apt.rental_type] || apt.rental_type || '';
        const rtColor = rtColors[apt.rental_type] || '#fbbf24';
        const rtRgbVal = rtRgb[apt.rental_type] || '251,191,36';
        const firstImg = Array.isArray(apt.images) ? apt.images[0] : apt.images;
        return `
        <div class="item-card">
            <div class="card-img-wrap" style="background: #1f2937;">
                <img src="${resolveImgUrl(firstImg)}"
                     onerror="this.style.display='none'"
                     alt="Apartment"
                     style="width: 100%; height: 100%; object-fit: cover;">
                <span class="price-tag">${apt.price}</span>
            </div>
            <div class="card-body">
                <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    <span style="background: rgba(37, 211, 102, 0.18); color: #25D366; border: 1px solid #25D366; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.85rem;">
                        ${window.t('apartments.apartment_number')}: #${apt.id}
                    </span>
                    ${apt.owner_phone ? `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.82rem; cursor: pointer;" onclick="navigator.clipboard.writeText('${apt.owner_phone}'); window.showToastGlobal && window.showToastGlobal(window.t('messages.owner_phone_copied'))"><i class="fa-solid fa-lock"></i> ${window.t('apartments.owner_phone_label')}: ${apt.owner_phone}</span>` : ''}
                    ${rtLabel ? `<span style="background: rgba(${rtRgbVal},0.18); color: ${rtColor}; border: 1px solid ${rtColor}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.82rem;">${rtLabel}</span>` : ''}
                    ${apt.rooms_count ? `<span style="background: rgba(37,211,102,0.15); color: #25D366; border: 1px solid #25D366; padding: 4px 10px; border-radius: 12px; font-size: 0.82rem; font-weight:bold;">${window.t('apartments.bedrooms_count', {count: apt.rooms_count})}</span>` : ''}
                </div>
                <h3 class="card-title">${apt.title}</h3>
                <p class="card-loc"><i class="fa-solid fa-location-dot"></i> ${window.t('apartments.district_label')}: ${apt.location}</p>
                <div style="margin: 8px 0; display: flex; gap: 8px; flex-wrap: wrap;">
                    <span style="background:var(--primary); color:#fff; padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:bold; display:inline-block;">
                         ${window.t('apartments.rooms_count_label')}: ${apt.capacity || window.t('apartments.default_rooms_desc')}
                    </span>
                </div>
                ${apt.roommate_reqs || apt.roommate_facilities ? `
                <div style="background: rgba(251, 191, 36, 0.08); border: 1px dashed #fbbf24; padding: 10px; border-radius: 10px; margin: 8px 0; font-size: 0.85rem;">
                    ${apt.roommate_reqs ? `<div style="margin-bottom: 4px;"><strong style="color: #fbbf24;"> ${window.t('apartments.roommate_reqs_label')}:</strong> ${apt.roommate_reqs}</div>` : ''}
                    ${apt.roommate_facilities ? `<div><strong style="color: #fbbf24;"> ${window.t('apartments.roommate_facilities_label')}:</strong> ${apt.roommate_facilities}</div>` : ''}
                </div>` : ''}
                <div class="features-list">
                    ${(Array.isArray(apt.features) ? apt.features : [apt.features]).map(f => `<span class="feature-pill">${f}</span>`).join('')}
                </div>
                <p class="card-desc">${apt.description}</p>
                <div class="card-actions">
                    <button class="btn btn-primary" style="background: rgba(99,102,241,0.2); border: 1px solid #6366f1; color: #a5b4fc;"
                            onclick="window.openEditApartmentModalGlobal && window.openEditApartmentModalGlobal(${apt.id})">
                        <i class="fa-solid fa-pen-to-square"></i> ${window.t('buttons.edit')}
                    </button>
                    <button class="btn btn-danger" onclick="window.deleteApartmentGlobal && window.deleteApartmentGlobal(${apt.id})"><i class="fa-solid fa-trash"></i> ${window.t('buttons.delete')}</button>
                    <span style="font-size:0.8rem; color:var(--accent-green); align-self:center;">${window.t('apartments.status_active')} </span>
                </div>
            </div>
        </div>
    `}).join('');
}

export async function handleAddApartment(e) {
    e.preventDefault();
    const bathroomsDisplay = document.getElementById('aptBathrooms')?.value || '1 حمام';
    let bathroomsKey = 'apartments.bathrooms.1';
    if (bathroomsDisplay === '2 حمام' || bathroomsDisplay === '2 Bathroom') bathroomsKey = 'apartments.bathrooms.2';
    else if (bathroomsDisplay === '3+ حمامات' || bathroomsDisplay === '3+ Bathrooms') bathroomsKey = 'apartments.bathrooms.3plus';
    const bathrooms = window.t(bathroomsKey);

    const rentalTypeDisplay = document.getElementById('aptRentalType')?.value || 'شقة';
    const ownerPhone = document.getElementById('aptOwnerPhone')?.value || '';
    const roomReqs = document.getElementById('aptRoommateReqs')?.value || '';
    const roomFacs = document.getElementById('aptRoommateFacilities')?.value || '';
    const capacity = document.getElementById('aptCapacity')?.value || window.t('apartments.default_rooms_desc');
    const districtId = document.getElementById('aptDistrictId')?.value || '';
    const roomsCount = parseInt(document.getElementById('aptRoomsCount')?.value || '0', 10) || null;

    // Map Arabic UI display value to canonical DB value
    const rentalTypeMap = {
        'شقة': 'apartment', 'شقة كاملة': 'apartment',
        'غرفة في شقة': 'room_shared', 'مشترك': 'room_shared',
        'ستوديو': 'studio', 'studio': 'studio',
        'apartment': 'apartment', 'room_shared': 'room_shared'
    };
    const rentalType = rentalTypeMap[rentalTypeDisplay] || 'apartment';

    let proxList = [];
    const uniCheckboxes = document.querySelectorAll('#aptUniversitiesCheckboxes .uni-checkbox:checked');
    const selectedUnis = Array.from(uniCheckboxes).map(cb => {
        const timeInputId = cb.getAttribute('data-id');
        const timeVal = document.getElementById(`uni_time_${timeInputId}`)?.value;
        if (timeVal) {
            proxList.push(`${cb.value} (${window.t('apartments.feature.minutes_walk', {minutes: timeVal})})`);
        }
        return cb.value;
    });

    const baseProxAr = document.getElementById('aptProximityAr').value;
    const baseProxEn = document.getElementById('aptProximityEn').value;
    const finalProximityAr = proxList.length > 0 ? `${baseProxAr} | ${proxList.join(' ، ')}` : baseProxAr;
    const finalProximityEn = baseProxEn;  // Uni proximity list appended only for AR for now

    const featArrAr = document.getElementById('aptFeaturesAr').value.split(/[،,]/).map(f => f.trim()).filter(Boolean);
    const featArrEn = document.getElementById('aptFeaturesEn').value.split(/[,،]/).map(f => f.trim()).filter(Boolean);
    if (!featArrAr.includes(bathrooms)) featArrAr.unshift(bathrooms);
    if (rentalType === 'room_shared' && !featArrAr.includes(window.t('apartments.feature.roommate'))) featArrAr.push(window.t('apartments.feature.roommate'));
    if (rentalType === 'apartment' && !featArrAr.includes(window.t('apartments.feature.entire_apt'))) featArrAr.push(window.t('apartments.feature.entire_apt'));
    // Keep AR features as the canonical features array for backward compat
    let featArr = featArrAr;

    const rawVal = document.getElementById('aptImage').value;
    let imagesArr;
    try {
        imagesArr = JSON.parse(rawVal);
    } catch (ex) {
        imagesArr = [rawVal];
    }

    const newApt = {
        title: document.getElementById('aptTitleAr').value,
        title_ar: document.getElementById('aptTitleAr').value,
        title_en: document.getElementById('aptTitleEn').value,
        price: document.getElementById('aptPrice').value,
        location: document.getElementById('aptLocationAr').value,
        location_ar: document.getElementById('aptLocationAr').value,
        location_en: document.getElementById('aptLocationEn').value,
        proximity: finalProximityAr,
        proximity_ar: finalProximityAr,
        proximity_en: finalProximityEn,
        universities: selectedUnis,
        capacity: document.getElementById('aptCapacityAr').value || window.t('apartments.default_rooms_desc'),
        capacity_ar: document.getElementById('aptCapacityAr').value || window.t('apartments.default_rooms_desc'),
        capacity_en: document.getElementById('aptCapacityEn').value || '',
        rental_type: rentalType,
        rooms_count: roomsCount,
        district_id: districtId !== '' ? parseInt(districtId, 10) : null,
        move_in_type: document.getElementById('aptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate') : window.t('apartments.feature.scheduled'),
        move_in_type_ar: document.getElementById('aptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate') : window.t('apartments.feature.scheduled'),
        move_in_type_en: document.getElementById('aptMoveInType').value === 'immediate' ? 'Immediate' : 'Scheduled',
        move_in_date: document.getElementById('aptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate_date') : document.getElementById('aptMoveInDateAr').value,
        move_in_date_ar: document.getElementById('aptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate_date') : document.getElementById('aptMoveInDateAr').value,
        move_in_date_en: document.getElementById('aptMoveInType').value === 'immediate' ? 'Immediate Move-in' : document.getElementById('aptMoveInDateEn').value,
        owner_phone: ownerPhone,
        roommate_reqs: rentalType === 'room_shared' ? roomReqs : null,
        roommate_facilities: rentalType === 'room_shared' ? roomFacs : null,
        features: featArr,
        features_ar: featArrAr,
        features_en: featArrEn,
        images: imagesArr,
        description: document.getElementById('aptDescAr').value + ` (${bathrooms})`,
        description_ar: document.getElementById('aptDescAr').value,
        description_en: document.getElementById('aptDescEn').value,
    };

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=add_apartment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newApt)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('aptModal');
            document.getElementById('aptForm').reset();
            const aptContainer = document.getElementById('aptImgPreviewsContainer');
            if (aptContainer) aptContainer.innerHTML = '';
            showToast(window.t('messages.apartment_added'));
        } else {
            showToast(window.t('messages.error_add_apartment') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function openEditApartmentModal(aptId) {
    const apt = appData.apartments.find(a => a.id === aptId || a.id === String(aptId));
    if (!apt) {
        showToast(window.t('messages.not_found_apartment'));
        return;
    }

    // Populate scalar fields
    document.getElementById('editAptId').value = apt.id;
    // Fill AR title: prefer title_ar, fallback to title
    document.getElementById('editAptTitleAr').value = apt.title_ar || apt.title || '';
    document.getElementById('editAptTitleEn').value = apt.title_en || '';
    document.getElementById('editAptPrice').value = apt.price || '';
    document.getElementById('editAptLocationAr').value = apt.location_ar || apt.location || '';
    document.getElementById('editAptLocationEn').value = apt.location_en || '';
    document.getElementById('editAptProximityAr').value = apt.proximity_ar || apt.proximity || '';
    document.getElementById('editAptProximityEn').value = apt.proximity_en || '';
    document.getElementById('editAptCapacityAr').value = apt.capacity_ar || apt.capacity || '';
    document.getElementById('editAptCapacityEn').value = apt.capacity_en || '';
    document.getElementById('editAptOwnerPhone').value = apt.owner_phone || '';
    document.getElementById('editAptRoomsCount').value = apt.rooms_count || '';
    document.getElementById('editAptDescAr').value = apt.description_ar || apt.description || '';
    document.getElementById('editAptDescEn').value = apt.description_en || '';

    // Move in type and date
    const miTypeSel = document.getElementById('editAptMoveInType');
    const isImmediate = apt.move_in_type === 'فوري' || apt.move_in_type === 'Immediate' || apt.move_in_type_en === 'Immediate';
    if (miTypeSel) {
        miTypeSel.value = isImmediate ? 'immediate' : 'scheduled';
        document.getElementById('editAptMoveInDateContainer').style.display = isImmediate ? 'none' : 'block';
    }
    document.getElementById('editAptMoveInDateAr').value = (!isImmediate && (apt.move_in_date_ar || apt.move_in_date)) ? (apt.move_in_date_ar || apt.move_in_date) : '';
    document.getElementById('editAptMoveInDateEn').value = (!isImmediate && apt.move_in_date_en) ? apt.move_in_date_en : '';

    // Features array → comma string, fill AR and EN separately
    const featsArr = Array.isArray(apt.features_ar) ? apt.features_ar : (Array.isArray(apt.features) ? apt.features : []);
    const featsArrEn = Array.isArray(apt.features_en) ? apt.features_en : [];
    document.getElementById('editAptFeaturesAr').value = featsArr.join(' ، ');
    document.getElementById('editAptFeaturesEn').value = featsArrEn.join(', ');

    // Rental type
    const rtSel = document.getElementById('editAptRentalType');
    if (rtSel) rtSel.value = apt.rental_type || 'apartment';

    // Roommate fields loading
    if (document.getElementById('editAptRoommateReqs')) {
        document.getElementById('editAptRoommateReqs').value = apt.roommate_reqs || '';
    }
    if (document.getElementById('editAptRoommateFacilities')) {
        document.getElementById('editAptRoommateFacilities').value = apt.roommate_facilities || '';
    }
    const editRoommateSec = document.getElementById('editRoommateSection');
    if (editRoommateSec) {
        editRoommateSec.style.display = (apt.rental_type === 'room_shared') ? 'block' : 'none';
    }

    // District dropdown — populated from appData
    const distSel = document.getElementById('editAptDistrictId');
    if (distSel) {
        distSel.innerHTML = `<option value="">${window.t('apartments.select_district')}</option>` + (appData.districts || []).map(d =>
            `<option value="${d.id}" ${String(d.id) === String(apt.district_id) ? 'selected' : ''}>${d.name}</option>`
        ).join('');
    }

    // Reset image hidden field to existing images; if the user uploads new ones the field gets overwritten
    const existingImages = Array.isArray(apt.images) ? apt.images : (apt.images ? [apt.images] : []);
    const editImagesField = document.getElementById('editAptImages');
    if (editImagesField) editImagesField.value = JSON.stringify(existingImages);

    // Show current images as thumbnails
    const currentPrev = document.getElementById('editAptCurrentImgPreviews');
    if (currentPrev) {
        currentPrev.innerHTML = existingImages.length > 0
            ? existingImages.map(url => `<img src="${resolveImgUrl(url)}" onerror="this.style.display='none'" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:2px solid var(--accent-amber);" title="${window.t('apartments.current_image')}">`).join('')
            : `<span style="font-size:0.8rem;color:var(--text-muted);">${window.t('apartments.no_current_images')}</span>`;
    }

    // Clear any previous new-upload previews
    const newPrev = document.getElementById('editAptImgPreviewsContainer');
    if (newPrev) newPrev.innerHTML = '';
    const fileInput = document.getElementById('editAptFileInput');
    if (fileInput) fileInput.value = '';

    // Universities checkboxes — pre-check based on existing apt.universities
    const existingUnis = Array.isArray(apt.universities) ? apt.universities : [];
    const uniContainer = document.getElementById('editAptUniversitiesCheckboxes');
    if (uniContainer) {
        uniContainer.innerHTML = (appData.universities || []).map(uni => {
            const isChecked = existingUnis.includes(uni.name) ? 'checked' : '';
            return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text-main);">
                <input type="checkbox" value="${uni.name}" class="edit-apt-uni-checkbox" ${isChecked}
                       style="width:16px;height:16px;">
                ${uni.name}
            </label>`;
        }).join('');
    }

    window.openModalGlobal && window.openModalGlobal('editAptModal');
}

export async function handleUpdateApartment(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editAptId').value, 10);
    if (!id) { showToast(window.t('validation.apartment_id_missing')); return; }

    const featuresRawAr = document.getElementById('editAptFeaturesAr').value;
    const featuresRawEn = document.getElementById('editAptFeaturesEn').value;
    const featArr = featuresRawAr.split(/[،,]/).map(f => f.trim()).filter(Boolean);
    const featArrEn = featuresRawEn.split(/[,،]/).map(f => f.trim()).filter(Boolean);
    const roomsCountVal = parseInt(document.getElementById('editAptRoomsCount').value || '0', 10) || null;
    const districtIdVal = document.getElementById('editAptDistrictId').value;

    // Images: use new uploaded ones if the user selected files, otherwise keep existing
    let imagesArr;
    try {
        imagesArr = JSON.parse(document.getElementById('editAptImages').value || '[]');
    } catch { imagesArr = []; }

    // Universities: collect from checkboxes
    const uniCheckboxes = document.querySelectorAll('#editAptUniversitiesCheckboxes .edit-apt-uni-checkbox:checked');
    const selectedUnis = Array.from(uniCheckboxes).map(cb => cb.value);

    // Retrieve existing apt to preserve non-edited fields
    const existing = appData.apartments.find(a => a.id === id || a.id === String(id)) || {};

    const payload = {
        id,
        title: document.getElementById('editAptTitleAr').value,
        title_ar: document.getElementById('editAptTitleAr').value,
        title_en: document.getElementById('editAptTitleEn').value,
        price: document.getElementById('editAptPrice').value,
        location: document.getElementById('editAptLocationAr').value,
        location_ar: document.getElementById('editAptLocationAr').value,
        location_en: document.getElementById('editAptLocationEn').value,
        proximity: document.getElementById('editAptProximityAr').value,
        proximity_ar: document.getElementById('editAptProximityAr').value,
        proximity_en: document.getElementById('editAptProximityEn').value,
        capacity: document.getElementById('editAptCapacityAr').value,
        capacity_ar: document.getElementById('editAptCapacityAr').value,
        capacity_en: document.getElementById('editAptCapacityEn').value,
        rental_type: document.getElementById('editAptRentalType').value,
        rooms_count: roomsCountVal,
        district_id: districtIdVal !== '' ? parseInt(districtIdVal, 10) : null,
        owner_phone: document.getElementById('editAptOwnerPhone').value,
        roommate_reqs: document.getElementById('editAptRentalType').value === 'room_shared' ? document.getElementById('editAptRoommateReqs').value : null,
        roommate_facilities: document.getElementById('editAptRentalType').value === 'room_shared' ? document.getElementById('editAptRoommateFacilities').value : null,
        features: featArr,
        features_ar: featArr,
        features_en: featArrEn,
        description: document.getElementById('editAptDescAr').value,
        description_ar: document.getElementById('editAptDescAr').value,
        description_en: document.getElementById('editAptDescEn').value,
        images: imagesArr,
        universities: selectedUnis,
        move_in_type: document.getElementById('editAptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate') : window.t('apartments.feature.scheduled'),
        move_in_type_ar: document.getElementById('editAptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate') : window.t('apartments.feature.scheduled'),
        move_in_type_en: document.getElementById('editAptMoveInType').value === 'immediate' ? 'Immediate' : 'Scheduled',
        move_in_date: document.getElementById('editAptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate_date') : document.getElementById('editAptMoveInDateAr').value,
        move_in_date_ar: document.getElementById('editAptMoveInType').value === 'immediate' ? window.t('apartments.feature.immediate_date') : document.getElementById('editAptMoveInDateAr').value,
        move_in_date_en: document.getElementById('editAptMoveInType').value === 'immediate' ? 'Immediate Move-in' : document.getElementById('editAptMoveInDateEn').value,
        is_available: existing.is_available !== undefined ? existing.is_available : 1,
    };

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=update_apartment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            window.closeModalGlobal && window.closeModalGlobal('editAptModal');
            showToast(window.t('messages.apartment_updated'));
        } else {
            showToast(window.t('messages.error_update_apartment') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export async function deleteApartment(id, confirmDeleteOffers = false) {
    if (!confirmDeleteOffers) {
        const confirmed = await window.showConfirmDialog({
            title: window.t('dialog.delete_apartment_title'),
            message: window.t('dialog.delete_apartment_msg'),
            confirmText: window.t('buttons.delete'),
            cancelText: window.t('buttons.cancel'),
            variant: 'danger'
        });
        if (!confirmed) return;
    }
    try {
        const payload = { id };
        if (confirmDeleteOffers) {
            payload.confirm_delete_offers = true;
        }
        const res = await window.authFetch(`../api/admin_api.php?action=delete_apartment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast(window.t('messages.apartment_deleted'));
        } else if (data.status === 'warning' && data.requires_confirmation) {
            const confirmed = await window.showConfirmDialog({
                title: window.t('dialog.delete_apartment_offers_title'),
                message: data.message,
                confirmText: window.t('buttons.delete'),
                cancelText: window.t('buttons.cancel'),
                variant: 'danger'
            });
            if (confirmed) {
                await deleteApartment(id, true);
            }
        } else {
            showToast(window.t('messages.error_delete_apartment') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(window.t('messages.conn_error'));
    }
}

export function toggleRoommateFields(val, isEdit = false) {
    const secId = isEdit ? 'editRoommateSection' : 'roommateSection';
    const sec = document.getElementById(secId);
    if (sec) {
        const isRoom = val && (val.includes('غرفة') || val.includes('shared') || val.includes('room_shared'));
        sec.style.display = isRoom ? 'block' : 'none';
    }
}

export function toggleMoveInDateInput(val) {
    const grp = document.getElementById('moveInDateGroup');
    if (grp) {
        const isDate = val && (val === 'ميعاد' || val === 'date' || val.includes('ميعاد') || val.includes('date'));
        grp.style.display = isDate ? 'block' : 'none';
    }
}

export function initApartmentsModule() {
    const aptForm = document.getElementById('aptForm');
    if (aptForm) {
        aptForm.addEventListener('submit', handleAddApartment);
    }

    const editAptForm = document.getElementById('editAptForm');
    if (editAptForm) {
        editAptForm.addEventListener('submit', handleUpdateApartment);
    }

    const aptSearch = document.getElementById('aptSearchInput');
    if (aptSearch) {
        aptSearch.addEventListener('input', renderApartments);
    }

    const rentalTypeSelect = document.getElementById('aptRentalType');
    if (rentalTypeSelect) {
        rentalTypeSelect.addEventListener('change', (e) => {
            toggleRoommateFields(e.target.value, false);
        });
    }

    const editRentalTypeSelect = document.getElementById('editAptRentalType');
    if (editRentalTypeSelect) {
        editRentalTypeSelect.addEventListener('change', (e) => {
            toggleRoommateFields(e.target.value, true);
        });
    }

    const aptMoveInType = document.getElementById('aptMoveInType');
    if (aptMoveInType) {
        aptMoveInType.addEventListener('change', (e) => {
            document.getElementById('aptMoveInDateContainer').style.display = e.target.value === 'scheduled' ? 'block' : 'none';
        });
    }

    const editAptMoveInType = document.getElementById('editAptMoveInType');
    if (editAptMoveInType) {
        editAptMoveInType.addEventListener('change', (e) => {
            document.getElementById('editAptMoveInDateContainer').style.display = e.target.value === 'scheduled' ? 'block' : 'none';
        });
    }

    // Expose globals so inline onclick in rendered HTML can call them
    window.deleteApartmentGlobal = deleteApartment;
    window.openEditApartmentModalGlobal = openEditApartmentModal;
}
