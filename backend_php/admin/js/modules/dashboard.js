import { appData } from '../state.js';
import { showToast } from '../ui.js';

export function renderStats() {
    const statApt = document.getElementById('statAptCount');
    const statSvc = document.getElementById('statSvcCount');
    const statStd = document.getElementById('statStdCount');
    const statReq = document.getElementById('statReqCount');
    const reqBadge = document.getElementById('reqCountBadge');
    const chatBadge = document.getElementById('chatCountBadge');

    if (statApt) statApt.textContent = appData.apartments.length;
    if (statSvc) statSvc.textContent = appData.services.length;
    if (statStd) statStd.textContent = appData.students.length;

    const pendingReqs = appData.requests.filter(r => r.status === 'قيد المراجعة' || r.status === 'under_review' || r.status === 'pending_cash' || r.status === 'انتظار الدفع النقدي');
    if (statReq) statReq.textContent = pendingReqs.length;
    if (reqBadge) reqBadge.textContent = appData.requests.length;

    if (chatBadge && appData.chats) {
        const unreplied = appData.chats.filter(
            c => !c.status.includes('تم الرد') && !c.status.includes('مكتمل')
        ).length;
        chatBadge.textContent = unreplied;
        chatBadge.style.display = unreplied > 0 ? 'inline-block' : 'none';
    }

    // Reviews dynamic stats calculation (Service Reviews only - exclude legacy testimonials)
    const reviews = appData.reviews || [];
    const serviceReviewsOnly = reviews.filter(r => r.service_request_id !== null && r.service_request_id !== undefined && r.service_request_id !== '');
    const approvedReviews = serviceReviewsOnly.filter(r => r.status === 'approved');
    const pendingReviews = serviceReviewsOnly.filter(r => r.status === 'pending');
    const rejectedReviews = serviceReviewsOnly.filter(r => r.status === 'rejected');

    const statTotalReviews = document.getElementById('statTotalReviews');
    const statAvgRating = document.getElementById('statAvgRating');
    const statApprovedReviews = document.getElementById('statApprovedReviews');
    const statPendingReviews = document.getElementById('statPendingReviews');

    if (statTotalReviews) statTotalReviews.textContent = approvedReviews.length;

    if (statAvgRating) {
        if (approvedReviews.length === 0) {
            statAvgRating.textContent = '0.0';
        } else {
            const sum = approvedReviews.reduce((acc, r) => acc + parseInt(r.rating || 0), 0);
            statAvgRating.textContent = (sum / approvedReviews.length).toFixed(1);
        }
    }

    if (statApprovedReviews) statApprovedReviews.textContent = approvedReviews.length;
    if (statPendingReviews) statPendingReviews.textContent = pendingReviews.length;

    // Rating distribution
    const distContainer = document.getElementById('ratingDistributionContainer');
    if (distContainer) {
        const dist = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
        approvedReviews.forEach(r => {
            const rate = String(r.rating);
            if (dist[rate] !== undefined) dist[rate]++;
        });

        let maxCount = Math.max(...Object.values(dist));
        if (maxCount === 0) maxCount = 1;

        distContainer.innerHTML = [5, 4, 3, 2, 1].map(stars => {
            const count = dist[String(stars)];
            const percent = ((count / (approvedReviews.length || 1)) * 100).toFixed(0);
            const fillWidth = ((count / maxCount) * 100).toFixed(0);
            return `
                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; width: 100%;">
                    <span style="width: 30px; text-align: left; font-weight: bold; color: var(--text-muted);">${stars}★</span>
                    <div style="flex: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color);">
                        <div style="width: ${fillWidth}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 5px; transition: var(--transition);"></div>
                    </div>
                    <span style="width: 70px; text-align: right; color: var(--text-muted); font-size: 0.8rem;">${count} (${percent}%)</span>
                </div>
            `;
        }).join('');
    }

    // Service average ratings
    const serviceContainer = document.getElementById('serviceAnalyticsContainer');
    if (serviceContainer) {
        if (approvedReviews.length === 0) {
            serviceContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 0.9rem; padding: 1rem;">لا توجد إحصائيات خدمات بعد</p>';
        } else {
            const svcData = {};
            approvedReviews.forEach(r => {
                const req = appData.requests ? appData.requests.find(x => x.id === r.service_request_id) : null;
                const serviceTitle = req ? req.service_title : tr('عام / شهادة عملاء');
                if (!svcData[serviceTitle]) {
                    svcData[serviceTitle] = { sum: 0, count: 0 };
                }
                svcData[serviceTitle].sum += parseInt(r.rating || 0);
                svcData[serviceTitle].count++;
            });

            const list = Object.keys(svcData).map(title => ({
                title,
                avg: (svcData[title].sum / svcData[title].count).toFixed(1),
                count: svcData[title].count
            })).sort((a, b) => b.count - a.count);

            serviceContainer.innerHTML = list.map(item => {
                const fillWidth = (parseFloat(item.avg) / 5 * 100).toFixed(0);
                return `
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; border-bottom: 1px dashed rgba(255,255,255,0.03); padding-bottom: 8px; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-main); font-weight: 600;">
                            <span>${item.title}</span>
                            <span style="color: var(--accent-amber); font-weight: bold;">${item.avg} ★ (${item.count} ${tr('تقييمات')})</span>
                        </div>
                        <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; width: 100%;">
                            <div style="width: ${fillWidth}%; height: 100%; background: var(--accent-green); border-radius: 3px; transition: var(--transition);"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

export function initDashboardModule() {
    // Dashboard module is render-only; no persistent event listeners needed
}
