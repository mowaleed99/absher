const API_URL = '../api/admin_api.php';
const LOGIN_URL = '../api/admin/login.php';

let adminToken = localStorage.getItem('adminToken') || null;

async function checkAuth() {
    if (!adminToken) {
        showLoginOverlay();
        return false;
    }
    return true;
}

function showLoginOverlay() {
    if (document.getElementById('loginOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'loginOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#111827;z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:#1f2937;padding:30px;border-radius:12px;width:300px;text-align:center;">
            <h2 style="color:white;margin-bottom:15px;">تسجيل الدخول للإدارة</h2>
            <input type="text" id="adminIdent" placeholder="اسم المستخدم أو الإيميل" style="width:100%;padding:10px;margin-bottom:15px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;">
            <input type="password" id="adminPass" placeholder="كلمة المرور" style="width:100%;padding:10px;margin-bottom:15px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;">
            <button onclick="doAdminLogin()" class="btn btn-primary" style="width:100%;padding:10px;background:#fbbf24;color:black;font-weight:bold;border-radius:6px;cursor:pointer;">دخول</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.doAdminLogin = async function() {
    const ident = document.getElementById('adminIdent').value.trim();
    const pass = document.getElementById('adminPass').value;
    const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: ident, password: pass})
    });
    const data = await res.json();
    if (data.status === 'success' || data.success) {
        adminToken = data.data ? data.data.token : data.token;
        localStorage.setItem('adminToken', adminToken);
        document.getElementById('loginOverlay').remove();
        loadDashboardData();
    } else {
        alert('بيانات الدخول خاطئة!');
    }
}

window.authFetch = async function(url, options = {}) {
    if (!await checkAuth()) return null;
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = 'Bearer ' + adminToken;
    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem('adminToken');
        adminToken = null;
        showLoginOverlay();
        return null;
    }
    return res;
}


function formatChatMediaUrl(url) {
    if (!url) return'';
    if (url.startsWith('uploads/')) return'../'+ url;
    return url;
}

function isEmbeddableVideo(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('drive.google.com');
}

function getEmbedUrl(url) {
    if (!url) return'';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId ='';
        if (url.includes('v=')) {
            const parts = url.split('v=');
            if (parts.length > 1) {
                videoId = parts[1].split('&')[0];
            }
        } else if (url.includes('youtu.be/')) {
            const parts = url.split('youtu.be/');
            if (parts.length > 1) {
                videoId = parts[1].split('?')[0];
            }
        } else if (url.includes('embed/')) {
            const parts = url.split('embed/');
            if (parts.length > 1) {
                videoId = parts[1].split('?')[0];
            }
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } else if (url.includes('drive.google.com')) {
        let driveId ='';
        if (url.includes('/d/')) {
            const parts = url.split('/d/');
            if (parts.length > 1) {
                driveId = parts[1].split('/')[0];
            }
        } else if (url.includes('id=')) {
            const parts = url.split('id=');
            if (parts.length > 1) {
                driveId = parts[1].split('&')[0];
            }
        }
        return driveId ? `https://drive.google.com/file/d/${driveId}/preview` : url;
    }
    return url;
}

let appData = {
    apartments: [],
    services: [],
    students: [],
    requests: [],
    chats: [],
    reviews: [],
    news: [],
    notifications: [],
    universities: [],
    districts: []
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initThemeToggle();
    if (await checkAuth()) {
        loadDashboardData();
        setInterval(loadDashboardData, 4000);
    }
});

// Navigation & Tabs
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const activePane = document.getElementById(`tab-${tabId}`);

    if (activeNav) activeNav.classList.add('active');
    if (activePane) activePane.classList.add('active');
}

// Theme Toggle
function initThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    btn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = btn.querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.className ='fa-solid fa-sun';
        } else {
            icon.className ='fa-solid fa-moon';
        }
    });
}

