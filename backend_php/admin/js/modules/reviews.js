import { appData } from '../state.js';
import { showToast } from '../ui.js';
import { loadDashboardData } from '../api.js';

let searchPhrase = '';
let filterStatus = 'all';
let filterRating = 'all';
let sortOrder = 'newest';

export function renderReviews() {
    const container = document.getElementById('reviewsTableBody');
    if (!container || !appData.reviews) return;

    // Filter reviews
    let list = [...appData.reviews];

    if (searchPhrase) {
        const query = searchPhrase.toLowerCase();
        list = list.filter(rev => {
            const req = appData.requests ? appData.requests.find(x => x.id === rev.service_request_id) : null;
            let serviceTitle;
            let sourceLabelText = '';
            if (!rev.service_request_id && !rev.student_id) {
                serviceTitle = t('reviews.cs_chat_testimonial');
                sourceLabelText = 'testimonial ' + t('reviews.source.testimonial');
            } else {
                sourceLabelText = 'service review ' + t('reviews.source.service');
                if (req) {
                    serviceTitle = req.service_title;
                } else if (rev.service_request_id) {
                    serviceTitle = `Request #${rev.service_request_id}`;
                } else {
                    serviceTitle = t('reviews.general_testimonial');
                }
            }
            return (rev.student_name || '').toLowerCase().includes(query) ||
                   (rev.comment || '').toLowerCase().includes(query) ||
                   serviceTitle.toLowerCase().includes(query) ||
                   sourceLabelText.toLowerCase().includes(query);
        });
    }

    if (filterStatus !== 'all') {
        list = list.filter(rev => rev.status === filterStatus);
    }

    if (filterRating !== 'all') {
        list = list.filter(rev => String(rev.rating) === String(filterRating));
    }

    // Sort
    list.sort((a, b) => {
        const timeA = new Date(a.date || a.created_at || 0).getTime();
        const timeB = new Date(b.date || b.created_at || 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    if (list.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    <i class="fa-solid fa-face-meh" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    ${t('reviews.no_reviews')}
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = list.map(rev => {
        const req = appData.requests ? appData.requests.find(x => x.id === rev.service_request_id) : null;

        // Determine service label:
        // - Legacy chat ratings: service_request_id is null AND student_id is null (submitted via legacy reviews.php)
        // - New service reviews: service_request_id is set (linked to a completed service request)
        // - New service review but request not found: show fallback
        let serviceTitle;
        let isLegacyTestimonial = false;
        if (!rev.service_request_id && !rev.student_id) {
            isLegacyTestimonial = true;
            serviceTitle = t('reviews.cs_chat_testimonial');
        } else if (req) {
            serviceTitle = req.service_title;
        } else if (rev.service_request_id) {
            serviceTitle = `Request #${rev.service_request_id}`;
        } else {
            serviceTitle = t('reviews.general_testimonial');
        }
        
        // Stars HTML
        const starsHtml = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        
        // Badges
        let statusClass = 'status-pending';
        let statusText = t('reviews.status.pending');
        if (rev.status === 'approved') {
            statusClass = 'status-done';
            statusText = t('reviews.status.approved');
        } else if (rev.status === 'rejected') {
            statusClass = 'status-pending'; // fallback style
            statusText = t('reviews.status.rejected');
        }
        
        // Status Badge Style overrides
        const badgeStyle = rev.status === 'rejected' 
            ? 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);' 
            : '';

        // Source Label Badge
        const sourceLabel = isLegacyTestimonial
            ? `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px; font-weight: bold;">${t('reviews.source.testimonial')}</span>`
            : `<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px; font-weight: bold;">${t('reviews.source.service')}</span>`;

        // Moderator name mapping
        const moderatorName = rev.reviewed_by_admin_id 
            ? (rev.reviewed_by_admin_id === 1 ? 'Admin' : `Admin #${rev.reviewed_by_admin_id}`) 
            : '-';
            
        const moderationTime = rev.reviewed_at || '-';
        const lastUpdated = rev.reviewed_at ? rev.reviewed_at.split(' ')[0] : rev.date;

        const isPending = rev.status === 'pending';
        const isApproved = rev.status === 'approved';
        const isRejected = rev.status === 'rejected';

        // Disabling buttons on rows that are currently saving
        const isProcessing = rev._processing === true;
        const disabledAttr = isProcessing ? 'disabled' : '';

        return `
            <tr id="review-row-${rev.id}" style="${isProcessing ? 'opacity: 0.6;' : ''}">
                <td style="font-weight: bold; color: var(--text-main);">${rev.student_name}</td>
                <td><span style="font-size: 0.85rem; color: var(--text-muted);">${
                    rev.uni && !/^\d+$/.test(rev.uni.trim())
                        ? rev.uni
                        : `<em style="color: var(--text-muted); opacity: 0.6;">${t('reviews.field.unavailable')}</em>`
                }</span></td>
                <td>
                    ${sourceLabel}<br/>
                    <span style="font-weight: 600; color: var(--primary);">${serviceTitle}</span>
                </td>
                <td><span style="color: var(--accent-amber); font-weight: bold; white-space: nowrap;">${starsHtml}</span></td>
                <td style="max-width: 250px; font-style: italic;">"${rev.comment || '-'}"</td>
                <td><span class="status-badge ${statusClass}" style="${badgeStyle}">${statusText}</span></td>
                <td><span style="font-size: 0.82rem; color: var(--text-muted);">${rev.date}</span></td>
                <td><span style="font-size: 0.82rem; color: var(--text-muted);">${lastUpdated}</span></td>
                <td><span style="font-weight: 600; color: var(--text-main);">${moderatorName}</span></td>
                <td><span style="font-size: 0.82rem; color: var(--text-muted);">${moderationTime}</span></td>
                <td>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        ${isProcessing ? `
                            <i class="fa-solid fa-spinner fa-spin" style="color: var(--primary); font-size: 1.2rem;"></i>
                        ` : `
                            ${!isApproved ? `
                                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; background: var(--accent-green);" 
                                        onclick="window.moderateReviewGlobal(${rev.id}, 'approved')" ${disabledAttr}>
                                    <i class="fa-solid fa-check"></i> ${t('buttons.accept')}
                                </button>
                            ` : ''}
                            ${!isRejected ? `
                                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; background: var(--accent-amber); color: black;" 
                                        onclick="window.moderateReviewGlobal(${rev.id}, 'rejected')" ${disabledAttr}>
                                    <i class="fa-solid fa-ban"></i> ${t('buttons.reject')}
                                </button>
                            ` : ''}
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" 
                                    onclick="window.deleteReviewGlobal(${rev.id})" ${disabledAttr}>
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

export async function moderateReview(id, status) {
    // Find review object in appData
    const review = appData.reviews.find(r => r.id === id);
    if (!review) return;

    // Set row processing state
    review._processing = true;
    renderReviews();

    try {
        const res = await window.authFetch(`../api/admin_api.php?action=moderate_service_review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            // Update in-memory local state immediately for instant feedback
            review.status = status;
            review.reviewed_by_admin_id = 1; // Super admin default
            review.reviewed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            showToast(t('messages.review_moderated'));
        } else {
            showToast(t('status.error') + ': ' + (data.message || ''));
        }
    } catch (ex) {
        console.error(ex);
        showToast(t('messages.conn_error'));
    } finally {
        review._processing = false;
        renderReviews();
        // Load in background to fetch analytics values and re-sync
        loadDashboardData();
    }
}

export async function deleteReview(id) {
    const confirmed = await window.showConfirmDialog({
        title: t('dialog.delete_review_title'),
        message: t('dialog.delete_review_msg'),
        confirmText: t('buttons.delete'),
        cancelText: t('buttons.cancel'),
        variant: 'danger'
    });
    if (!confirmed) return;

    // Find review object
    const review = appData.reviews.find(r => r.id === id);
    if (!review) return;

    review._processing = true;
    renderReviews();

    try {
        // Corrected action endpoint parameter: delete_service_review
        const res = await window.authFetch(`../api/admin_api.php?action=delete_service_review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            // Remove from local memory state immediately
            appData.reviews = appData.reviews.filter(r => r.id !== id);
            showToast(t('messages.review_deleted'));
        } else {
            showToast(t('messages.review_delete_failed') + ': ' + (data.message || ''));
            review._processing = false;
        }
    } catch (ex) {
        console.error(ex);
        showToast(t('messages.conn_error'));
        review._processing = false;
    } finally {
        renderReviews();
        loadDashboardData();
    }
}

export function initReviewsModule() {
    window.moderateReviewGlobal = moderateReview;
    window.deleteReviewGlobal = deleteReview;

    // Attach search and filter event listeners
    const searchInp = document.getElementById('revSearchInput');
    const statusFlt = document.getElementById('revStatusFilter');
    const ratingFlt = document.getElementById('revRatingFilter');
    const sortOrd   = document.getElementById('revSortOrder');

    if (searchInp) {
        searchInp.addEventListener('input', (e) => {
            searchPhrase = e.target.value.trim();
            renderReviews();
        });
    }
    if (statusFlt) {
        statusFlt.addEventListener('change', (e) => {
            filterStatus = e.target.value;
            renderReviews();
        });
    }
    if (ratingFlt) {
        ratingFlt.addEventListener('change', (e) => {
            filterRating = e.target.value;
            renderReviews();
        });
    }
    if (sortOrd) {
        sortOrd.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            renderReviews();
        });
    }
}
