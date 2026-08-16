import { useState, useMemo } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { Student } from '../../types/student';
import { StudentCard } from './StudentCard';
import { AddStudentModal } from './AddStudentModal';
import { ManagePointsModal } from './ManagePointsModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { AdminMetaModal } from './AdminMetaModal';
import { BlockedIdentitiesModal } from './BlockedIdentitiesModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function StudentsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const {
    students,
    blockedIdentities,
    isLoading,
    error,
    refetch,
    addStudent,
    changePassword,
    updatePoints,
    updateAdminMeta,
    blockStudent,
    unblockStudent,
    unblockIdentity,
    deleteStudent,
  } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [pointsStudent, setPointsStudent] = useState<Student | null>(null);
  const [passwordStudent, setPasswordStudent] = useState<Student | null>(null);
  const [metaStudent, setMetaStudent] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) =>
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.university && s.university.toLowerCase().includes(q)) ||
      (s.nationality && s.nationality.toLowerCase().includes(q)) ||
      (s.admin_status && s.admin_status.toLowerCase().includes(q)) ||
      String(s.id) === q
    );
  }, [students, searchQuery]);

  const uniqueBlockedCount = useMemo(() => {
    const studentIds = new Set<number>();
    let orphanCount = 0;
    blockedIdentities.forEach((item) => {
      if (item.source_student_id && item.source_student_id > 0) {
        studentIds.add(item.source_student_id);
      } else {
        orphanCount++;
      }
    });
    students.forEach((s) => {
      if (s.is_blocked) {
        studentIds.add(s.id);
      }
    });
    return studentIds.size + orphanCount;
  }, [blockedIdentities, students]);

  const handleToggleBlock = async (student: Student) => {
    const isCurrentlyBlocked = !!student.is_blocked;

    if (isCurrentlyBlocked) {
      const confirmed = await confirm({
        title: t('dialog.unblock_student_title'),
        message: `${t('dialog.unblock_student_msg')} (${student.full_name})`,
        confirmText: t('students.unblock_btn'),
        cancelText: t('btn.cancel'),
        variant: 'primary',
      });

      if (!confirmed) return;

      const res = await unblockStudent(student.id);
      if (res.success) {
        showToast(t('msg.student_unblocked'), 'success');
      } else {
        showToast(res.error || t('msg.error_unblock_student'), 'error');
      }
    } else {
      const confirmed = await confirm({
        title: t('dialog.block_student_title'),
        message: `${t('dialog.block_student_msg')} (${student.full_name})`,
        confirmText: t('students.block_btn'),
        cancelText: t('btn.cancel'),
        variant: 'danger',
      });

      if (!confirmed) return;

      const res = await blockStudent(student.id, 'حظر بواسطة الإدارة');
      if (res.success) {
        showToast(t('msg.student_blocked'), 'success');
      } else {
        showToast(res.error || t('msg.error_block_student'), 'error');
      }
    }
  };

  const handleDelete = async (student: Student) => {
    const confirmed = await confirm({
      title: t('dialog.delete_student_title'),
      message: `${t('dialog.delete_student_msg')} (${student.full_name})`,
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    const res = await deleteStudent(student.id);
    if (res.success) {
      showToast(t('msg.student_deleted'), 'success');
    } else {
      showToast(res.error || t('msg.error_delete_student'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-users" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('students.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.85rem' }}>
            {t('students.desc')}
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Blocked Identities Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsBlockedModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <i className="fa-solid fa-shield-halved" style={{ color: '#ef4444' }}></i>
            <span>{t('students.blocked_list_btn')}</span>
            {uniqueBlockedCount > 0 && (
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {uniqueBlockedCount}
              </span>
            )}
          </button>

          {/* Add Student Button */}
          <button
            type="button"
            className="btn btn-glow"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>{t('students.add_student')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Total Counter */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 320px',
            maxWidth: '520px',
          }}
        >
          {/* Integrated Search Icon */}
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.9rem',
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          ></i>

          {/* Premium Dark Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('students.search_placeholder')}
            style={{
              width: '100%',
              height: '40px',
              paddingRight: isRtl ? '38px' : '34px',
              paddingLeft: isRtl ? '34px' : '38px',
              borderRadius: '10px',
              border: isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none',
              boxShadow: isFocused
                ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.15s ease',
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                [isRtl ? 'left' : 'right']: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'var(--text-muted)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                lineHeight: 1,
              }}
              title={t('btn.cancel')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Count Badge */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '6px 14px',
            borderRadius: '16px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {t('students.count', { count: filteredStudents.length })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '10px' }}></i>
          <p style={{ fontSize: '0.9rem' }}>{t('students.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444', marginBottom: '20px' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x" style={{ marginBottom: '8px' }}></i>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: '10px' }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredStudents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-user-slash fa-2x" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '12px' }}></i>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{t('students.empty_state')}</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ marginTop: '12px', padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-plus"></i> {t('students.add_student')}
          </button>
        </div>
      )}

      {/* Students Grid */}
      {!isLoading && !error && filteredStudents.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onManagePoints={(s) => setPointsStudent(s)}
              onAdminMeta={(s) => setMetaStudent(s)}
              onResetPassword={(s) => setPasswordStudent(s)}
              onToggleBlock={handleToggleBlock}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addStudent}
        showToast={showToast}
      />

      {/* Manage Points Modal */}
      <ManagePointsModal
        isOpen={!!pointsStudent}
        student={pointsStudent}
        onClose={() => setPointsStudent(null)}
        onSubmit={updatePoints}
        showToast={showToast}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!passwordStudent}
        student={passwordStudent}
        onClose={() => setPasswordStudent(null)}
        onSubmit={changePassword}
        showToast={showToast}
      />

      {/* Admin Meta (Status / Note) Modal */}
      <AdminMetaModal
        isOpen={!!metaStudent}
        student={metaStudent}
        onClose={() => setMetaStudent(null)}
        onSubmit={updateAdminMeta}
        showToast={showToast}
      />

      {/* Blocked Identities List Modal */}
      <BlockedIdentitiesModal
        isOpen={isBlockedModalOpen}
        blockedIdentities={blockedIdentities}
        students={students}
        onClose={() => setIsBlockedModalOpen(false)}
        onUnblockIdentity={unblockIdentity}
        onUnblockStudent={unblockStudent}
        showToast={showToast}
      />
    </section>
  );
}