// Fetch or Load Data
async function loadDashboardData() {
    if (!adminToken) return;
    try {
        const res = await window.authFetch(API_URL + '?action=get_all');
        if (!res) return;
        const result = await res.json();
        
        if (result.status === 'success') {
            appData = {
                apartments: result.apartments || [],
                services: result.services || [],
                students: result.students || [],
                requests: result.requests || [],
                reviews: result.reviews || [],
                chats: result.chats || [],
                news: result.news || [],
                notifications: result.notifications || [],
                universities: result.universities || [],
                districts: result.districts || []
            };
            document.getElementById('serverStatus').textContent = 'متصل (قاعدة البيانات المباشرة MySQL)';
            document.getElementById('serverStatus').className = 'status-online';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('serverStatus').textContent = 'غير متصل';
        document.getElementById('serverStatus').className = 'status-offline';
    }
    renderAll();
}


function resolveImgUrl(url) {
    if (!url) return'';
    if (url.startsWith('uploads/')) return'../'+ url;
    if (url.startsWith('assets/')) return'../../'+ url;
    return url;
}

// Render All UI Elements
function renderAll() {
    renderStats();
    renderApartments();
    renderServices();
    renderUniversities();
    renderDistricts();
    renderRequests();
    renderStudents();
    renderChats();
    renderReviews();
    renderNews();
    renderNotifications();
}

function renderStats() {
    document.getElementById('statAptCount').textContent = appData.apartments.length;
    document.getElementById('statSvcCount').textContent = appData.services.length;
    document.getElementById('statStdCount').textContent = appData.students.length;
    
    const pendingReqs = appData.requests.filter(r => r.status ==='قيد المراجعة');
    document.getElementById('statReqCount').textContent = pendingReqs.length;
    const reqBadge = document.getElementById('reqCountBadge');
    if (reqBadge) reqBadge.textContent = appData.requests.length;

    const chatBadge = document.getElementById('chatCountBadge');
    if (chatBadge && appData.chats) {
        const unreplied = appData.chats.filter(c => !c.status.includes('تم الرد') && !c.status.includes('مكتمل')).length;
        chatBadge.textContent = unreplied;
        chatBadge.style.display = unreplied > 0 ?'inline-block':'none';
    }

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

function renderApartments() {
    const container = document.getElementById('apartmentsList');
    const searchVal = (document.getElementById('aptSearchInput')?.value ||'').trim().toLowerCase();
    
    const filtered = appData.apartments.filter(apt => {
        if (!searchVal) return true;
        const idMatch = apt.id?.toString() === searchVal || `#${apt.id}` === searchVal || `رقم ${apt.id}` === searchVal;
        const titleMatch = (apt.title ||'').toLowerCase().includes(searchVal);
        const descMatch = (apt.description ||'').toLowerCase().includes(searchVal);
        return idMatch || titleMatch || descMatch;
    });

    container.innerHTML = filtered.map(apt => `
        <div class="item-card">
            <div class="card-img-wrap">
                <img src="${resolveImgUrl(Array.isArray(apt.images) ? apt.images[0] : apt.images)}"onerror="this.src='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=500&q=80'"alt="Apartment">
                <span class="price-tag">${apt.price}</span>
            </div>
            <div class="card-body">
                <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    <span style="background: rgba(37, 211, 102, 0.18); color: #25D366; border: 1px solid #25D366; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.85rem;">
                        رقم الشقة: #${apt.id}
                    </span>
                    ${apt.owner_phone ? `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.82rem; cursor: pointer;"onclick="navigator.clipboard.writeText('${apt.owner_phone}'); showToast('تم نسخ رقم المالك بنجاح')"><i class="fa-solid fa-lock"></i> هاتف المالك: ${apt.owner_phone}</span>` :''}
                    ${apt.rental_type ? `<span style="background: rgba(251, 191, 36, 0.18); color: #fbbf24; border: 1px solid #fbbf24; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.82rem;">${apt.rental_type}</span>` :''}
                </div>
                <h3 class="card-title">${apt.title}</h3>
                <p class="card-loc"><i class="fa-solid fa-location-dot"></i> الحي السكني: ${apt.location}</p>
                <div style="margin: 8px 0; display: flex; gap: 8px; flex-wrap: wrap;">
                    <span style="background:var(--primary); color:#fff; padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:bold; display:inline-block;">
                         عدد الغرف: ${apt.capacity ||'3 غرف'}
                    </span>
                </div>
                ${apt.roommate_reqs || apt.roommate_facilities ? `
                <div style="background: rgba(251, 191, 36, 0.08); border: 1px dashed #fbbf24; padding: 10px; border-radius: 10px; margin: 8px 0; font-size: 0.85rem;">
                    ${apt.roommate_reqs ? `<div style="margin-bottom: 4px;"><strong style="color: #fbbf24;"> شروط الشريك:</strong> ${apt.roommate_reqs}</div>` :''}
                    ${apt.roommate_facilities ? `<div><strong style="color: #fbbf24;"> المتاح للشريك:</strong> ${apt.roommate_facilities}</div>` :''}
                </div>` :''}
                <div class="features-list">
                    ${(Array.isArray(apt.features) ? apt.features : [apt.features]).map(f => `<span class="feature-pill">${f}</span>`).join('')}
                </div>
                <p class="card-desc">${apt.description}</p>
                <div class="card-actions">
                    <button class="btn btn-danger"onclick="deleteApartment(${apt.id})"><i class="fa-solid fa-trash"></i> حذف الشقة</button>
                    <span style="font-size:0.8rem; color:var(--accent-green); align-self:center;">نشطة في التطبيق </span>
                </div>
            </div>
        </div>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

function renderServices() {
    const container = document.getElementById('servicesList');
    container.innerHTML = appData.services.map(svc => `
        <div class="item-card">
            <div class="card-img-wrap"style="height:140px;">
                <img src="${resolveImgUrl(svc.image_url)}"onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'"alt="Service">
            </div>
            <div class="card-body">
                <h3 class="card-title">${svc.title}</h3>
                <p class="card-desc"style="margin-bottom:0.5rem;">${svc.description}</p>
                ${(svc.has_form == 1 || svc.has_form === undefined || svc.has_form === true) ? `<div style="margin-bottom:0.8rem;"><span style="background: rgba(37,211,102,0.15); color: #25D366; border: 1px solid #25D366; padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: bold;"> يتضمن نموذج طلب للعميل (Form)</span></div>` :''}
                <div class="card-actions">
                    <button class="btn btn-danger"onclick="deleteService(${svc.id})"><i class="fa-solid fa-trash"></i> حذف الخدمة</button>
                    <span style="font-size:0.8rem; color:var(--accent-blue); align-self:center;">متاحة للطلب </span>
                </div>
            </div>
        </div>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

function renderRequests(filterText ='') {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody || !appData.requests) return;
    
    // Create a copy and sort by id descending (newest first)
    let filteredReqs = [...appData.requests].sort((a, b) => b.id - a.id);
    
    if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        filteredReqs = filteredReqs.filter(r => 
            (r.id && r.id.toString().includes(lowerFilter)) ||
            (r.student_name && r.student_name.toLowerCase().includes(lowerFilter)) ||
            (r.student_phone && r.student_phone.includes(lowerFilter))
        );
    }
    
    let countPending = 0;
    appData.requests.forEach(r => {
        if (r.status ==='قيد المراجعة') countPending++;
    });

    tbody.innerHTML = filteredReqs.map((req) => {
        // Parse student info tags
        let infoChips = req.student_info ? req.student_info.split('|').map(s => s.trim()) : [];
        let uniStr ='';
        let natStr ='';
        infoChips.forEach(c => {
            if (c.includes('الجامعة:')) uniStr = c.replace('الجامعة:','').trim();
            if (c.includes('الجنسية:')) natStr = c.replace('الجنسية:','').trim();
        });

        // Status style
        let statusColor ='#fbbf24';
        if (req.status ==='جاري التنفيذ') statusColor ='#38bdf8';
        if (req.status ==='مكتمل') statusColor ='#25D366';

        return `
        <tr>
            <td style="font-weight: bold; color: var(--text-main);">#${req.id}</td>
            <td style="font-weight: bold; color: var(--primary); font-size: 1.05rem;">${req.student_name}</td>
            <td>
                <div style="font-size: 0.85rem; color: #d1d7db; margin-bottom: 6px;"><i class="fa-solid fa-building-columns"style="color:var(--primary); width:16px;"></i> ${uniStr}</div>
                <div style="font-size: 0.85rem; color: #d1d7db;"><i class="fa-solid fa-earth-americas"style="color:var(--primary); width:16px;"></i> ${natStr}</div>
            </td>
            <td dir="ltr"style="font-family: monospace; color: #25D366; font-weight: bold; font-size: 1rem;">${req.student_phone}</td>
            <td>
                <div style="font-weight: bold; color: var(--accent-amber); margin-bottom: 6px; font-size: 0.95rem;">${req.type ||'طلب خدمة'}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">${req.details}</div>
            </td>
            <td>
                <select onchange="updateRequestStatus(${req.id}, this.value)"style="padding: 6px 12px; border-radius: 8px; background: #1e293b; color: ${statusColor}; border: 1px solid rgba(255,255,255,0.1); font-weight: bold; font-size: 0.95rem; cursor: pointer; outline: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    <option value="قيد المراجعة"style="color:#fbbf24;"${req.status ==='قيد المراجعة'?'selected':''}>⏳ قيد المراجعة</option>
                    <option value="جاري التنفيذ"style="color:#38bdf8;"${req.status ==='جاري التنفيذ'?'selected':''}> جاري التنفيذ</option>
                    <option value="مكتمل"style="color:#25D366;"${req.status ==='مكتمل'?'selected':''}> مكتمل</option>
                </select>
            </td>
            <td>
                <button onclick="jumpToChat('${req.student_phone}','${req.student_name}')"class="btn btn-primary"style="background: rgba(37,211,102,0.15); border: 1px solid #25D366; color: #25D366; padding: 8px 16px; border-radius: 10px; font-size: 0.9rem; transition: transform 0.2s;"title="فتح المحادثة مع الطالب">
                    <i class="fa-solid fa-comments"></i> شات
                </button>
            </td>
        </tr>
        `;
    }).join('');
    
    const statReqCount = document.getElementById('statReqCount');
    if (statReqCount) statReqCount.innerText = countPending;

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

function filterRequests() {
    const searchVal = document.getElementById('reqSearchInput').value;
    renderRequests(searchVal);
}

function jumpToChat(phone, name) {
    const cleanPhone = phone.replace(/[^0-9+]/g,'');
    let chat = appData.chats.find(c => c.phone.replace(/[^0-9+]/g,'') === cleanPhone || c.student_name === name);
    
    if (!chat) {
        // Create mock chat if not found
        chat = {
            id: Date.now(),
            student_name: name,
            student_uni:'غير محدد',
            phone: phone,
            last_msg:'مرحباً',
            time:'الآن',
            status:'رسالة جديدة',
            messages: []
        };
        appData.chats.unshift(chat);
        renderChatsList();
    }
    
    switchTab('chats');
    setTimeout(() => {
        selectWaChat(chat.id);
    }, 100);
}

function renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = appData.students.map((std, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td style="font-weight:bold; color:var(--text-main); font-size:1rem;"> ${std.full_name}</td>
            <td>${std.email}</td>
            <td dir="ltr"style="color:var(--accent-green); font-weight:bold;">${std.phone}</td>
            <td style="font-weight:600;">${std.university}</td>
            <td><span style="background:rgba(236,72,153,0.15); color:var(--secondary); padding:4px 10px; border-radius:12px; font-weight:bold;">${std.nationality ||'غير محدد'}</span></td>
            <td dir="ltr">${std.created_at ||'الآن'}</td>
            <td dir="ltr"style="font-weight:bold; color:var(--accent);">${std.points || 0}</td>
            <td>
                <button class="btn btn-primary"style="padding:4px 8px; font-size:0.8rem;"onclick="openPointsModal(${std.id},'${std.full_name}', ${std.points || 0})"><i class="fa-solid fa-coins"></i> إدارة</button>
            </td>
            <td>
                <button class="btn btn-danger"style="padding:6px 10px;"onclick="deleteStudent(${std.id})"><i class="fa-solid fa-user-xmark"></i></button>
            </td>
        </tr>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

function renderChats() {
    const container = document.getElementById('chatsListColumn');
    const countSpan = document.getElementById('waChatCount');
    if (!container || !appData.chats) return;

    if (countSpan) {
        const unreplied = appData.chats.filter(c => !c.status.includes('تم الرد') && !c.status.includes('مكتمل')).length;
        countSpan.textContent = unreplied;
    }

    // Sort chats by active / time
    container.innerHTML = appData.chats.map(chat => `
        <div class="wa-chat-item"id="waItem-${chat.id}"onclick="selectWaChat(${chat.id})"style="padding: 14px 16px; background: var(--bg-main); border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; gap: 12px; align-items: center; transition: background 0.2s;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 1.3rem; flex-shrink: 0;">
                ${chat.student_name.charAt(0)}
            </div>
            <div style="flex: 1; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <h4 style="margin: 0; font-size: 1.05rem; font-weight: bold; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${chat.student_name}</h4>
                    <span style="font-size: 0.75rem; color: #25D366; font-weight: bold;">${chat.time && chat.time !=='الآن'? chat.time :''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                        ${chat.last_msg}
                    </p>
                    <span style="font-size: 0.75rem; background: ${chat.status.includes('جديدة') ?'#25D366':'rgba(255,255,255,0.1)'}; color: ${chat.status.includes('جديدة') ?'#fff':'var(--text-muted)'}; padding: 2px 8px; border-radius: 10px; font-weight: bold;">
                        ${chat.status}
                    </span>
                </div>
            </div>
        </div>
    `).join('');

    // Auto select first chat if none active
    const activeIdEl = document.getElementById('waActiveChatId');
    if (appData.chats.length > 0 && (!activeIdEl || !activeIdEl.value)) {
        setTimeout(() => selectWaChat(appData.chats[0].id), 100);
    } else if (activeIdEl && activeIdEl.value) {
        // If there is an active chat, re-render its thread to show new messages in real-time!
        const activeId = parseInt(activeIdEl.value);
        const activeChat = appData.chats.find(c => c.id === activeId);
        if (activeChat) {
            renderWaThread(activeChat);
        }
    }

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

function renderReviews() {
    const container = document.getElementById('reviewsList');
    if (!container || !appData.reviews) return;
    container.innerHTML = appData.reviews.map(rev => `
        <div class="item-card"style="background: linear-gradient(145deg, var(--bg-card), rgba(99,102,241,0.05));">
            <div class="card-body"style="padding: 1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="font-size:1.1rem; font-weight:bold; color:var(--accent-amber);">
                        ${''.repeat(rev.rating)}${''.repeat(5 - rev.rating)}
                    </h3>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${rev.date}</span>
                </div>
                <p style="color:var(--text-main); font-size:1rem; line-height:1.6; font-style:italic; margin-bottom:14px;">"${rev.comment}"</p>
                <div style="border-top:1px dashed var(--border-color); padding-top:10px; display:flex; align-items:center; gap:10px;">
                    <div style="width:35px; height:35px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold;">
                        ${rev.student_name.charAt(0)}
                    </div>
                    <div>
                        <h4 style="font-size:0.95rem; font-weight:bold; color:var(--text-main);">${rev.student_name}</h4>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${rev.uni}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

// Modals Handling
function openModal(modalId) {
    if (modalId ==='aptModal') {
        populateAptUniversitiesCheckboxes();
        populateAptLocationSelect();
    }
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Students & Points Logic
function deleteStudent(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) {
        appData.students = appData.students.filter(s => s.id !== id);
        saveLocalData();
        renderStudents();
        renderStats();
        showToast('تم حذف الطالب بنجاح! ️');
    }
}

function handleAddStudent(e) {
    e.preventDefault();
    const name = document.getElementById('addStdName').value;
    const email = document.getElementById('addStdEmail').value;
    const phone = document.getElementById('addStdPhone').value;
    const uni = document.getElementById('addStdUni').value;
    const pass = document.getElementById('addStdPass').value;

    const newStd = {
        id: Date.now(),
        full_name: name,
        email: email,
        phone: phone,
        university: uni,
        password: pass,
        nationality:'غير محدد',
        created_at: new Date().toISOString().slice(0,16).replace('T',''),
        points: 0
    };

    appData.students.unshift(newStd);
    saveLocalData();
    renderStudents();
    renderStats();
    closeModal('addStudentModal');
    document.getElementById('addStudentForm').reset();
    showToast('تم إضافة الطالب بنجاح!');
}

function openPointsModal(studentId, studentName, currentPoints) {
    document.getElementById('pointsStudentId').value = studentId;
    document.getElementById('pointsModalStudentName').textContent = studentName;
    document.getElementById('pointsModalCurrentPoints').textContent = currentPoints || 0;
    document.getElementById('pointsAmount').value ='';
    document.getElementById('pointsReason').value ='';
    document.querySelector('input[name="pointsOperation"][value="add"]').checked = true;
    openModal('pointsModal');
}

function handlePointsSubmit(e) {
    e.preventDefault();
    const studentId = parseInt(document.getElementById('pointsStudentId').value);
    const amount = parseInt(document.getElementById('pointsAmount').value);
    const reason = document.getElementById('pointsReason').value;
    const operation = document.querySelector('input[name="pointsOperation"]:checked').value;

    if (isNaN(amount) || amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر.');
        return;
    }

    const studentIndex = appData.students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
        let currentPoints = parseInt(appData.students[studentIndex].points) || 0;
        
        if (operation ==='add') {
            currentPoints += amount;
        } else {
            if (currentPoints < amount) {
                showToast('عفواً، رصيد الطالب غير كافٍ لهذه العملية');
                return;
            }
            currentPoints -= amount;
        }

        appData.students[studentIndex].points = currentPoints;
        
        // Add a notification for the student
        const notifTitle = operation ==='add'?'إضافة نقاط':'سحب نقاط';
        const notifText = operation ==='add'? `تم إضافة ${amount} نقطة إلى محفظتك. السبب: ${reason}` : `تم خصم ${amount} نقطة من محفظتك. السبب: ${reason}`;
        
        const newNotif = {
            id: Date.now(),
            student_id: studentId, // Associate this notif with the student
            title: notifTitle,
            content: notifText,
            date:'الآن'};
        appData.notifications.unshift(newNotif);

        saveLocalData();
        renderStudents();
        closeModal('pointsModal');
        showToast(operation ==='add'?'تم إضافة النقاط بنجاح!':'تم خصم النقاط بنجاح!');
    }
}

function toggleRoommateFields(val) {
    const sec = document.getElementById('roommateSection');
    if (sec) sec.style.display = val && val.includes('غرفة') ?'block':'none';
}

function toggleMoveInDateInput(val) {
    const grp = document.getElementById('moveInDateGroup');
    if (grp) grp.style.display = (val ==='ميعاد') ?'block':'none';
}

function compressImageClientSide(file, maxDimension = 1100, quality = 0.80) {
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

async function handleSvcFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    showToast('⏳ جاري ضغط ورفع صورة الخدمة...');
    
    const compressed = await compressImageClientSide(file, 1100, 0.80);
    const formData = new FormData();
    formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") +'.jpg');
    
    try {
        const res = await fetch('../api/upload.php', { method:'POST', body: formData });
        const data = await res.json();
        if (data.status ==='success') {
            document.getElementById('svcImg').value = data.url;
            const prev = document.getElementById('svcImgPreview');
            if (prev) {
                prev.src ='../'+ data.url;
                prev.style.display ='block';
            }
            showToast('تم رفع صورة الخدمة بنجاح! ️');
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
        showToast('تم اختيار الصورة ومُعاينتها بنجاح! ️');
    }
}

async function handleAptFileSelect(input) {
    if (!input.files || input.files.length === 0) return;
    const container = document.getElementById('aptImgPreviewsContainer');
    if (container) container.innerHTML ='';
    
    let uploadedUrls = [];
    showToast(`⏳ جاري ضغط ورفع ${input.files.length} صورة شقة...`);

    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const compressed = await compressImageClientSide(file, 1100, 0.80);
        const formData = new FormData();
        formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") +'.jpg');
        
        try {
            const res = await fetch('../api/upload.php', { method:'POST', body: formData });
            const data = await res.json();
            if (data.status ==='success') {
                uploadedUrls.push(data.url);
                if (container) {
                    const img = document.createElement('img');
                    img.src ='../'+ data.url;
                    img.style.width ='60px';
                    img.style.height ='60px';
                    img.style.borderRadius ='8px';
                    img.style.objectFit ='cover';
                    img.style.border ='1px solid var(--accent-amber)';
                    container.appendChild(img);
                }
            } else if (compressed.dataUrl) {
                uploadedUrls.push(compressed.dataUrl);
                if (container) {
                    const img = document.createElement('img');
                    img.src = compressed.dataUrl;
                    img.style.width ='60px';
                    img.style.height ='60px';
                    img.style.borderRadius ='8px';
                    img.style.objectFit ='cover';
                    img.style.border ='1px solid var(--accent-amber)';
                    container.appendChild(img);
                }
            }
        } catch (err) {
            if (compressed.dataUrl) {
                uploadedUrls.push(compressed.dataUrl);
                if (container) {
                    const img = document.createElement('img');
                    img.src = compressed.dataUrl;
                    img.style.width ='60px';
                    img.style.height ='60px';
                    img.style.borderRadius ='8px';
                    img.style.objectFit ='cover';
                    img.style.border ='1px solid var(--accent-amber)';
                    container.appendChild(img);
                }
            }
        }
    }
    
    if (uploadedUrls.length > 0) {
        document.getElementById('aptImage').value = JSON.stringify(uploadedUrls);
        showToast(`تم رفع ${uploadedUrls.length} صورة بنجاح! ️`);
    }
}

async function handleNewsFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
        showToast('⏳ جاري رفع صورة الخبر...');
        const res = await fetch('../api/upload.php', { method:'POST', body: formData });
        const data = await res.json();
        if (data.status ==='success') {
            document.getElementById('newsImage').value = data.url;
            const prev = document.getElementById('newsImgPreview');
            if (prev) {
                prev.src ='../'+ data.url;
                prev.style.display ='block';
            }
            showToast('تم رفع صورة الخبر بنجاح! ️');
        } else {
            showToast('فشل الرفع:'+ (data.message ||'خطأ غير معروف'));
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
            showToast('تم استخدام المعاينة المحلية للصورة! ️');
        };
        reader.readAsDataURL(file);
    }
}

// Add Apartment Handler
async function handleAddApartment(e) {
    e.preventDefault();
    const bathrooms = document.getElementById('aptBathrooms')?.value ||'1 حمام';
    const rentalType = document.getElementById('aptRentalType')?.value ||'شقة';
    const ownerPhone = document.getElementById('aptOwnerPhone')?.value ||'';
    const roomReqs = document.getElementById('aptRoommateReqs')?.value ||'';
    const roomFacs = document.getElementById('aptRoommateFacilities')?.value ||'';
    const capacity = document.getElementById('aptCapacity')?.value ||'3 غرف';

    let proxList = [];
    const uniCheckboxes = document.querySelectorAll('#aptUniversitiesCheckboxes .uni-checkbox:checked');
    const selectedUnis = Array.from(uniCheckboxes).map(cb => {
        const timeInputId = cb.getAttribute('data-id');
        const timeVal = document.getElementById(`uni_time_${timeInputId}`)?.value;
        if (timeVal) {
            proxList.push(`${cb.value} (${timeVal} دقيقة)`);
        }
        return cb.value;
    });

    const baseProx = document.getElementById('aptProximity').value;
    const finalProximity = proxList.length > 0 ? `${baseProx} | ${proxList.join('،')}` : baseProx;

    let featArr = document.getElementById('aptFeatures').value.split('،').map(f => f.trim());
    if (!featArr.includes(bathrooms)) featArr.unshift(bathrooms);
    if (rentalType ==='غرفة في شقة'&& !featArr.includes('استئجار مع شريك')) featArr.push('استئجار مع شريك');
    if (rentalType ==='شقة'&& !featArr.includes('شقة بمفردك')) featArr.push('شقة بمفردك');

    const newId = appData.apartments.length > 0 ? Math.max(...appData.apartments.map(a => parseInt(a.id) || 0)) + 1 : 1;

    const newApt = {
        id: newId,
        title: document.getElementById('aptTitle').value,
        price: document.getElementById('aptPrice').value,
        location: document.getElementById('aptLocation').value,
        proximity: finalProximity,
        universities: selectedUnis,
        capacity: capacity,
        rental_type: rentalType,
        move_in_type:'فوري',
        move_in_date:'انتقال فوري',
        owner_phone: ownerPhone,
        roommate_reqs: rentalType ==='غرفة في شقة'? roomReqs : null,
        roommate_facilities: rentalType ==='غرفة في شقة'? roomFacs : null,
        features: featArr,
        images: (() => {
            const rawVal = document.getElementById('aptImage').value;
            try {
                return JSON.parse(rawVal);
            } catch(e) {
                return [rawVal];
            }
        })(),
        description: document.getElementById('aptDesc').value + ` (${bathrooms})`
    };

    try {
        const res = await window.authFetch(`${API_URL}?action=add_apartment`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(newApt)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            closeModal('aptModal');
            document.getElementById('aptForm').reset();
            const aptContainer = document.getElementById('aptImgPreviewsContainer');
            if (aptContainer) aptContainer.innerHTML ='';
            showToast('تمت إضافة الشقة بنجاح ونشرها في التطبيق!');
        } else {
            showToast('حدث خطأ أثناء الإضافة: ' + (data.message || ''));
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

// Add Service Handler
async function handleAddService(e) {
    e.preventDefault();
    const hasForm = document.getElementById('svcHasForm')?.checked ? 1 : 0;
    const rawImg = document.getElementById('svcImg').value;
    const newSvc = {
        id: Date.now(),
        title: document.getElementById('svcTitle').value.trim(),
        description: document.getElementById('svcDesc').value.trim(),
        image_url: rawImg && rawImg.trim() !== '' ? rawImg : '',
        has_form: hasForm
    };

    if (!newSvc.title) {
        showToast('يرجى إدخال اسم الخدمة');
        return;
    }

    try {
        const res = await window.authFetch(`${API_URL}?action=add_service`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(newSvc)
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            closeModal('svcModal');
            document.getElementById('svcForm').reset();
            document.getElementById('svcImg').value = '';
            const prev = document.getElementById('svcImgPreview');
            if (prev) prev.style.display ='none';
            showToast('تمت إضافة الخدمة بنجاح ️');
        } else {
            showToast(`فشل في إضافة الخدمة: ${data.message || 'خطأ غير معروف'}`);
        }
    } catch (err) {
        showToast(`حدث خطأ أثناء الاتصال بالخادم عند إضافة الخدمة.`);
        console.error('Error adding service:', err);
    }
}

// Delete Handlers
async function deleteApartment(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الشقة؟')) return;
    try {
        const res = await window.authFetch(`${API_URL}?action=delete_apartment`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم حذف الشقة بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف: ' + (data.message || ''));
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

async function deleteService(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الخدمة؟')) return;
    try {
        const res = await window.authFetch(`${API_URL}?action=delete_service`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم حذف الخدمة بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف: ' + (data.message || ''));
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

// Universities Handlers
function renderUniversities() {
    const container = document.getElementById('universitiesList');
    if (!container) return;
    container.innerHTML = (appData.universities || []).map(uni => `
        <div class="item-card"style="padding: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-main);">
            <div style="font-weight: bold; color: var(--text-main); font-size: 1.1rem;"><i class="fa-solid fa-graduation-cap"></i> ${uni.name}</div>
            <button class="btn btn-danger"onclick="deleteUniversity(${uni.id})"><i class="fa-solid fa-trash"></i> حذف</button>
        </div>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

async function handleAddUniversity(e) {
    e.preventDefault();
    const name = document.getElementById('uniName').value.trim();
    if (!name) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=add_university`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            closeModal('uniModal');
            document.getElementById('uniForm').reset();
            showToast('تم إضافة الجامعة بنجاح');
        } else {
            showToast('حدث خطأ أثناء الإضافة: ' + (data.message || ''));
        }
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء الاتصال بالخادم');
    }
}

async function deleteUniversity(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الجامعة؟')) return;
    try {
        const res = await window.authFetch(`${API_URL}?action=delete_university`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم حذف الجامعة بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف: ' + (data.message || ''));
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

function toggleUniTime(checkbox, uniId) {
    const timeInput = document.getElementById(`uni_time_${uniId}`);
    if (timeInput) {
        timeInput.style.display = checkbox.checked ?'block':'none';
        if (!checkbox.checked) timeInput.value ='';
    }
}

function populateAptUniversitiesCheckboxes() {
    const container = document.getElementById('aptUniversitiesCheckboxes');
    if (!container) return;
    container.innerHTML = (appData.universities || []).map(uni => `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main);">
                <input type="checkbox"value="${uni.name}"data-id="${uni.id}"class="uni-checkbox"onchange="toggleUniTime(this, ${uni.id})"style="width: 16px; height: 16px;"> ${uni.name}
            </label>
            <input type="number"id="uni_time_${uni.id}"placeholder="دقيقة"style="width: 70px; display: none; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main);">
        </div>
    `).join('');
}

// Districts Handlers
function renderDistricts() {
    const container = document.getElementById('districtsList');
    if (!container) return;
    container.innerHTML = (appData.districts || []).map(dist => `
        <div class="service-card"style="display:flex; justify-content:space-between; align-items:center; padding: 20px;">
            <div style="display:flex; align-items:center; gap: 15px;">
                <i class="fa-solid fa-map-location-dot"style="font-size: 2rem; color: var(--accent-amber);"></i>
                <h3 style="margin:0; font-size: 1.2rem;">${dist.name}</h3>
            </div>
            <button class="btn"style="background:#ff4d4d; color:white; border:none;"onclick="deleteDistrict(${dist.id})">
                <i class="fa-solid fa-trash"></i> مسح
            </button>
        </div>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

async function handleAddDistrict(event) {
    event.preventDefault();
    const name = document.getElementById('districtName').value.trim();
    if (!name) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=add_district`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تمت إضافة الحي بنجاح');
            closeModal('districtModal');
            document.getElementById('districtForm').reset();
        } else {
            showToast('حدث خطأ أثناء إضافة الحي');
        }
    } catch (e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

async function deleteDistrict(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الحي؟')) return;
    try {
        const res = await window.authFetch(`${API_URL}?action=delete_district`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم حذف الحي بنجاح ️');
        } else {
            showToast('حدث خطأ أثناء الحذف');
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

function populateAptLocationSelect() {
    const select = document.getElementById('aptLocation');
    if (!select) return;
    select.innerHTML = (appData.districts || []).map(dist => `
        <option value="${dist.name}">${dist.name}</option>
    `).join('');
}

async function updateRequestStatus(id, newStatus) {
    try {
        const res = await window.authFetch(`${API_URL}?action=update_request_status`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id, status: newStatus })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            showToast('تم تحديث حالة الطلب بنجاح');
        } else {
            showToast('حدث خطأ أثناء التحديث');
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

// Chat Interaction & Customer Service Functions
function openChatReplyModal(chatId) {
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;

    document.getElementById('activeChatId').value = chat.id;
    document.getElementById('chatModalStudentName').textContent = chat.student_name;
    document.getElementById('chatModalStudentUni').textContent =''+ chat.student_uni;
    document.getElementById('chatModalStudentPhone').textContent =''+ chat.phone;
    
    // Clean phone number for WhatsApp direct link
    const cleanPhone = chat.phone.replace(/[^0-9]/g,'');
    document.getElementById('whatsappDirectLink').href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('مرحباً'+ chat.student_name +'، معك خدمة عملاء تطبيق أبشر')}`;

    renderChatMessagesThread(chat);
    openModal('chatReplyModal');
}

function renderChatMessagesThread(chat) {
    const thread = document.getElementById('chatMessagesThread');
    if (!thread) return;

    if (!chat.messages || chat.messages.length === 0) {
        chat.messages = [
            { sender:'student', text: chat.last_msg ||'مرحباً خدمة العملاء', time: chat.time ||'الآن'}
        ];
    }

    thread.innerHTML = chat.messages.map(m => `
        <div style="display: flex; flex-direction: column; align-items: ${m.sender ==='admin'?'flex-end':'flex-start'};">
            <div style="max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 0.95rem; line-height: 1.5; ${
                m.sender ==='admin'?'background: var(--primary); color: #fff; border-bottom-left-radius: 2px;':'background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); border-bottom-right-radius: 2px;'}">
                <strong style="font-size: 0.8rem; display: block; margin-bottom: 4px; opacity: 0.9;">
                    ${m.sender ==='admin'?'️ خدمة العملاء (أبشر)':''+ chat.student_name}
                </strong>
                ${m.type ==='image'? `
                    <img src="${formatChatMediaUrl(m.imageUrl)}"onclick="openImageLightbox('${formatChatMediaUrl(m.imageUrl)}')"style="max-width: 100%; max-height: 200px; border-radius: 8px; display: block; margin: 6px 0; border: 1px solid rgba(255,255,255,0.2); object-fit: cover; cursor: pointer; transition: transform 0.2s;"onmouseover="this.style.transform='scale(1.02)'"onmouseout="this.style.transform='scale(1)'"title="اضغط لفتح الصورة بحجم كامل">
                ` :''}
                ${m.type ==='link'? `
                    <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 14px; border-radius: 10px; margin: 6px 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-link"style="font-size: 1.3rem; color: #60a5fa;"></i>
                        <div style="overflow: hidden;">
                            <strong style="display: block; font-size: 0.85rem; color: #60a5fa;">رابط مرفق</strong>
                            <a href="${m.imageUrl || (m.text && m.text.replace('رابط مرفق:',''))}"target="_blank"style="color: #93c5fd; font-size: 0.85rem; text-decoration: underline; word-break: break-all;">${m.imageUrl || (m.text && m.text.replace('رابط مرفق:',''))}</a>
                        </div>
                    </div>
                ` :''}
                ${(m.type ==='video'|| (m.imageUrl && (m.imageUrl.endsWith('.mp4') || m.imageUrl.endsWith('.webm') || m.imageUrl.endsWith('.mov') || typeof isEmbeddableVideo ==='function'&& isEmbeddableVideo(m.imageUrl)))) ? `
                    <div style="margin: 6px 0;">
                        ${(typeof isEmbeddableVideo ==='function'&& isEmbeddableVideo(m.imageUrl)) ? `
                            <iframe src="${getEmbedUrl(m.imageUrl)}"style="width: 100%; height: 200px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); display: block;"allowfullscreen></iframe>
                        ` : `
                            <video src="${m.imageUrl}"controls style="max-width: 100%; max-height: 220px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); outline: none; display: block;"></video>
                        `}
                    </div>
                ` :''}
                ${(m.type !=='image'&& m.type !=='video'&& m.type !=='link') ? `
                <div dir="auto">
                    ${m.text ||''}
                </div>
                ` : (m.text && !m.text.includes('مرفق') ? `<div dir="auto"style="margin-top: 4px; font-size: 0.85rem;">${m.text}</div>` :'')}
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; padding: 0 4px;">${m.time}</span>
        </div>
    `).join('');

    // Scroll to bottom
    setTimeout(() => {
        thread.scrollTop = thread.scrollHeight;
    }, 50);
}

function sendQuickReply(replyText) {
    const input = document.getElementById('customReplyInput');
    if (input) {
        input.value = replyText;
        input.focus();
    }
}

function handleSendChatReply(e) {
    e.preventDefault();
    const chatId = parseInt(document.getElementById('activeChatId').value);
    const input = document.getElementById('customReplyInput');
    const replyText = input.value.trim();

    if (!replyText) return;

    const chat = appData.chats.find(c => c.id === chatId);
    if (chat) {
        if (!chat.messages) chat.messages = [];
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit'});

        chat.messages.push({
            sender:'admin',
            text: replyText,
            time: timeStr
        });

        chat.last_msg ='الرد:'+ replyText;
        chat.status ='تم الرد ️';

        renderChatMessagesThread(chat);
        renderAll();
        input.value ='';
        showToast('تم إرسال ردك إلى الطالب بنجاح وتحديث المحادثة!');
    }
}

function archiveChat(chatId) {
    const chat = appData.chats.find(c => c.id === chatId);
    if (chat) {
        chat.status ='مؤرشفة';
        renderAll();
        showToast('تمت أرشفة المحادثة بنجاح ️');
    }
}

// WhatsApp Web Style Chat Functions
function selectWaChat(chatId) {
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;

    // Highlight selected item in column
    document.querySelectorAll('.wa-chat-item').forEach(el => {
        el.style.background ='var(--bg-main)';
        el.style.borderLeft ='none';
    });
    const selectedItem = document.getElementById(`waItem-${chatId}`);
    if (selectedItem) {
        selectedItem.style.background ='rgba(37,211,102,0.12)';
        selectedItem.style.borderLeft ='4px solid #25D366';
    }

    // Hide placeholder and show header, thread, quickbar, input
    document.getElementById('waNoSelection').style.display ='none';
    document.getElementById('waHeader').style.display ='flex';
    document.getElementById('waMessagesThread').style.display ='flex';
    if (document.getElementById('waQuickBar')) document.getElementById('waQuickBar').style.display ='flex';
    document.getElementById('waInputForm').style.display ='flex';

    document.getElementById('waActiveChatId').value = chat.id;
    document.getElementById('waAvatar').textContent = chat.student_name.charAt(0);
    document.getElementById('waStudentName').textContent = chat.student_name;
    document.getElementById('waStudentUni').textContent =''+ chat.student_uni;
    document.getElementById('waPhone').textContent =''+ chat.phone;

    const cleanPhone = chat.phone.replace(/[^0-9]/g,'');
    document.getElementById('waDirectBtn').href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('مرحباً'+ chat.student_name +'، معك خدمة عملاء تطبيق أبشر')}`;

    renderWaThread(chat);
}

let currentQuoteIndex = null;

function renderWaThread(chat) {
    const thread = document.getElementById('waMessagesThread');
    if (!thread) return;

    if (!chat.messages || chat.messages.length === 0) {
        chat.messages = [
            { sender:'student', text: chat.last_msg ||'مرحباً خدمة العملاء', time: chat.time ||'الآن'}
        ];
    }

    thread.innerHTML = chat.messages.map((m, idx) => `
        <div style="display: flex; flex-direction: column; align-items: ${m.sender ==='admin'?'flex-end':'flex-start'};">
            <div style="max-width: 75%; padding: 10px 16px; border-radius: 12px; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.2); position: relative; group; ${
                m.sender ==='admin'?'background: #005c4b; color: #fff; border-top-left-radius: 2px;':'background: #202c33; color: #e9edef; border-top-right-radius: 2px;'}">
                <!-- Sender Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 15px;">
                    <strong style="font-size: 0.78rem; color: ${m.sender ==='admin'?'#53bdeb':'#25D366'};">
                        ${m.sender ==='admin'?'️ خدمة العملاء (أبشر)':''+ chat.student_name}
                    </strong>
                    <!-- Message Actions Bar -->
                    <div style="display: flex; gap: 6px; font-size: 0.75rem; opacity: 0.8;">
                        <button type="button"onclick="quoteWaMessage(${idx})"title="الرد على هذه الرسالة"style="background:none; border:none; color:#fff; cursor:pointer; padding:0 2px;"><i class="fa-solid fa-reply"></i></button>
                        ${m.sender ==='admin'&& !m.deleted ? `
                            <button type="button"onclick="editWaMessage(${idx})"title="تعديل الرسالة"style="background:none; border:none; color:#fbbf24; cursor:pointer; padding:0 2px;"><i class="fa-solid fa-pen"></i></button>
                            <button type="button"onclick="deleteWaMessage(${idx})"title="حذف الرسالة"style="background:none; border:none; color:#ef4444; cursor:pointer; padding:0 2px;"><i class="fa-solid fa-trash"></i></button>
                        ` :''}
                    </div>
                </div>

                <!-- Quoted Message Preview inside bubble -->
                ${m.quoteText ? `
                    <div style="background: rgba(0,0,0,0.25); border-left: 3px solid #25D366; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem; color: rgba(255,255,255,0.8);">
                        <strong style="color: #25D366; display: block; font-size: 0.75rem;">↩️ رد على ${m.quoteSender ==='admin'?'خدمة العملاء': chat.student_name}:</strong>
                        ${m.quoteText}
                    </div>
                ` :''}

                <!-- Attachment / Video / Voice / Text Display -->
                ${m.type ==='image'? `
                    <img src="${formatChatMediaUrl(m.imageUrl)}"onclick="openImageLightbox('${formatChatMediaUrl(m.imageUrl)}')"style="max-width: 100%; max-height: 220px; border-radius: 8px; display: block; margin: 6px 0; border: 1px solid rgba(255,255,255,0.2); object-fit: cover; cursor: pointer; transition: transform 0.2s;"onmouseover="this.style.transform='scale(1.02)'"onmouseout="this.style.transform='scale(1)'"title="اضغط لفتح الصورة بحجم كامل">
                ` :''}
                ${m.type ==='link'? `
                    <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 14px; border-radius: 10px; margin: 6px 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-link"style="font-size: 1.3rem; color: #60a5fa;"></i>
                        <div style="overflow: hidden;">
                            <strong style="display: block; font-size: 0.85rem; color: #60a5fa;">رابط مرفق</strong>
                            <a href="${m.imageUrl || (m.text && m.text.replace('رابط مرفق:',''))}"target="_blank"style="color: #93c5fd; font-size: 0.85rem; text-decoration: underline; word-break: break-all;">${m.imageUrl || (m.text && m.text.replace('رابط مرفق:',''))}</a>
                        </div>
                    </div>
                ` :''}
                ${(m.type ==='video'|| (m.imageUrl && (m.imageUrl.endsWith('.mp4') || m.imageUrl.endsWith('.webm') || m.imageUrl.endsWith('.mov') || isEmbeddableVideo(m.imageUrl)))) ? `
                    <div style="margin: 6px 0;">
                        ${isEmbeddableVideo(m.imageUrl) ? `
                            <iframe src="${getEmbedUrl(m.imageUrl)}"style="width: 100%; height: 220px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); display: block;"allowfullscreen></iframe>
                        ` : `
                            <video src="${m.imageUrl}"controls style="max-width: 100%; max-height: 250px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); outline: none; display: block;"></video>
                        `}
                    </div>
                ` :''}

                ${m.type ==='voice'? `
                    <div style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.25); padding: 8px 14px; border-radius: 20px; margin: 6px 0; min-width: 180px;">
                        <i class="fa-solid fa-circle-play"style="font-size: 1.8rem; color: #25D366; cursor: pointer;"onclick="showToast('▶️ جاري تشغيل التسجيل الصوتي...')"></i>
                        <div style="flex: 1;">
                            <div style="height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; position: relative;">
                                <div style="width: 40%; height: 100%; background: #25D366; border-radius: 2px;"></div>
                            </div>
                            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.7); display: block; margin-top: 4px;">0:15 / 0:30</span>
                        </div>
                    </div>
                ` :''}

                ${(m.type !=='image'&& m.type !=='video'&& m.type !=='link') ? `
                <div style="color: ${m.deleted ?'#ef4444':'inherit'}; font-style: ${m.deleted ?'italic':'normal'};">
                    ${m.text}
                </div>
                ` :''}

                <div style="text-align: left; font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-top: 4px;">
                    ${m.time} ${m.sender ==='admin'?'<i class="fa-solid fa-check-double"style="color: #53bdeb;"></i>':''}
                </div>
            </div>
        </div>
    `).join('');

    setTimeout(() => {
        thread.scrollTop = thread.scrollHeight;
    }, 50);
}

function quoteWaMessage(idx) {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat || !chat.messages[idx]) return;

    currentQuoteIndex = idx;
    const msg = chat.messages[idx];
    const quoteBar = document.getElementById('waQuoteBar');
    const quoteTextSpan = document.getElementById('waQuoteText');

    if (quoteBar && quoteTextSpan) {
        quoteTextSpan.textContent = `"${msg.text}"`;
        quoteBar.style.display ='flex';
        document.getElementById('waReplyInput').focus();
    }
}

function cancelWaQuote() {
    currentQuoteIndex = null;
    const quoteBar = document.getElementById('waQuoteBar');
    if (quoteBar) quoteBar.style.display ='none';
}

function editWaMessage(idx) {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat || !chat.messages[idx]) return;

    const currentText = chat.messages[idx].text.replace('(معدلة)','');
    const newText = prompt('️ تعديل نص الرسالة:', currentText);
    if (newText !== null && newText.trim() !=='') {
        chat.messages[idx].text = newText.trim() +'(معدلة)';
        renderWaThread(chat);
        showToast('تم تعديل الرسالة بنجاح ️');
    }
}

function deleteWaMessage(idx) {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat || !chat.messages[idx]) return;

    if (confirm('هل أنت متأكد من رغبتك في مسح هذه الرسالة؟')) {
        chat.messages[idx].text ='تم حذف هذه الرسالة من قبل خدمة العملاء';
        chat.messages[idx].deleted = true;
        renderWaThread(chat);
        showToast('تم حذف الرسالة بنجاح ️');
    }
}

function blockWaStudent() {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;

    if (confirm(`هل أنت متأكد من حظر الطالب (${chat.student_name}) وإغلاق الشات؟`)) {
        chat.status ='محظور';
        if (!chat.messages) chat.messages = [];
        chat.messages.push({
            sender:'admin',
            text:'تم حظر هذا الحساب من قبل إدارة خدمة العملاء ولن يتم استقبال رسائل جديدة.',
            time:'الآن'});
        chat.last_msg ='تم حظر الطالب';
        renderWaThread(chat);
        renderChats();
        showToast('تم حظر الطالب وإغلاق المحادثة بنجاح');
    }
}

function showWaStudentProfile() {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;

    document.getElementById('profileModalName').textContent = chat.student_name;
    document.getElementById('profileModalUni').textContent =''+ chat.student_uni;
    document.getElementById('profileModalPhone').textContent = chat.phone;
    
    // Set a consistent photo based on student name or avatar
    const photos = ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80','https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'];
    document.getElementById('profileModalImg').src = photos[chat.id % photos.length];

    openModal('studentProfileModal');
}

function triggerWaAttachment() {
    const fileInput = document.getElementById('waImageFileInput');
    if (fileInput) fileInput.click();
}

function triggerWaAttachmentUrl() {
    const chatId = parseInt(document.getElementById('waActiveChatId')?.value || document.getElementById('activeChatId')?.value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) {
        showToast('يرجى تحديد محادثة أولاً');
        return;
    }

    const linkUrl = prompt('أدخل الرابط (Link) الذي تريد إرساله للطالب (مثال: رابط موقع أو ملف أونلاين):','https://');
    if (linkUrl && linkUrl.trim() !==''&& linkUrl.trim() !=='https://') {
        sendCustomWaMessage({
            type:'link',
            text: ` رابط مرفق: ${linkUrl.trim()}`,
            imageUrl: linkUrl.trim()
        });
    }
}

async function handleWaImageUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const chatId = parseInt(document.getElementById('waActiveChatId')?.value || document.getElementById('activeChatId')?.value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) {
        showToast('يرجى تحديد محادثة أولاً');
        return;
    }

    showToast('⏳ جاري ضغط وتحميل الصورة للمستخدم...');
    const compressed = await compressImageClientSide(file, 1100, 0.80);
    const formData = new FormData();
    formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/,"") +'.jpg');

    let finalUrl ='';
    try {
        const res = await fetch('../api/upload.php', { method:'POST', body: formData });
        const data = await res.json();
        if (data.status ==='success') {
            finalUrl = formatChatMediaUrl(data.url);
        } else if (compressed.dataUrl) {
            finalUrl = compressed.dataUrl;
        }
    } catch (err) {
        if (compressed.dataUrl) {
            finalUrl = compressed.dataUrl;
        }
    }

    if (finalUrl) {
        await sendCustomWaMessage({
            type:'image',
            text:'صورة مرفقة من خدمة العملاء (أبشر)',
            imageUrl: finalUrl
        });
        showToast('تم رفع الصورة وإرسالها للطالب بنجاح! ️');
        input.value ='';
    } else {
        showToast('فشل رفع الصورة');
    }
}

async function handleModalImageUpload(input) {
    await handleWaImageUpload(input);
}

function triggerModalVideoAttachment() {
    triggerWaVideoAttachment();
}

function triggerWaVideoAttachment() {
    showToast('ميزة إرفاق الفيديو تحت التطوير حالياً، يمكنك إرفاق رابط صورة أو تحميل صورة مباشرة');
}

function openImageLightbox(url) {
    const imgEl = document.getElementById('lightboxImg');
    const modal = document.getElementById('imageLightboxModal');
    if (imgEl && modal) {
        imgEl.src = url;
        modal.style.display ='flex';
    }
}

function recordWaVoiceNote() {
    showToast('جاري تسجيل فويس نوت... (تحدث الآن )');
    setTimeout(() => {
        sendCustomWaMessage({
            type:'voice',
            text:'فويس نوت صوتي مسجل (شرح تفاصيل السكن والحجز)'});
        showToast('تم إرسال التسجيل الصوتي بنجاح');
    }, 1500);
}

async function sendCustomWaMessage(msgData) {
    const chatId = parseInt(document.getElementById('waActiveChatId')?.value || document.getElementById('activeChatId')?.value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=send_chat_reply`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                chat_id: chatId,
                text: msgData.text,
                type: msgData.type ||'text',
                image_url: msgData.imageUrl ||''
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadDashboardData();
            // Optional: re-select the chat to show new messages
        } else {
            showToast('فشل في إرسال الرسالة');
        }
    } catch(e) {
        console.error(e);
        showToast('خطأ في الاتصال بالخادم');
    }
}

function sendWaQuickReply(replyText) {
    const input = document.getElementById('waReplyInput');
    if (input) {
        input.value = replyText;
        input.focus();
    }
}

async function handleSendWaReply(e) {
    e.preventDefault();
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const input = document.getElementById('waReplyInput');
    const replyText = input.value.trim();

    if (!replyText) return;

    const chat = appData.chats.find(c => c.id === chatId);
    if (chat) {
        let qText ='';
        let qSender ='';
        // Attach Quoted Reply if active
        if (currentQuoteIndex !== null && chat.messages && chat.messages[currentQuoteIndex]) {
            qText = chat.messages[currentQuoteIndex].text;
            qSender = chat.messages[currentQuoteIndex].sender;
            cancelWaQuote();
        }

        try {
            const res = await window.authFetch(`${API_URL}?action=send_chat_reply`, {
                method:'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    chat_id: chatId,
                    text: replyText,
                    quote_text: qText,
                    quote_sender: qSender
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                input.value ='';
                await loadDashboardData();
                showToast('تم إرسال ردك إلى الطالب وحفظه في السيرفر!');
            } else {
                showToast('فشل في إرسال الرسالة');
            }
        } catch(err) {
            console.error(err);
            showToast('خطأ في الاتصال بالخادم');
        }
    }
}

// Toast
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}

// Render Georgia News List
function renderNews() {
    const container = document.getElementById('newsTableBody');
    if (!container) return;

    if (!appData.news || appData.news.length === 0) {
        container.innerHTML = `<tr><td colspan="6"style="text-align: center; color: var(--text-muted);">لا يوجد أخبار أو تنبيهات منشورة حالياً </td></tr>`;
        return;
    }

    const sorted = [...appData.news].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
        return timeB - timeA;
    });

    container.innerHTML = sorted.map((item, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>
                <img src="${resolveImgUrl(item.image_url) ||'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=150&q=80'}"style="width: 60px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);"onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=150&q=80'">
            </td>
            <td style="font-weight: bold; color: var(--accent-amber);">${item.title}</td>
            <td style="max-width: 400px; white-space: normal; word-break: break-word; line-height: 1.5; color: var(--text-muted); font-size: 0.9rem;"title="${item.content}">${item.content}</td>
            <td>${item.date || item.created_at ||'الآن'}</td>
            <td>
                <button class="btn"style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer;"onclick="handleDeleteNews(${item.id})">
                    <i class="fa-solid fa-trash-can"></i> حذف
                </button>
            </td>
        </tr>
    `).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

// Add news alert
async function handleAddNews(e) {
    e.preventDefault();
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const imageUrl = document.getElementById('newsImage').value.trim();

    if (!title || !content) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=add_news`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ title, content, image_url: imageUrl })
        });
        const result = await res.json();
        if (result.status ==='success') {
            await loadDashboardData();
            closeModal('newsModal');
            document.getElementById('newsForm').reset();
            showToast(result.message || 'تم نشر الخبر بنجاح!');
        } else {
            showToast('خطأ: ' + (result.message || ''));
        }
    } catch(err) {
        console.error(err);
        showToast('خطأ في الاتصال بالخادم');
    }
}

// Delete news alert
async function handleDeleteNews(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً؟')) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=delete_news`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            showToast(result.message || 'تم حذف الخبر بنجاح ️');
        } else {
            showToast('خطأ: ' + (result.message || ''));
        }
    } catch(err) {
        console.error(err);
        showToast('خطأ في الاتصال بالخادم');
    }
}

// Render Georgia Notifications List
function renderNotifications() {
    const container = document.getElementById('notificationsTableBody');
    if (!container) return;

    if (!appData.notifications || appData.notifications.length === 0) {
        container.innerHTML = `<tr><td colspan="6"style="text-align: center; color: var(--text-muted);">لا يوجد تنبيهات عاجلة منشورة حالياً </td></tr>`;
        return;
    }

    const sorted = [...appData.notifications].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
        return timeB - timeA;
    });

    container.innerHTML = sorted.map((item, idx) => {
        // Calculate if notification is active (less than 48 hours old)
        let isExpired = false;
        if (item.created_at) {
            const timeCreated = new Date(item.created_at).getTime();
            const now = new Date().getTime();
            if (now - timeCreated > 48 * 60 * 60 * 1000) {
                isExpired = true;
            }
        }
        const statusBadge = isExpired
            ? `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">منتهي الصلاحية (مضى 48 ساعة) </span>`
            : `<span style="background: rgba(37, 211, 102, 0.18); color: #25D366; border: 1px solid #25D366; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">نشط وفعال للطالب </span>`;

        return `
            <tr>
                <td>${idx + 1}</td>
                <td style="font-weight: bold; color: var(--accent-amber);">${item.title}</td>
                <td style="max-width: 400px; white-space: normal; word-break: break-word; line-height: 1.5; color: var(--text-muted); font-size: 0.9rem;"title="${item.content}">${item.content}</td>
                <td>${item.date || item.created_at ||'الآن'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn"style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer;"onclick="handleDeleteNotification(${item.id})">
                        <i class="fa-solid fa-trash-can"></i> حذف
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof walkAndTranslate ==='function'&& currentLang ==='en') walkAndTranslate(document.body);
}

// Add notification
async function handleAddNotification(e) {
    e.preventDefault();
    const title = document.getElementById('notifTitle').value.trim();
    const content = document.getElementById('notifContent').value.trim();

    if (!title || !content) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=add_notification`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ title, content })
        });
        const result = await res.json();
        if (result.status ==='success') {
            await loadDashboardData();
            closeModal('notificationModal');
            document.getElementById('notificationForm').reset();
            showToast(result.message || 'تم نشر التنبيه بنجاح');
        } else {
            showToast('خطأ: ' + (result.message || ''));
        }
    } catch(err) {
        console.error(err);
        showToast('خطأ في الاتصال بالخادم');
    }
}

// Delete notification
async function handleDeleteNotification(id) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا التنبيه نهائياً؟')) return;

    try {
        const res = await window.authFetch(`${API_URL}?action=delete_notification`, {
            method:'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (result.status === 'success') {
            await loadDashboardData();
            showToast(result.message || 'تم حذف التنبيه بنجاح ️');
        } else {
            showToast('خطأ: ' + (result.message || ''));
        }
    } catch(err) {
        console.error(err);
        showToast('خطأ في الاتصال بالخادم');
    }
}

function isEmbeddableVideo(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('drive.google.com');
}

function getEmbedUrl(url) {
    if (!url) return'';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId ='';
        if (url.includes('v=')) {
            const parts = url.split('v=');
            if (parts.length > 1) videoId = parts[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            const parts = url.split('youtu.be/');
            if (parts.length > 1) videoId = parts[1].split('?')[0];
        } else if (url.includes('embed/')) {
            const parts = url.split('embed/');
            if (parts.length > 1) videoId = parts[1].split('?')[0];
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('drive.google.com')) {
        let driveId ='';
        if (url.includes('/d/')) {
            const parts = url.split('/d/');
            if (parts.length > 1) driveId = parts[1].split('/')[0];
        } else if (url.includes('id=')) {
            const parts = url.split('id=');
            if (parts.length > 1) driveId = parts[1].split('&')[0];
        }
        if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    return url;
}
