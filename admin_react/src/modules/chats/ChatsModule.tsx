import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChats } from '../../hooks/useChats';
import { ChatConversation, ChatMessage } from '../../types/chat';
import { useI18n } from '../../lib/i18n';
import { getMediaUrl, hasMedia } from '../../lib/media';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export function ChatsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student_id');

  const { chats, isLoading, error, sendReply, editMessage, deleteMessage, deleteConversation } = useChats();

  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Reply Composer State
  const [inputText, setInputText] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Message Editing State
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editMsgText, setEditMsgText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Deep-Link /chats?student_id=X
  useEffect(() => {
    if (studentIdParam && chats.length > 0) {
      const targetStudentId = parseInt(studentIdParam, 10);
      if (!isNaN(targetStudentId)) {
        const found = chats.find((c) => c.student_id === targetStudentId);
        if (found) {
          setSelectedChatId(found.id);
        }
      }
    }
  }, [studentIdParam, chats]);

  // Set default selection if none selected and chats exist
  useEffect(() => {
    if (selectedChatId === null && chats.length > 0 && !studentIdParam) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId, studentIdParam]);

  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === selectedChatId) || null;
  }, [chats, selectedChatId]);

  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
    }
  }, [activeChat]);

  const filteredChats = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => {
      const matchName = (c.student_name || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchMsg = (c.last_msg || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchMsg;
    });
  }, [chats, searchTerm]);

  const isAttentionRequired = (c: ChatConversation) => {
    const st = (c.status || '').trim();
    if (st === 'رسالة جديدة' || st === 'قيد الانتظار' || st === 'جديد') return true;
    if (c.messages.length > 0) {
      const lastMsg = c.messages[c.messages.length - 1];
      return lastMsg && (lastMsg.sender === 'student');
    }
    return false;
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
        quote_sender: replyingToMessage ? (replyingToMessage.sender === 'admin' ? 'الإدارة' : activeChat.student_name) : undefined,
      });

      if (res.success) {
        setInputText('');
        setAttachedImageUrl('');
        setReplyingToMessage(null);
        scrollToBottom();
      } else {
        showToast(res.error || t('msg.error_send_msg'), 'error');
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
      showToast(t('msg.msg_edited'), 'success');
      setEditingMsg(null);
      setEditMsgText('');
    } else {
      showToast(res.error || t('msg.error_edit_msg'), 'error');
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
      showToast(t('msg.msg_deleted'), 'success');
    } else {
      showToast(res.error || t('msg.error_delete_msg'), 'error');
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
      showToast(t('msg.chat_deleted'), 'success');
      if (selectedChatId === c.id) {
        setSelectedChatId(null);
      }
    } else {
      showToast(res.error || t('msg.error_delete_chat'), 'error');
    }
  };

  return (
    <section className="section active" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      {/* Module Header */}
      <div className="section-header" style={{ marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2>{t('chats.title')}</h2>
          <p>{t('chats.desc')}</p>
        </div>
      </div>

      {/* Deep Link Not Found Warning */}
      {studentIdParam && !activeChat && !isLoading && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fbbf24',
            fontSize: '0.85rem',
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>لم يتم العثور على محادثة سابقة للطالب رقم #{studentIdParam}. يمكنك اختيار محادثة أخرى من القائمة.</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '14px',
          flex: 1,
          minHeight: 0,
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
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
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
                    onClick={() => setSelectedChatId(c.id)}
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
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        display: 'flex',
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
                              padding: '1px 5px',
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
          }}
        >
          {activeChat ? (
            <>
              {/* Active Chat Header */}
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    {activeChat.student_name ? activeChat.student_name.charAt(0).toUpperCase() : 'ط'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {activeChat.student_name}
                      {activeChat.student_id ? ` (#${activeChat.student_id})` : ''}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {activeChat.phone} {activeChat.student_uni ? `• ${activeChat.student_uni}` : ''}
                    </span>
                  </div>
                </div>

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
                    gap: '4px',
                  }}
                  title={t('chats.delete_chat')}
                >
                  <i className="fa-solid fa-trash" style={{ fontSize: '0.7rem' }}></i>
                  <span>{t('chats.delete_chat')}</span>
                </button>
              </div>

              {/* Messages Area */}
              <div
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
                            background: m.deleted
                              ? 'rgba(239, 68, 68, 0.08)'
                              : isAdmin
                              ? 'linear-gradient(135deg, #4f46e5, #4338ca)'
                              : 'var(--bg-card)',
                            color: m.deleted ? '#f87171' : '#f8fafc',
                            border: m.deleted
                              ? '1px dashed rgba(239, 68, 68, 0.3)'
                              : isAdmin
                              ? '1px solid #4338ca'
                              : '1px solid var(--border-color)',
                            borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            padding: '10px 14px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                          }}
                        >
                          {/* Quote Context Preview if any */}
                          {m.quoteText && !m.deleted && (
                            <div
                              style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRight: isRtl ? '3px solid #fbbf24' : 'none',
                                borderLeft: !isRtl ? '3px solid #fbbf24' : 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginBottom: '6px',
                                fontSize: '0.72rem',
                                opacity: 0.85,
                              }}
                            >
                              <strong style={{ display: 'block', color: '#fbbf24', fontSize: '0.7rem' }}>
                                {m.quoteSender || 'رد على:'}
                              </strong>
                              <span>{m.quoteText}</span>
                            </div>
                          )}

                          {/* Image Attachment if any */}
                          {m.type === 'image' && hasMedia(m.imageUrl) && !m.deleted && (
                            <div style={{ marginBottom: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                              <img
                                src={getMediaUrl(m.imageUrl)}
                                alt="Chat Attachment"
                                style={{ maxWidth: '240px', maxHeight: '180px', objectFit: 'cover', display: 'block', borderRadius: '6px' }}
                              />
                            </div>
                          )}

                          {/* Message Text */}
                          <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.45, fontStyle: m.deleted ? 'italic' : 'normal' }}>
                            {m.text}
                          </p>

                          {/* Action icons on hover / inline */}
                          {!m.deleted && (
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
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
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
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                                    title={t('chats.edit_msg')}
                                  >
                                    <i className="fa-solid fa-pen"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMsg(m)}
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                                    title={t('chats.delete_msg')}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                          {m.time || ''}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner Preview */}
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
                    onClick={() => setAttachedImageUrl('')}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem', marginRight: 'auto' }}
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Reply Input Box */}
              <form
                onSubmit={handleSendReply}
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-card)',
                  flexShrink: 0,
                }}
              >
                <label
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="إرفاق صورة"
                >
                  <i className="fa-solid fa-image"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('chats.type_message')}
                  disabled={isSending}
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    padding: '0 12px',
                    fontSize: '0.85rem',
                  }}
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSending || (!inputText.trim() && !attachedImageUrl)}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                  }}
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
            <h4 style={{ margin: '0 0 12px', color: 'var(--text-main)' }}>{t('chats.edit_msg')}</h4>
            <textarea
              className="form-control"
              value={editMsgText}
              onChange={(e) => setEditMsgText(e.target.value)}
              rows={3}
              style={{ width: '100%', borderRadius: '8px', padding: '10px', resize: 'vertical', marginBottom: '14px' }}
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
    </section>
  );
}
