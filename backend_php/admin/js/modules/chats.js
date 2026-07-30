import { appData } from '../state.js';
import { showToast } from '../ui.js';

function formatChatMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('uploads/')) return '../' + url;
    return url;
}

function isEmbeddableVideo(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('drive.google.com');
}

function getEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
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
        let driveId = '';
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

let currentQuoteIndex = null;

export function renderChatsList() {
    const container = document.getElementById('chatsListColumn');
    const countSpan = document.getElementById('waChatCount');
    if (!container || !appData.chats) return;

    if (countSpan) {
        const unreplied = appData.chats.filter(
            c => !c.status.includes('تم الرد') && !c.status.includes('مكتمل')
        ).length;
        countSpan.textContent = unreplied;
    }

    // Helper to translate chat status
    const getTranslatedStatus = (status) => {
        if (!status) return '';
        const statusMap = {
            'جديدة': 'status.new_message',
            'رسالة جديدة': 'status.new_message',
            'تم الرد': 'status.replied',
            'مكتمل': 'status.completed',
            'محظور': 'status.blocked',
            'طلب جديد': 'status.new_request',
            'قيد المراجعة': 'status.under_review'
        };
        const key = statusMap[status] || statusMap[status.replace(' ️', '').trim()];
        return key ? t(key) : t(status);
    };

    container.innerHTML = appData.chats.map(chat => `
        <div class="wa-chat-item" id="waItem-${chat.id}"
             onclick="window.selectWaChatGlobal && window.selectWaChatGlobal(${chat.id})"
             style="padding: 14px 16px; background: var(--bg-main); border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; gap: 12px; align-items: center; transition: background 0.2s;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 1.3rem; flex-shrink: 0;">
                ${chat.student_name.charAt(0)}
            </div>
            <div style="flex: 1; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <h4 style="margin: 0; font-size: 1.05rem; font-weight: bold; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${chat.student_name}</h4>
                    <span style="font-size: 0.75rem; color: #25D366; font-weight: bold;">${chat.time && chat.time !== 'الآن' ? chat.time : t('status.now')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                        ${chat.last_msg}
                    </p>
                    <span style="font-size: 0.75rem; background: ${chat.status.includes('جديدة') ? '#25D366' : 'rgba(255,255,255,0.1)'}; color: ${chat.status.includes('جديدة') ? '#fff' : 'var(--text-muted)'}; padding: 2px 8px; border-radius: 10px; font-weight: bold;">
                        ${getTranslatedStatus(chat.status)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');

    const activeIdEl = document.getElementById('waActiveChatId');
    if (appData.chats.length > 0 && (!activeIdEl || !activeIdEl.value)) {
        setTimeout(() => window.selectWaChatGlobal && window.selectWaChatGlobal(appData.chats[0].id), 100);
    } else if (activeIdEl && activeIdEl.value) {
        const activeId = parseInt(activeIdEl.value);
        const activeChat = appData.chats.find(c => c.id === activeId);
        if (activeChat) renderWaThread(activeChat);
    }
}

export function renderChats() {
    renderChatsList();
}

export function selectWaChat(chatId) {
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;

    document.querySelectorAll('.wa-chat-item').forEach(el => {
        el.style.background = 'var(--bg-main)';
        el.style.borderLeft = 'none';
    });
    const selectedItem = document.getElementById(`waItem-${chatId}`);
    if (selectedItem) {
        selectedItem.style.background = 'rgba(37,211,102,0.12)';
        selectedItem.style.borderLeft = '4px solid #25D366';
    }

    document.getElementById('waNoSelection').style.display = 'none';
    document.getElementById('waHeader').style.display = 'flex';
    document.getElementById('waMessagesThread').style.display = 'flex';
    if (document.getElementById('waQuickBar')) document.getElementById('waQuickBar').style.display = 'flex';
    document.getElementById('waInputForm').style.display = 'flex';

    document.getElementById('waActiveChatId').value = chat.id;
    document.getElementById('waAvatar').textContent = chat.student_name.charAt(0);
    document.getElementById('waStudentName').textContent = chat.student_name;
    document.getElementById('waStudentUni').textContent = '' + chat.student_uni;
    document.getElementById('waPhone').textContent = '' + chat.phone;

    const cleanPhone = chat.phone.replace(/[^0-9]/g, '');
    document.getElementById('waDirectBtn').href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(t('messages.whatsapp_template', {name: chat.student_name}))}`;

    renderWaThread(chat);
}

export function renderWaThread(chat) {
    const thread = document.getElementById('waMessagesThread');
    if (!thread) return;

    if (!chat.messages || chat.messages.length === 0) {
        chat.messages = [
            { sender: 'student', text: chat.last_msg || t('messages.default_last_msg'), time: chat.time || 'الآن' }
        ];
    }

    thread.innerHTML = chat.messages.map((m, idx) => {
        const quoteSenderName = m.quoteSender === 'admin' ? t('customer_service_absher') : chat.student_name;
        return `
        <div style="display: flex; flex-direction: column; align-items: ${m.sender === 'admin' ? 'flex-end' : 'flex-start'};">
            <div style="max-width: 75%; padding: 10px 16px; border-radius: 12px; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.2); ${m.sender === 'admin' ? 'background: #005c4b; color: #fff; border-top-left-radius: 2px;' : 'background: #202c33; color: #e9edef; border-top-right-radius: 2px;'}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 15px;">
                    <strong style="font-size: 0.78rem; color: ${m.sender === 'admin' ? '#53bdeb' : '#25D366'};">
                        ${m.sender === 'admin' ? t('customer_service_absher') : '' + chat.student_name}
                    </strong>
                    <div style="display: flex; gap: 6px; font-size: 0.75rem; opacity: 0.8;">
                        <button type="button" onclick="window.quoteWaMessageGlobal && window.quoteWaMessageGlobal(${idx})" title="${t('dialog.reply_to_message')}" style="background:none; border:none; color:#fff; cursor:pointer; padding:0 2px;"><i class="fa-solid fa-reply"></i></button>
                        ${m.sender === 'admin' && !m.deleted ? `
                            <button type="button" onclick="window.editWaMessageGlobal && window.editWaMessageGlobal(${idx})" title="${t('dialog.edit_chat_msg_title')}" style="background:none; border:none; color:#fbbf24; cursor:pointer; padding:0 2px;"><i class="fa-solid fa-pen"></i></button>
                            <button type="button" onclick="window.deleteWaMessageGlobal && window.deleteWaMessageGlobal(${idx})" title="${t('dialog.delete_chat_msg_title')}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:0 2px;"><i class="fa-solid fa-trash"></i></button>
                        ` : ''}
                    </div>
                </div>
                ${m.quoteText ? `
                    <div style="background: rgba(0,0,0,0.25); border-left: 3px solid #25D366; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem; color: rgba(255,255,255,0.8);">
                        <strong style="color: #25D366; display: block; font-size: 0.75rem;">${t('dialog.reply_to_sender', {sender: quoteSenderName})}</strong>
                        ${m.quoteText}
                    </div>
                ` : ''}
                ${(m.type === 'image' || m.imageUrl || m.image_url) && (m.type !== 'video' && m.type !== 'link') ? `
                    <img src="${formatChatMediaUrl(m.imageUrl || m.image_url)}"
                         onclick="window.openImageLightboxGlobal && window.openImageLightboxGlobal('${formatChatMediaUrl(m.imageUrl || m.image_url)}')"
                         style="max-width: 100%; max-height: 220px; border-radius: 8px; display: block; margin: 6px 0; object-fit: cover; cursor: pointer;">
                ` : ''}
                ${m.type === 'link' ? `
                    <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 14px; border-radius: 10px; margin: 6px 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-link" style="font-size: 1.3rem; color: #60a5fa;"></i>
                        <div style="overflow: hidden;">
                            <strong style="display: block; font-size: 0.85rem; color: #60a5fa;">${t('messages.attached_link')}</strong>
                            <a href="${m.imageUrl || m.text}" target="_blank" style="color: #93c5fd; font-size: 0.85rem; text-decoration: underline; word-break: break-all;">${m.imageUrl || m.text}</a>
                        </div>
                    </div>
                ` : ''}
                ${(m.type === 'video' || (m.imageUrl && (m.imageUrl.endsWith('.mp4') || m.imageUrl.endsWith('.webm') || m.imageUrl.endsWith('.mov') || isEmbeddableVideo(m.imageUrl)))) ? `
                    <div style="margin: 6px 0;">
                        ${isEmbeddableVideo(m.imageUrl) ? `
                            <iframe src="${getEmbedUrl(m.imageUrl)}" style="width: 100%; height: 220px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); display: block;" allowfullscreen></iframe>
                        ` : `
                            <video src="${m.imageUrl}" controls style="max-width: 100%; max-height: 250px; border-radius: 10px; outline: none; display: block;"></video>
                        `}
                    </div>
                ` : ''}
                ${(m.type !== 'image' && m.type !== 'video' && m.type !== 'link') ? `
                <div style="color: ${m.deleted ? '#ef4444' : 'inherit'}; font-style: ${m.deleted ? 'italic' : 'normal'};">
                    ${m.text}
                </div>
                ` : ''}
                <div style="text-align: left; font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-top: 4px;">
                    ${m.time} ${m.sender === 'admin' ? '<i class="fa-solid fa-check-double" style="color: #53bdeb;"></i>' : ''}
                </div>
            </div>
        </div>
    `).join('');

    setTimeout(() => { thread.scrollTop = thread.scrollHeight; }, 50);
}

export function quoteWaMessage(idx) {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat || !chat.messages[idx]) return;
    currentQuoteIndex = idx;
    const msg = chat.messages[idx];
    const quoteBar = document.getElementById('waQuoteBar');
    const quoteTextSpan = document.getElementById('waQuoteText');
    if (quoteBar && quoteTextSpan) {
        quoteTextSpan.textContent = `"${msg.text}"`;
        quoteBar.style.display = 'flex';
        document.getElementById('waReplyInput').focus();
    }
}

export function cancelWaQuote() {
    currentQuoteIndex = null;
    const quoteBar = document.getElementById('waQuoteBar');
    if (quoteBar) quoteBar.style.display = 'none';
}

export async function editWaMessage(idx) {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat || !chat.messages[idx]) return;
    const currentText = chat.messages[idx].text.replace('(معدلة)', '').replace('(Edited)', '');
    const newText = await window.showPromptDialog({
        title: t('dialog.edit_chat_msg_title'),
        message: t('dialog.edit_chat_msg_msg'),
        defaultValue: currentText,
        placeholder: t('dialog.edit_chat_msg_placeholder')
    });
    if (newText !== null && newText.trim() !== '') {
        chat.messages[idx].text = newText.trim() + ' (' + t('status.edited') + ')';
        renderWaThread(chat);
        showToast(t('messages.chat_msg_edited'));
    }
}

