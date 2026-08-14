import { showToast } from './ui.js';


export function compressImageClientSide(file, maxDimension = 1100, quality = 0.80) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve({ blob: file, dataUrl: null });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > maxDimension || h > maxDimension) {
                    if (w > h) {
                        h = Math.round((h * maxDimension) / w);
                        w = maxDimension;
                    } else {
                        w = Math.round((w * maxDimension) / h);
                        h = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                canvas.toBlob((blob) => {
                    resolve({ blob: blob || file, dataUrl: dataUrl });
                },'image/jpeg', quality);
            };
            img.onerror = () => resolve({ blob: file, dataUrl: e.target.result });
            img.src = e.target.result;
        };
        reader.onerror = () => resolve({ blob: file, dataUrl: null });
        reader.readAsDataURL(file);
    });
}

export async function handleSvcFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    showToast(window.t('messages.compressing_service_image'));
    
    const compressed = await compressImageClientSide(file, 1100, 0.80);
    const formData = new FormData();
    formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") +'.jpg');
    
    try {
        const res = await window.authFetch('../api/upload/image.php?folder=services', { method:'POST', body: formData });
        const data = await res.json();
        if (data.status ==='success') {
            document.getElementById('svcImg').value = data.url;
            const prev = document.getElementById('svcImgPreview');
            if (prev) {
                prev.src ='../'+ data.url;
                prev.style.display ='block';
            }
            showToast(window.t('messages.service_image_uploaded'));
            return;
        }
        console.warn('Upload API returned error, falling back to compressed DataURL:', data.message);
    } catch (err) {
        console.warn('Upload API network error, falling back to compressed DataURL:', err);
    }
    
    const fallbackUrl = compressed.dataUrl;
    if (fallbackUrl) {
        document.getElementById('svcImg').value = fallbackUrl;
        const prev = document.getElementById('svcImgPreview');
        if (prev) {
            prev.src = fallbackUrl;
            prev.style.display ='block';
        }
        showToast(window.t('messages.image_selected_preview'));
    }
}

export async function handleAptFileSelect(input) {
    if (!input.files || input.files.length === 0) return;
    const container = document.getElementById('aptImgPreviewsContainer');
    
    let existingUrls = [];
    try {
        existingUrls = JSON.parse(document.getElementById('aptImage').value || '[]');
    } catch (e) {
        existingUrls = [];
    }

    let uploadedUrls = [];
    showToast(window.t('messages.compressing_apt_images', {count: input.files.length}));

    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const compressed = await compressImageClientSide(file, 1100, 0.80);
        const formData = new FormData();
        formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") +'.jpg');
        
        try {
            const res = await window.authFetch('../api/upload/image.php?folder=apartments', { method:'POST', body: formData });
            const data = await res.json();
            const url = data.status === 'success' ? data.url : (compressed.dataUrl || null);
            if (url) {
                uploadedUrls.push(url);
            }
        } catch (err) {
            if (compressed.dataUrl) {
                uploadedUrls.push(compressed.dataUrl);
            }
        }
    }
    
    if (uploadedUrls.length > 0) {
        const finalUrls = [...existingUrls, ...uploadedUrls];
        document.getElementById('aptImage').value = JSON.stringify(finalUrls);
        if (container) {
            container.innerHTML = finalUrls.map(url => `
                <img src="${url.startsWith('data:') ? url : ('../' + url)}" 
                     style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--accent-amber);">
            `).join('');
        }
        showToast(window.t('messages.apt_images_uploaded', {count: uploadedUrls.length}));
    }
}

export async function handleNewsFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
        showToast(window.t('messages.uploading_news_image'));
        const res = await window.authFetch('../api/upload/image.php?folder=news', { method:'POST', body: formData });
        const data = await res.json();
        if (data.status ==='success') {
            document.getElementById('newsImage').value = data.url;
            const prev = document.getElementById('newsImgPreview');
            if (prev) {
                prev.src ='../'+ data.url;
                prev.style.display ='block';
            }
            showToast(window.t('messages.news_image_uploaded'));
        } else {
            showToast(window.t('messages.upload_failed') + ': ' + (data.message || window.t('unspecified')));
        }
    } catch (err) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('newsImage').value = e.target.result;
            const prev = document.getElementById('newsImgPreview');
            if (prev) {
                prev.src = e.target.result;
                prev.style.display ='block';
            }
            showToast(window.t('messages.local_image_preview'));
        };
        reader.readAsDataURL(file);
    }
}

export function initUploadsModule() {
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (!target) return;
        const action = target.getAttribute('data-action');
        if (action === 'handleAptFileSelect') {
            handleAptFileSelect(target);
        } else if (action === 'handleSvcFileSelect') {
            handleSvcFileSelect(target);
        } else if (action === 'handleNewsFileSelect') {
            handleNewsFileSelect(target);
        } else if (action === 'handleAptEditFileSelect') {
            handleAptEditFileSelect(target);
        } else if (action === 'handleSvcEditFileSelect') {
            handleSvcEditFileSelect(target);
        } else if (action === 'handleOfferFileSelect') {
            handleOfferFileSelect(target);
        } else if (action === 'handleOfferEditFileSelect') {
            handleOfferEditFileSelect(target);
        }
    });
}

