import os

inits = {
    'js/modules/apartments.js': """
export function initApartmentsModule() {
    const list = document.getElementById('apartmentsList');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action === 'deleteApartment') {
                deleteApartment(btn.getAttribute('data-id'));
            } else if (action === 'copyPhone') {
                navigator.clipboard.writeText(btn.getAttribute('data-phone'));
                showToast('تم نسخ رقم المالك بنجاح');
            }
        });
        list.dataset.bound = 'true';
    }

    const form = document.getElementById('aptForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddApartment);
        form.dataset.bound = 'true';
    }
}
""",
    'js/modules/services.js': """
export function initServicesModule() {
    const list = document.getElementById('servicesList');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.getAttribute('data-action') === 'deleteService') {
                deleteService(btn.getAttribute('data-id'));
            }
        });
        list.dataset.bound = 'true';
    }

    const form = document.getElementById('svcForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddService);
        form.dataset.bound = 'true';
    }
}
""",
    'js/modules/students.js': """
export function initStudentsModule() {
    const table = document.getElementById('studentsTableBody');
    if (table && !table.dataset.bound) {
        table.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action === 'deleteStudent') {
                deleteStudent(btn.getAttribute('data-id'));
            } else if (action === 'openPointsModal') {
                openPointsModal(btn.getAttribute('data-id'), btn.getAttribute('data-name'), btn.getAttribute('data-points'));
            }
        });
        table.dataset.bound = 'true';
    }

    const form = document.getElementById('addStudentForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddStudent);
        form.dataset.bound = 'true';
    }

    const pointsForm = document.getElementById('pointsForm');
    if (pointsForm && !pointsForm.dataset.bound) {
        pointsForm.addEventListener('submit', handlePointsSubmit);
        pointsForm.dataset.bound = 'true';
    }
}
""",
    'js/modules/districts.js': """
export function initDistrictsModule() {
    const list = document.getElementById('districtsTableBody');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.getAttribute('data-action') === 'deleteDistrict') {
                deleteDistrict(btn.getAttribute('data-id'));
            }
        });
        list.dataset.bound = 'true';
    }

    const form = document.getElementById('districtForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddDistrict);
        form.dataset.bound = 'true';
    }
}
""",
    'js/modules/universities.js': """
export function initUniversitiesModule() {
    const list = document.getElementById('universitiesTableBody');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn && btn.getAttribute('data-action') === 'deleteUniversity') {
                deleteUniversity(btn.getAttribute('data-id'));
            }
        });
        list.addEventListener('change', (e) => {
            const target = e.target;
            if (target.getAttribute('data-action') === 'toggleUniTime') {
                toggleUniTime(target, target.getAttribute('data-id'));
            }
        });
        list.dataset.bound = 'true';
    }

    const form = document.getElementById('uniForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddUniversity);
        form.dataset.bound = 'true';
    }
}
""",
    'js/modules/chats.js': """
export function initChatsModule() {
    const list = document.getElementById('chatsList');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn && btn.getAttribute('data-action') === 'selectWaChat') {
                selectWaChat(btn.getAttribute('data-id'));
            }
        });
        list.dataset.bound = 'true';
    }

    const messages = document.getElementById('chatMessagesThread');
    if (messages && !messages.dataset.bound) {
        messages.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action === 'quoteWaMessage') quoteWaMessage(btn.getAttribute('data-id'));
            else if (action === 'editWaMessage') editWaMessage(btn.getAttribute('data-id'));
            else if (action === 'deleteWaMessage') deleteWaMessage(btn.getAttribute('data-id'));
            else if (action === 'openImageLightbox') openImageLightbox(btn.getAttribute('data-img'));
            else if (action === 'showToast') showToast(btn.getAttribute('data-msg'));
        });
        messages.dataset.bound = 'true';
    }

    const replyForm = document.getElementById('chatReplyForm');
    if (replyForm && !replyForm.dataset.bound) {
        replyForm.addEventListener('submit', handleSendChatReply);
        replyForm.dataset.bound = 'true';
    }
}
""",
    'js/modules/requests.js': """
export function initRequestsModule() {
    const list = document.getElementById('requestsTableBody');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn && btn.getAttribute('data-action') === 'jumpToChat') {
                jumpToChat(btn.getAttribute('data-phone'), btn.getAttribute('data-name'));
            }
        });
        list.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT' && e.target.hasAttribute('data-action')) {
                updateRequestStatus(e.target.getAttribute('data-id'), e.target.value);
            }
        });
        list.dataset.bound = 'true';
    }
}
""",
    'js/modules/news.js': """
export function initNewsModule() {
    const list = document.getElementById('newsListContainer');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn && btn.getAttribute('data-action') === 'handleDeleteNews') {
                handleDeleteNews(btn.getAttribute('data-id'));
            }
        });
        list.dataset.bound = 'true';
    }

    const form = document.getElementById('newsForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddNews);
        form.dataset.bound = 'true';
    }
}
""",
    'js/modules/notifications.js': """
export function initNotificationsModule() {
    const list = document.getElementById('notificationsTableBody');
    if (list && !list.dataset.bound) {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn && btn.getAttribute('data-action') === 'handleDeleteNotification') {
                handleDeleteNotification(btn.getAttribute('data-id'));
            }
        });
        list.dataset.bound = 'true';
    }

    const form = document.getElementById('notificationForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAddNotification);
        form.dataset.bound = 'true';
    }
}
""",
    'js/modules/reviews.js': """
export function initReviewsModule() {
    // Reviews currently doesn't have inline handlers in the HTML rendering, 
    // but we add init for consistency.
}
""",
    'js/modules/dashboard.js': """
export function initDashboardModule() {
    // Stats rendered statically. 
}
"""
}

base = 'backend_php/admin/'
for file, code in inits.items():
    filepath = os.path.join(base, file)
    if os.path.exists(filepath):
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(code)

print("Inits appended")