export async function deleteWaMessage(idx) {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat || !chat.messages[idx]) return;
    const confirmed = await window.showConfirmDialog({
        title: t('dialog.delete_chat_msg_title'),
        message: t('dialog.delete_chat_msg_msg'),
        confirmText: t('buttons.delete'),
        cancelText: t('buttons.cancel'),
        variant: 'danger'
    });
    if (confirmed) {
        chat.messages[idx].text = t('messages.chat_msg_deleted_placeholder');
        chat.messages[idx].deleted = true;
        renderWaThread(chat);
        showToast(t('messages.chat_msg_deleted'));
    }
}

export async function blockWaStudent() {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;
    const confirmed = await window.showConfirmDialog({
        title: t('dialog.block_student_title'),
        message: t('dialog.block_student_msg', {name: chat.student_name}),
        confirmText: t('buttons.block'),
        cancelText: t('buttons.cancel'),
        variant: 'danger'
    });
    if (confirmed) {
        chat.status = 'محظور';
        if (!chat.messages) chat.messages = [];
        chat.messages.push({
            sender: 'admin',
            text: t('messages.student_blocked_system_msg'),
            time: t('status.now')
        });
        chat.last_msg = t('messages.student_blocked');
        renderWaThread(chat);
        renderChatsList();
        showToast(t('messages.student_blocked'));
    }
}