/**
 * Edit-apartment image upload: same pipeline as handleAptFileSelect but writes to
 * #editAptImages and #editAptImgPreviewsContainer.
 */
export async function handleAptEditFileSelect(input) {
    if (!input.files || input.files.length === 0) return;
    const container = document.getElementById('editAptImgPreviewsContainer');

    let existingUrls = [];
    try {
        existingUrls = JSON.parse(document.getElementById('editAptImages').value || '[]');
    } catch (e) {
        existingUrls = [];
    }

    let uploadedUrls = [];
    showToast(window.t('messages.compressing_apt_images', {count: input.files.length}));

    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const compressed = await compressImageClientSide(file, 1100, 0.80);
        const formData = new FormData();
        formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/, '') + '.jpg');

        try {
            const res = await window.authFetch('../api/upload/image.php?folder=apartments', { method: 'POST', body: formData });
            const data = await res.json();
            const url = data.status === 'success' ? data.url : (compressed.dataUrl || null);
            if (url) {
                uploadedUrls.push(url);
            }
        } catch (err) {
            if (compressed.dataUrl) {
                uploadedUrls.push(compressed.dataUrl);
            }
        }
    }

    if (uploadedUrls.length > 0) {
        const finalUrls = [...existingUrls, ...uploadedUrls];
        const hiddenField = document.getElementById('editAptImages');
        if (hiddenField) hiddenField.value = JSON.stringify(finalUrls);
        if (container) {
            container.innerHTML = uploadedUrls.map(url => `
                <img src="${url.startsWith('data:') ? url : ('../' + url)}" 
                     style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--accent-amber);">
            `).join('');
        }
        showToast(window.t('messages.apt_new_images_uploaded', {count: uploadedUrls.length}));
    }
}

/**
 * Edit-service image upload: same pipeline as handleSvcFileSelect but writes to
 * #editSvcImg (hidden) and #editSvcImgPreview.
 */
export async function handleSvcEditFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    showToast(window.t('messages.compressing_service_image'));

    const compressed = await compressImageClientSide(file, 1100, 0.80);
    const formData = new FormData();
    formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/, '') + '.jpg');

    try {
        const res = await window.authFetch('../api/upload/image.php?folder=services', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.status === 'success') {
            const hiddenField = document.getElementById('editSvcImg');
            if (hiddenField) hiddenField.value = data.url;
            const prev = document.getElementById('editSvcImgPreview');
            if (prev) { prev.src = '../' + data.url; prev.style.display = 'block'; }
            showToast(window.t('messages.service_image_uploaded'));
            return;
        }
    } catch (err) {
        console.warn('Upload API error for edit service, using dataURL:', err);
    }

    // Fallback: use compressed DataURL
    if (compressed.dataUrl) {
        const hiddenField = document.getElementById('editSvcImg');
        if (hiddenField) hiddenField.value = compressed.dataUrl;
        const prev = document.getElementById('editSvcImgPreview');
        if (prev) { prev.src = compressed.dataUrl; prev.style.display = 'block'; }
        showToast(window.t('messages.image_previewed_unsaved'));
    }
}

export async function handleOfferFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    showToast(window.t('messages.compressing_offer_image'));
    
    const compressed = await compressImageClientSide(file, 1100, 0.80);
    const formData = new FormData();
    formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") + '.jpg');
    
    try {
        const res = await window.authFetch('../api/upload/image.php?folder=offers', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('offerImage').value = data.url;
            const prev = document.getElementById('offerImgPreview');
            if (prev) {
                prev.src = '../' + data.url;
                prev.style.display = 'block';
            }
            showToast(window.t('messages.offer_image_uploaded'));
            return;
        }
    } catch (err) {
        console.warn('Upload API error for offer, using dataURL:', err);
    }
    
    const fallbackUrl = compressed.dataUrl;
    if (fallbackUrl) {
        document.getElementById('offerImage').value = fallbackUrl;
        const prev = document.getElementById('offerImgPreview');
        if (prev) {
            prev.src = fallbackUrl;
            prev.style.display = 'block';
        }
        showToast(window.t('messages.image_selected_preview'));
    }
}

export async function handleOfferEditFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    showToast(window.t('messages.compressing_offer_image'));
    
    const compressed = await compressImageClientSide(file, 1100, 0.80);
    const formData = new FormData();
    formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") + '.jpg');
    
    try {
        const res = await window.authFetch('../api/upload/image.php?folder=offers', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('editOfferImage').value = data.url;
            const prev = document.getElementById('editOfferImgPreview');
            if (prev) {
                prev.src = '../' + data.url;
                prev.style.display = 'block';
            }
            showToast(window.t('messages.offer_image_uploaded'));
            return;
        }
    } catch (err) {
        console.warn('Upload API error for edit offer, using dataURL:', err);
    }
    
    const fallbackUrl = compressed.dataUrl;
    if (fallbackUrl) {
        document.getElementById('editOfferImage').value = fallbackUrl;
        const prev = document.getElementById('editOfferImgPreview');
        if (prev) {
            prev.src = fallbackUrl;
            prev.style.display = 'block';
        }
        showToast(window.t('messages.image_selected_preview'));
    }
}

