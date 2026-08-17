import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChats } from '../../hooks/useChats';
import { ChatConversation, ChatMessage } from '../../types/chat';
import { useI18n } from '../../lib/i18n';
import { getMediaUrl, hasMedia } from '../../lib/media';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useBadges } from '../../contexts/BadgesContext';
import { apiFetch } from '../../lib/apiFetch';

export function ChatsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { refetchBadges } = useBadges();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student_id');
  const handledDeepLinkRef = useRef<string | null>(null);

  const {
    chats,
    isLoading,
    error,
    sendReply,
    editMessage,
    deleteMessage,
    deleteConversation,
    ensureSupportChat,
    refetch,
  } = useChats();

  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnsuringChat, setIsEnsuringChat] = useState(false);

  // Reply Composer State
  const [inputText, setInputText] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Message Editing State
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editMsgText, setEditMsgText] = useState('');

  // Student Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Lightbox Image Preview
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNearBottomRef = useRef<boolean>(true);
  const prevChatIdRef = useRef<number | null>(null);
  const prevLatestMsgIdRef = useRef<number | null>(null);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    isNearBottomRef.current = true;
    setHasUnreadBelow(false);
  };

  const handleThreadScroll = () => {
    if (!threadRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = threadRef.current;
    const isNear = scrollHeight - scrollTop - clientHeight < 100;
    isNearBottomRef.current = isNear;
    if (isNear) {
      setHasUnreadBelow(false);
    }
  };

  // Auto-expanding textarea height (starts at 48px, max 120px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 120)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && (inputText.trim() || attachedImageUrl)) {
        handleSendReply(e as unknown as React.FormEvent);
      }
    }
  };

  // Addendum A: Deep-Link /chats?student_id=X handled once on navigation without re-locking
  useEffect(() => {
    if (!studentIdParam) {
      handledDeepLinkRef.current = null;
      return;
    }

    if (handledDeepLinkRef.current === studentIdParam) return;

    const targetStudentId = parseInt(studentIdParam, 10);
    if (isNaN(targetStudentId) || targetStudentId <= 0) return;

    const found = chats.find((c) => c.student_id === targetStudentId);
    if (found) {
      setSelectedChatId(found.id);
      handledDeepLinkRef.current = studentIdParam;
      setTimeout(() => textareaRef.current?.focus(), 200);
    } else if (!isEnsuringChat && !isLoading) {
      setIsEnsuringChat(true);
      ensureSupportChat(targetStudentId).then((res) => {
        setIsEnsuringChat(false);
        handledDeepLinkRef.current = studentIdParam;
        if (res.success && res.chatId) {
          setSelectedChatId(res.chatId);
          setTimeout(() => textareaRef.current?.focus(), 200);
        } else {
          showToast(
            res.error || (isRtl ? 'لم يتم العثور على حساب الطالب أو قد تم حذفه' : 'Student account not found or deleted'),
            'error'
          );
          // Clear query param so user is not stuck on dead deep link
          setSearchParams({}, { replace: true });
          if (chats.length > 0) {
            setSelectedChatId(chats[0].id);
          }
        }
      });
    }
  }, [studentIdParam, chats, isLoading, isEnsuringChat, ensureSupportChat, isRtl, showToast, setSearchParams]);

  // Handle manual selection from conversations list
  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
    if (searchParams.has('student_id')) {
      setSearchParams({}, { replace: true });
      handledDeepLinkRef.current = null;
    }
  };

  // Set default selection or fallback if selectedChatId does not exist
  useEffect(() => {
    if (chats.length > 0) {
      if (selectedChatId === null) {
        if (!studentIdParam) {
          setSelectedChatId(chats[0].id);
        }
      } else {
        const exists = chats.some((c) => c.id === selectedChatId);
        if (!exists && !studentIdParam && !isEnsuringChat) {
          setSelectedChatId(chats[0].id);
        }
      }
    }
  }, [chats, selectedChatId, studentIdParam, isEnsuringChat]);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === selectedChatId) || null;
  }, [chats, selectedChatId]);

  // Smart Auto-Scroll: Only auto-scrolls on conversation change or when already near bottom
  useEffect(() => {
    if (!activeChat) return;

    const activeMessages = activeChat.messages ? activeChat.messages.filter((m) => !m.deleted) : [];
    const latestMsg = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1] : null;
    const latestMsgId = latestMsg ? latestMsg.id : null;

    // Case 1: Switched to a different conversation
    if (prevChatIdRef.current !== activeChat.id) {
      prevChatIdRef.current = activeChat.id;
      prevLatestMsgIdRef.current = latestMsgId;
      isNearBottomRef.current = true;
      setHasUnreadBelow(false);
      setTimeout(() => scrollToBottom('auto'), 50);
      return;
    }

    // Case 2: Same conversation, new message arrived from polling
    if (latestMsgId !== null && latestMsgId !== prevLatestMsgIdRef.current) {
      prevLatestMsgIdRef.current = latestMsgId;
      if (isNearBottomRef.current) {
        // Admin is at the bottom -> follow new message smoothly
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        // Admin is reading older messages -> preserve reading position, show indicator
        setHasUnreadBelow(true);
      }
    }
  }, [activeChat]);

  const filteredChats = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => {
      const matchName = (c.student_name || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchMsg = (c.last_msg || '').toLowerCase().includes(q);
      const matchUni = (c.student_uni || '').toLowerCase().includes(q);
      const matchId = c.student_id ? String(c.student_id).includes(q) : false;
      return matchName || matchPhone || matchMsg || matchUni || matchId;
    });
  }, [chats, searchTerm]);

  // Authoritative attention state: ONLY latest active non-deleted message sender === 'student'
  const isAttentionRequired = (c: ChatConversation) => {
    if (!Array.isArray(c.messages) || c.messages.length === 0) return false;
    const activeMessages = c.messages.filter((m) => !m.deleted);
    if (activeMessages.length === 0) return false;
    const lastMsg = activeMessages[activeMessages.length - 1];
    return lastMsg && lastMsg.sender === 'student';
  };

  // Safe reset of file input so the EXACT same file can be chosen repeatedly
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(isRtl ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file', 'error');
      resetFileInput();
      return;
    }

    // Try direct multipart upload to /api_staging/upload/image.php?folder=chat
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('adminToken');
      const uploadRes = await fetch('/api_staging/upload/image.php?folder=chat', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.success && uploadData.data?.url) {
        setAttachedImageUrl(uploadData.data.url);
        resetFileInput();
        return;
      }
    } catch {
      // Fallback to FileReader base64
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImageUrl(reader.result);
        resetFileInput();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachedImage = () => {
    setAttachedImageUrl('');
    resetFileInput();
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || isSending) return;

    const trimmed = inputText.trim();
    if (!trimmed && !attachedImageUrl) return;

    setIsSending(true);
    try {
      const res = await sendReply({
        chat_id: activeChat.id,
        content: trimmed,
        message_type: attachedImageUrl ? 'image' : 'text',
        image_url: attachedImageUrl || undefined,
        quote_text: replyingToMessage ? replyingToMessage.text : undefined,
        quote_sender: replyingToMessage
          ? replyingToMessage.sender === 'admin'
            ? 'الإدارة'
            : activeChat.student_name
          : undefined,
      });

      if (res.success) {
        setInputText('');
        setAttachedImageUrl('');
        setReplyingToMessage(null);
        resetFileInput();
        setTimeout(() => scrollToBottom('smooth'), 50);
        // Immediate attention badge invalidation
        refetchBadges();
      } else {
        showToast(res.error || (isRtl ? 'فشل إرسال الرسالة' : 'Failed to send message'), 'error');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMsg) return;
    const trimmed = editMsgText.trim();
    if (!trimmed) return;

    const res = await editMessage(editingMsg.id, trimmed);
    if (res.success) {
      showToast(isRtl ? 'تم تعديل الرسالة بنجاح' : 'Message edited successfully', 'success');
      setEditingMsg(null);
      setEditMsgText('');
      refetchBadges();
    } else {
      showToast(res.error || (isRtl ? 'فشل تعديل الرسالة' : 'Failed to edit message'), 'error');
    }
  };

  const handleDeleteMsg = async (m: ChatMessage) => {
    const ok = await confirm({
      title: t('dialog.delete_msg_title'),
      message: t('dialog.delete_msg_msg'),
      variant: 'danger',
    });
    if (!ok) return;

    const res = await deleteMessage(m.id);
    if (res.success) {
      showToast(isRtl ? 'تم حذف الرسالة بنجاح' : 'Message deleted successfully', 'success');
      refetchBadges();
    } else {
      showToast(res.error || (isRtl ? 'فشل حذف الرسالة' : 'Failed to delete message'), 'error');
    }
  };

  const handleDeleteChat = async (c: ChatConversation) => {
    const ok = await confirm({
      title: t('dialog.delete_chat_title'),
      message: t('dialog.delete_chat_msg'),
      variant: 'danger',
    });
    if (!ok) return;

    const res = await deleteConversation(c.id);
    if (res.success) {
      showToast(isRtl ? 'تم حذف المحادثة بالكامل بنجاح' : 'Conversation deleted successfully', 'success');
      if (selectedChatId === c.id) {
        setSelectedChatId(null);
      }
      refetchBadges();
    } else {
      showToast(res.error || (isRtl ? 'فشل حذف المحادثة' : 'Failed to delete conversation'), 'error');
    }
  };

  // Block / Unblock student directly from chat header using Phase 4 architecture
  const handleToggleBlockStudent = async (c: ChatConversation) => {
    if (!c.student_id) {
      showToast(isRtl ? 'لا يوجد معرف طالب مسجل لهذه المحادثة' : 'No student ID registered for this chat', 'error');
      return;
    }

    const ok = await confirm({
      title: t('dialog.block_student_title'),
      message: t('dialog.block_student_msg'),
      variant: 'danger',
    });
    if (!ok) return;

    const res = await apiFetch<Record<string, unknown>>('block_student', {
      student_id: c.student_id,
      reason: 'حظر من نافذة المحادثة المباشرة',
    });

    if (res.success) {
      showToast(isRtl ? 'تم حظر الطالب بنجاح' : 'Student blocked successfully', 'success');
      refetch();
    } else {
      showToast(res.error || (isRtl ? 'فشل حظر الطالب' : 'Failed to block student'), 'error');
    }
  };

  // Clean WhatsApp Link Generator with Pre-filled Template
  const getWhatsAppLink = (c: ChatConversation) => {
    let phoneClean = (c.phone || '').replace(/[^\d+]/g, '');
    if (phoneClean.startsWith('+')) {
      phoneClean = phoneClean.substring(1);
    }
    const template = `مرحباً ${c.student_name || 'طالبنا العزيز'}، بخصوص استفسارك عبر تطبيق أبشر جورجيا...`;
    return `https://wa.me/${phoneClean}?text=${encodeURIComponent(template)}`;
  };

  return (
    <section
      className="section active"
      style={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Module Header */}
      <div className="section-header" style={{ marginBottom: '8px', flexShrink: 0 }}>
        <div>
          <h2>{t('chats.title')}</h2>
          <p>{t('chats.desc')}</p>
        </div>
      </div>

      {/* Two Column Layout: Fill Remaining Viewport Height */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px minmax(0, 1fr)',
          gap: '14px',
          flex: 1,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* LEFT COLUMN: Conversations List */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('chats.search_placeholder')}
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#0d1527',
                  border: '1px solid #1e293b',
                  color: '#f8fafc',
                  padding: isRtl ? '0 32px 0 10px' : '0 10px 0 32px',
                  fontSize: '0.8rem',
                }}
              />
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  [isRtl ? 'right' : 'left']: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '0.75rem',
                }}
              ></i>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin fa-lg"></i>
                <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>جارِ التحميل...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: '#ef4444', fontSize: '0.8rem' }}>
                {error}
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('chats.empty_state')}
              </div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = c.id === selectedChatId;
                const needsAttention = isAttentionRequired(c);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChat(c.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {c.student_avatar ? (
                      <img
                        src={getMediaUrl(c.student_avatar)}
                        alt={c.student_name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        display: c.student_avatar ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {c.student_name ? c.student_name.charAt(0).toUpperCase() : 'ط'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong
                          style={{
                            fontSize: '0.85rem',
                            color: isSelected ? '#a5b4fc' : 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.student_name}
                        </strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {c.time ? c.time.split(' ')[0] : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {c.last_msg || '—'}
                        </p>

                        {needsAttention && (
                          <span
                            style={{
                              background: '#f59e0b',
                              color: '#0f172a',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            جديد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Thread */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
            position: 'relative',
          }}
        >
          {activeChat ? (
            <>
              {/* Active Chat Header */}
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)',
                  flexShrink: 0,
                  gap: '10px',
                }}
              >
                {/* Student Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div
                    onClick={() => setIsProfileModalOpen(true)}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                    title={t('chats.view_profile')}
                  >
                    {activeChat.student_avatar ? (
                      <img
                        src={getMediaUrl(activeChat.student_avatar)}
                        alt={activeChat.student_name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                          border: '2px solid rgba(99, 102, 241, 0.4)',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff',
                        display: activeChat.student_avatar ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    >
                      {activeChat.student_name ? activeChat.student_name.charAt(0).toUpperCase() : 'ط'}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {activeChat.student_name}
                      {activeChat.student_id ? (
                        <span style={{ fontSize: '0.75rem', color: '#818cf8', margin: '0 4px' }}>
                          (#{activeChat.student_id})
                        </span>
                      ) : null}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {activeChat.phone} {activeChat.student_uni ? `• ${activeChat.student_uni}` : ''}
                    </span>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {/* View Profile Button */}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setIsProfileModalOpen(true)}
                    style={{
                      height: '30px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title={t('chats.student_profile')}
                  >
                    <i className="fa-solid fa-user-graduate"></i>
                    <span>{t('chats.student_profile')}</span>
                  </button>

                  {/* WhatsApp Direct Link */}
                  {activeChat.phone && (
                    <a
                      href={getWhatsAppLink(activeChat)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        color: '#25d366',
                        border: '1px solid rgba(37, 211, 102, 0.25)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        textDecoration: 'none',
                      }}
                      title={t('btn.whatsapp')}
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                      <span>{t('btn.whatsapp')}</span>
                    </a>
                  )}

                  {/* Block Student */}
                  {activeChat.student_id && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleToggleBlockStudent(activeChat)}
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                      title={t('btn.block')}
                    >
                      <i className="fa-solid fa-ban"></i>
                      <span>{t('btn.block')}</span>
                    </button>
                  )}

                  {/* Delete Conversation */}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleDeleteChat(activeChat)}
                    style={{
                      height: '30px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title={t('chats.delete_chat')}
                  >
                    <i className="fa-solid fa-trash"></i>
                    <span>{t('chats.delete_chat')}</span>
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div
                ref={threadRef}
                onScroll={handleThreadScroll}
                className="custom-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--bg-main)',
                }}
              >
                {activeChat.messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    لا توجد رسائل في هذه المحادثة بعد.
                  </div>
                ) : (
                  activeChat.messages.map((m) => {
                    const isAdmin = m.sender === 'admin';
                    const isDeleted = !!m.deleted;

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isAdmin ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {/* Bubble */}
                        <div
                          style={{
                            background: isDeleted
                              ? 'rgba(255, 255, 255, 0.04)'
                              : isAdmin
                              ? 'linear-gradient(135deg, #4f46e5, #4338ca)'
                              : 'var(--bg-card)',
                            color: isDeleted ? 'var(--text-muted)' : '#f8fafc',
                            border: isDeleted
                              ? '1px dashed rgba(255, 255, 255, 0.15)'
                              : isAdmin
                              ? '1px solid #4338ca'
                              : '1px solid var(--border-color)',
                            borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            padding: '10px 14px',
                            boxShadow: isDeleted ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                          }}
                        >
                          {/* Sender Label */}
                          {!isDeleted && (
                            <div style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px', color: isAdmin ? '#93c5fd' : '#25D366', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {!isAdmin && activeChat.student_avatar ? (
                                <img
                                  src={getMediaUrl(activeChat.student_avatar)}
                                  alt=""
                                  style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', display: 'inline-block' }}
                                />
                              ) : !isAdmin ? (
                                <i className="fa-solid fa-user-graduate" style={{ fontSize: '0.72rem' }} />
                              ) : (
                                <i className="fa-solid fa-headset" style={{ fontSize: '0.72rem' }} />
                              )}
                              <span>{isAdmin ? 'خدمة العملاء (أبشر)' : activeChat.student_name}</span>
                            </div>
                          )}

                          {/* Quote Context Preview */}
                          {!isDeleted && m.quoteText && (
                            <div
                              style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRight: isRtl ? '3px solid #fbbf24' : 'none',
                                borderLeft: !isRtl ? '3px solid #fbbf24' : 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginBottom: '6px',
                                fontSize: '0.72rem',
                                opacity: 0.9,
                              }}
                            >
                              <strong style={{ display: 'block', color: '#fbbf24', fontSize: '0.7rem' }}>
                                {m.quoteSender || 'رد على:'}
                              </strong>
                              <span>{m.quoteText}</span>
                            </div>
                          )}

                          {/* Image Attachment (Click to open lightbox) */}
                          {!isDeleted && m.type === 'image' && hasMedia(m.imageUrl) && (
                            <div
                              onClick={() => setLightboxImageUrl(getMediaUrl(m.imageUrl!))}
                              style={{
                                marginBottom: '6px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                              }}
                            >
                              <img
                                src={getMediaUrl(m.imageUrl)}
                                alt="Chat Attachment"
                                style={{
                                  maxWidth: '240px',
                                  maxHeight: '180px',
                                  objectFit: 'cover',
                                  display: 'block',
                                  borderRadius: '6px',
                                }}
                              />
                            </div>
                          )}

                          {/* Message Text or Localized Deleted Tombstone */}
                          {isDeleted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontStyle: 'italic', fontSize: '0.8rem', color: '#94a3b8' }}>
                              <i className="fa-solid fa-ban" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                              <span>{t('chats.deleted_message')}</span>
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.45 }}>
                              {m.text}
                            </p>
                          )}

                          {/* Action icons (hidden when deleted) */}
                          {!isDeleted && (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '6px',
                                marginTop: '4px',
                                paddingTop: '4px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setReplyingToMessage(m)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                                title={t('chats.reply_to')}
                              >
                                <i className="fa-solid fa-reply"></i>
                              </button>

                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMsg(m);
                                      setEditMsgText(m.text);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'rgba(255, 255, 255, 0.7)',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      padding: 0,
                                    }}
                                    title={t('chats.edit_msg')}
                                  >
                                    <i className="fa-solid fa-pen"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMsg(m)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'rgba(239, 68, 68, 0.8)',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      padding: 0,
                                    }}
                                    title={t('chats.delete_msg')}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Double Check */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', padding: '0 4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          <span>{m.time || ''}</span>
                          {isAdmin && !isDeleted && (
                            <i className="fa-solid fa-check-double" style={{ color: '#53bdeb', fontSize: '0.65rem' }}></i>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating New Messages Indicator */}
              {hasUnreadBelow && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '82px',
                    [isRtl ? 'left' : 'right']: '24px',
                    zIndex: 50,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => scrollToBottom('smooth')}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), #4338ca)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-arrow-down" style={{ fontSize: '0.75rem' }}></i>
                    <span>{t('chats.new_messages_below')}</span>
                  </button>
                </div>
              )}

              {/* Replying Banner */}
              {replyingToMessage && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    borderTop: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#a5b4fc',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <i className="fa-solid fa-reply"></i>
                    <span>الرد على ({replyingToMessage.sender === 'admin' ? 'الإدارة' : activeChat.student_name}): </span>
                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyingToMessage.text.slice(0, 40)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Image Preview Banner */}
              {hasMedia(attachedImageUrl) && (
                <div
                  style={{
                    background: 'var(--bg-main)',
                    borderTop: '1px solid var(--border-color)',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={getMediaUrl(attachedImageUrl)}
                    alt="Preview"
                    style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>صورة مرفقة مع الرد</span>
                  <button
                    type="button"
                    onClick={handleRemoveAttachedImage}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem', marginRight: 'auto' }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Reply Input Box (Scoped WhatsApp / Telegram style bar) */}
              <form className="chat-composer" onSubmit={handleSendReply}>
                <button
                  type="button"
                  className="chat-composer-btn-attach"
                  onClick={() => {
                    resetFileInput();
                    fileInputRef.current?.click();
                  }}
                  title="إرفاق صورة"
                >
                  <i className="fa-solid fa-paperclip" style={{ fontSize: '1.05rem' }}></i>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  style={{ display: 'none' }}
                />

                <textarea
                  ref={textareaRef}
                  className="chat-composer-textarea custom-scrollbar"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chats.type_message')}
                  disabled={isSending}
                  rows={1}
                  dir={isRtl ? 'rtl' : 'ltr'}
                />

                <button
                  type="submit"
                  className="chat-composer-btn-send"
                  disabled={isSending || (!inputText.trim() && !attachedImageUrl)}
                >
                  {isSending ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <>
                      <i className={`fa-solid ${isRtl ? 'fa-paper-plane' : 'fa-paper-plane'}`}></i>
                      <span>{t('chats.send_btn')}</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-comments fa-3x" style={{ opacity: 0.3, marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('chats.select_chat')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Message Modal */}
      {editingMsg && (
        <div
          className="modal-overlay active"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingMsg(null);
          }}
        >
          <div
            className="modal-box"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '18px',
            }}
          >
            <h4 style={{ margin: '0 0 12px', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}>
              {t('chats.edit_msg')}
            </h4>
            <textarea
              className="form-control"
              value={editMsgText}
              onChange={(e) => setEditMsgText(e.target.value)}
              rows={3}
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{
                width: '100%',
                borderRadius: '8px',
                padding: '10px',
                resize: 'vertical',
                marginBottom: '14px',
                background: '#0d1527',
                border: '1px solid #1e293b',
                color: '#f8fafc',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingMsg(null)}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem' }}
              >
                {t('btn.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveEdit}
                style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}
              >
                {t('btn.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {isProfileModalOpen && activeChat && (
        <div
          className="modal-overlay active"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProfileModalOpen(false);
          }}
        >
          <div
            className="modal-box"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '440px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {t('chats.student_profile')}
              </h3>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {activeChat.student_avatar ? (
                <img
                  src={getMediaUrl(activeChat.student_avatar)}
                  alt={activeChat.student_name}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    margin: '0 auto 10px',
                    display: 'block',
                    border: '3px solid var(--primary)',
                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.3)',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'inline-flex';
                    }
                  }}
                />
              ) : null}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  display: activeChat.student_avatar ? 'none' : 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: '0 auto 10px',
                  border: '3px solid var(--primary)',
                }}
              >
                {activeChat.student_name ? activeChat.student_name.charAt(0).toUpperCase() : 'ط'}
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {activeChat.student_name}
              </h4>
              {activeChat.student_id && (
                <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>
                  معرف الطالب: #{activeChat.student_id}
                </span>
              )}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>الجامعة:</span>
                <strong style={{ color: 'var(--text-main)' }}>{activeChat.student_uni || 'غير محدد'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>رقم الهاتف:</span>
                <strong style={{ color: 'var(--text-main)', direction: 'ltr' }}>{activeChat.phone || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>آخر تحديث:</span>
                <strong style={{ color: 'var(--text-main)' }}>{activeChat.time || '—'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsProfileModalOpen(false)}
                style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '0.82rem' }}
              >
                {t('btn.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {lightboxImageUrl && (
        <div
          className="modal-overlay active"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setLightboxImageUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={lightboxImageUrl}
              alt="Full view"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
            />
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.8rem',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