export function showWaStudentProfile() {
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;
    document.getElementById('profileModalName').textContent = chat.student_name;
    document.getElementById('profileModalUni').textContent = '' + chat.student_uni;
    document.getElementById('profileModalPhone').textContent = chat.phone;
    // Use initials-based avatar instead of Unsplash
    const avatarEl = document.getElementById('profileModalImg');
    if (avatarEl) {
        avatarEl.style.display = 'none';
    }
    const initialsEl = document.getElementById('profileModalInitials');
    if (initialsEl) {
        initialsEl.textContent = chat.student_name.charAt(0).toUpperCase();
    }
    window.openModalGlobal && window.openModalGlobal('studentProfileModal');
}

export function sendWaQuickReply(replyText) {
    const input = document.getElementById('waReplyInput');
    if (input) {
        input.value = replyText;
        input.focus();
    }
}

export async function handleSendWaReply(e) {
    e.preventDefault();
    const chatId = parseInt(document.getElementById('waActiveChatId').value);
    const input = document.getElementById('waReplyInput');
    const replyText = input.value.trim();
    if (!replyText) return;

    const chat = appData.chats.find(c => c.id === chatId);
    if (chat) {
        let qText = '';
        let qSender = '';
        if (currentQuoteIndex !== null && chat.messages && chat.messages[currentQuoteIndex]) {
            qText = chat.messages[currentQuoteIndex].text;
            qSender = chat.messages[currentQuoteIndex].sender;
            cancelWaQuote();
        }
        try {
            const res = await window.authFetch(`../api/chat/admin_reply.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    content: replyText,
                    quote_text: qText,
                    quote_sender: qSender
                })
            });
            const data = await res.json();
            if (data.status === 'success' || data.success === true) {
                input.value = '';
                // Reload all data from backend to show new message
                const { loadDashboardData } = await import('../api.js');
                await loadDashboardData();
                showToast(t('messages.chat_reply_sent'));
            } else {
                showToast(t('messages.chat_reply_failed'));
            }
        } catch (err) {
            console.error(err);
            showToast(t('messages.conn_error'));
        }
    }
}

export async function sendCustomWaMessage(msgData) {
    const chatId = parseInt(document.getElementById('waActiveChatId')?.value || document.getElementById('activeChatId')?.value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) return;
    try {
        const res = await window.authFetch(`../api/chat/admin_reply.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                content: msgData.text,
                message_type: msgData.type || 'text',
                image_url: msgData.imageUrl || ''
            })
        });
        const data = await res.json();
        if (data.status === 'success' || data.success === true) {
            const { loadDashboardData } = await import('../api.js');
            await loadDashboardData();
        } else {
            showToast(t('messages.chat_reply_failed'));
        }
    } catch (ex) {
        console.error(ex);
        showToast(t('messages.conn_error'));
    }
}

