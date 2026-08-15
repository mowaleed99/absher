import { useState, useEffect, useMemo } from 'react';
import { BlockedIdentity, Student } from '../../types/student';
import { useI18n } from '../../lib/i18n';

interface BlockedIdentitiesModalProps {
  isOpen: boolean;
  blockedIdentities: BlockedIdentity[];
  students: Student[];
  onClose: () => void;
  onUnblockIdentity: (id: number) => Promise<{ success: boolean; error?: string }>;
  onUnblockStudent: (studentId: number) => Promise<{ success: boolean; error?: string }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface GroupedStudentBlock {
  type: 'student';
  studentId: number;
  studentName: string;
  identities: BlockedIdentity[];
  reason: string | null;
  createdAt: string;
}

interface OrphanedBlock {
  type: 'orphan';
  identity: BlockedIdentity;
}

type DisplayBlockItem = GroupedStudentBlock | OrphanedBlock;

export function BlockedIdentitiesModal({
  isOpen,
  blockedIdentities,
  students,
  onClose,
  onUnblockIdentity,
  onUnblockStudent,
  showToast,
}: BlockedIdentitiesModalProps) {
  const { t } = useI18n();
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Group identities by source_student_id where relationship exists
  const groupedItems = useMemo<DisplayBlockItem[]>(() => {
    const studentMap = new Map<number, Student>();
    students.forEach((s) => studentMap.set(s.id, s));

    const studentGroups = new Map<number, BlockedIdentity[]>();
    const orphans: BlockedIdentity[] = [];

    blockedIdentities.forEach((item) => {
      if (item.source_student_id && item.source_student_id > 0) {
        const existing = studentGroups.get(item.source_student_id) || [];
        existing.push(item);
        studentGroups.set(item.source_student_id, existing);
      } else {
        orphans.push(item);
      }
    });

    const items: DisplayBlockItem[] = [];

    studentGroups.forEach((idents, sId) => {
      const studentObj = studentMap.get(sId);
      const studentName = studentObj ? studentObj.full_name : `طالب مسجل (#${sId})`;
      const reason = idents.find((i) => i.reason)?.reason || null;
      const createdAt = idents[0]?.created_at || '';

      items.push({
        type: 'student',
        studentId: sId,
        studentName,
        identities: idents,
        reason,
        createdAt,
      });
    });

    orphans.forEach((ident) => {
      items.push({
        type: 'orphan',
        identity: ident,
      });
    });

    return items;
  }, [blockedIdentities, students]);

  if (!isOpen) return null;

  const handleUnblockGroup = async (studentId: number) => {
    const key = `student_${studentId}`;
    setProcessingKey(key);
    try {
      const res = await onUnblockStudent(studentId);
      if (res.success) {
        showToast(t('msg.student_unblocked'), 'success');
      } else {
        showToast(res.error || t('msg.error_unblock_student'), 'error');
      }
    } finally {
      setProcessingKey(null);
    }
  };

  const handleUnblockSingle = async (identityId: number) => {
    const key = `ident_${identityId}`;
    setProcessingKey(key);
    try {
      const res = await onUnblockIdentity(identityId);
      if (res.success) {
        showToast(t('msg.identity_unblocked'), 'success');
      } else {
        showToast(res.error || t('msg.error_unblock_student'), 'error');
      }
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('students.blocked_modal_title')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('students.blocked_modal_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
              borderRadius: '6px',
            }}
            title={t('btn.close')}
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1 }}>
          {groupedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-shield-check fa-3x" style={{ color: '#34d399', opacity: 0.5, marginBottom: '12px' }}></i>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('students.no_blocked')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {groupedItems.map((item) => {
                if (item.type === 'student') {
                  const isProcessing = processingKey === `student_${item.studentId}`;
                  return (
                    <div
                      key={`student_${item.studentId}`}
                      style={{
                        background: 'var(--bg-main)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {/* Top Header: Student Title + Full Unblock Action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            حساب طالب
                          </span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {item.studentName}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleUnblockGroup(item.studentId)}
                          disabled={isProcessing}
                          style={{
                            height: '30px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {isProcessing ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-lock-open"></i>
                          )}
                          <span>إلغاء حظر الحساب بالكامل</span>
                        </button>
                      </div>

                      {/* Grouped Identifiers List */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
                        {item.identities.map((ident) => (
                          <div
                            key={ident.id}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <i
                              className={`fa-solid ${ident.identifier_type === 'email' ? 'fa-envelope' : 'fa-phone'}`}
                              style={{
                                color: ident.identifier_type === 'email' ? '#60a5fa' : '#34d399',
                                fontSize: '0.75rem',
                              }}
                            ></i>
                            <span style={{ color: 'var(--text-main)', direction: 'ltr', fontWeight: 600 }}>
                              {ident.identifier_value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Reason & Date Meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {item.reason ? (
                          <span>السبب: {item.reason}</span>
                        ) : (
                          <span>حظر بواسطة الإدارة</span>
                        )}
                        <span>{item.createdAt ? item.createdAt.split(' ')[0] : '—'}</span>
                      </div>
                    </div>
                  );
                } else {
                  // Orphaned Block Entry
                  const isProcessing = processingKey === `ident_${item.identity.id}`;
                  return (
                    <div
                      key={`ident_${item.identity.id}`}
                      style={{
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: item.identity.identifier_type === 'email' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: item.identity.identifier_type === 'email' ? '#60a5fa' : '#34d399',
                            border: `1px solid ${item.identity.identifier_type === 'email' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <i className={`fa-solid ${item.identity.identifier_type === 'email' ? 'fa-envelope' : 'fa-phone'}`} style={{ marginLeft: '4px' }}></i>
                          {item.identity.identifier_type === 'email' ? 'بريد محظور (مستقل)' : 'هاتف محظور (مستقل)'}
                        </span>

                        <div>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', direction: 'ltr', display: 'block' }}>
                            {item.identity.identifier_value}
                          </strong>
                          {item.identity.reason && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              السبب: {item.identity.reason}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.identity.created_at ? item.identity.created_at.split(' ')[0] : '—'}
                        </span>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleUnblockSingle(item.identity.id)}
                          disabled={isProcessing}
                          style={{
                            height: '28px',
                            padding: '0 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isProcessing ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-lock-open"></i>
                          )}
                          <span>{t('students.unblock_btn')}</span>
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
          >
            {t('btn.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