export async function triggerWaAttachmentUrl() {
    const chatId = parseInt(document.getElementById('waActiveChatId')?.value || document.getElementById('activeChatId')?.value);
    const chat = appData.chats.find(c => c.id === chatId);
    if (!chat) { showToast(t('messages.select_chat_first')); return; }
    const linkUrl = await window.showPromptDialog({
        title: t('dialog.send_link_title'),
        message: t('dialog.send_link_msg'),
        defaultValue: 'https://',
        placeholder: 'https://example.com'
    });
    if (linkUrl && linkUrl.trim() !== '' && linkUrl.trim() !== 'https://') {
        sendCustomWaMessage({ type: 'link', text: t('messages.attached_link') + ': ' + linkUrl.trim(), imageUrl: linkUrl.trim() });
    }
}

export function recordWaVoiceNote() {
    showToast(t('messages.recording_voice'));
    setTimeout(() => {
        sendCustomWaMessage({ type: 'voice', text: t('messages.recorded_voice') });
        showToast(t('messages.voice_note_sent'));
    }, 1500);
}

export function initChatsModule() {
    const waInputForm = document.getElementById('waInputForm');
    if (waInputForm) {
        waInputForm.addEventListener('submit', handleSendWaReply);
    }

    // 1. WhatsApp Chat Panel Attachment Buttons & File Input
    const waAttachImgBtn = document.getElementById('waAttachImgBtn');
    const waImageFileInput = document.getElementById('waImageFileInput');
    const waAttachUrlBtn = document.getElementById('waAttachUrlBtn');

    if (waAttachImgBtn && waImageFileInput) {
        waAttachImgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LOG] waAttachImgBtn clicked -> triggering waImageFileInput.click()');
            waImageFileInput.click();
        });

        waImageFileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            console.log(`[LOG] waImageFileInput change -> File: ${file.name}, Size: ${file.size} bytes`);

            showToast(t('messages.compressing_image'));
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'chat');

            try {
                const res = await window.authFetch('../api/upload/image.php?folder=chat', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                console.log('[LOG] Upload API response:', data);
                if (data.status === 'success' || data.success === true) {
                    const imgUrl = data.url || data.data?.url;
                    await sendCustomWaMessage({
                        type: 'image',
                        text: t('messages.image_attached_cs'),
                        imageUrl: imgUrl
                    });
                    showToast(t('messages.image_sent_success'));
                } else {
                    showToast(t('messages.upload_image_failed', {message: data.message || t('unspecified')}));
                }
            } catch (err) {
                console.error('[ERROR] Error uploading chat image:', err);
                showToast(t('messages.error_uploading_image'));
            }
        });
    }

    if (waAttachUrlBtn) {
        waAttachUrlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerWaAttachmentUrl();
        });
    }

    // 2. Modal Chat Attachment Buttons
    const modalAttachImgBtn = document.getElementById('modalAttachImgBtn');
    const modalImageFileInput = document.getElementById('modalImageFileInput');

    if (modalAttachImgBtn && modalImageFileInput) {
        modalAttachImgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modalImageFileInput.click();
        });

        modalImageFileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            showToast(t('messages.compressing_image'));
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'chat');

            try {
                const res = await window.authFetch('../api/upload/image.php?folder=chat', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.status === 'success' || data.success === true) {
                    const imgUrl = data.url || data.data?.url;
                    await sendCustomWaMessage({
                        type: 'image',
                        text: t('messages.image_attached_cs'),
                        imageUrl: imgUrl
                    });
                    showToast(t('messages.image_sent_success'));
                } else {
                    showToast(t('messages.upload_image_failed', {message: data.message || t('unspecified')}));
                }
            } catch (err) {
                console.error(err);
                showToast(t('messages.error_uploading_image'));
            }
        });
    }

    window.selectWaChatGlobal = selectWaChat;
    window.quoteWaMessageGlobal = quoteWaMessage;
    window.editWaMessageGlobal = editWaMessage;
    window.deleteWaMessageGlobal = deleteWaMessage;
    window.cancelWaQuoteGlobal = cancelWaQuote;
    window.blockWaStudentGlobal = blockWaStudent;
    window.showWaStudentProfileGlobal = showWaStudentProfile;
    window.sendWaQuickReplyGlobal = sendWaQuickReply;
    window.sendCustomWaMessageGlobal = sendCustomWaMessage;
    window.triggerWaAttachmentUrlGlobal = triggerWaAttachmentUrl;
    window.recordWaVoiceNoteGlobal = recordWaVoiceNote;
}
