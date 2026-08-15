import { Student } from '../../types/student';
import { useI18n } from '../../lib/i18n';

interface StudentCardProps {
  student: Student;
  onManagePoints: (student: Student) => void;
  onAdminMeta: (student: Student) => void;
  onResetPassword: (student: Student) => void;
  onToggleBlock: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export function StudentCard({
  student,
  onManagePoints,
  onAdminMeta,
  onResetPassword,
  onToggleBlock,
  onDelete,
}: StudentCardProps) {
  const { t } = useI18n();
  const isBlocked = !!student.is_blocked;

  return (
    <div
      className="item-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '14px',
        border: isBlocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: isBlocked ? '0 2px 10px rgba(239, 68, 68, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Top Header Row: ID + Full Name + Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              padding: '2px 7px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            #{student.id}
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: '0.98rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={student.full_name}
          >
            {student.full_name}
          </h3>
        </div>

        {/* Badges Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {/* Blocked Badge */}
          {isBlocked && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <i className="fa-solid fa-ban" style={{ fontSize: '0.68rem' }}></i>
              <span>{t('students.blocked_badge')}</span>
            </span>
          )}

          {/* Points Badge */}
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '16px',
              fontSize: '0.78rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <i className="fa-solid fa-coins" style={{ fontSize: '0.72rem' }}></i>
            <span>{student.points || 0} نقطة</span>
          </span>
        </div>
      </div>

      {/* Admin Status Pill & Note Preview (if present) */}
      {(student.admin_status || student.admin_note) && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '8px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            {student.admin_status && (
              <span
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--primary)',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {student.admin_status}
              </span>
            )}
            {student.admin_note && (
              <span
                style={{
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={student.admin_note}
              >
                <i className="fa-solid fa-note-sticky" style={{ marginLeft: '4px', opacity: 0.7 }}></i>
                {student.admin_note}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAdminMeta(student)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.72rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            تعديل
          </button>
        </div>
      )}

      {/* Student Meta Rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          padding: '2px 0',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-envelope" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('students.email')}
          </span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600, direction: 'ltr', fontSize: '0.8rem' }}>
            {student.email || '—'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-phone" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('students.phone')}
          </span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600, direction: 'ltr' }}>
            {student.phone || '—'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-flag" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('students.nationality')}
          </span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
            {student.nationality || '—'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <i className="fa-solid fa-university" style={{ fontSize: '0.72rem', opacity: 0.7 }}></i>
            {t('students.university')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={student.university}>
            {student.university || '—'}
          </span>
        </div>
      </div>

      {/* Action Footer (2 Tiers) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {/* Primary Row: Manage Points + Admin Meta */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => onManagePoints(student)}
            style={{
              flex: 1,
              height: '32px',
              padding: '0 8px',
              borderRadius: '7px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <i className="fa-solid fa-coins"></i>
            <span>{t('students.manage_points')}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => onAdminMeta(student)}
            style={{
              flex: 1,
              height: '32px',
              padding: '0 8px',
              borderRadius: '7px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <i className="fa-solid fa-clipboard-user"></i>
            <span>{t('students.admin_meta')}</span>
          </button>
        </div>

        {/* Secondary Icons Row: Password, Block/Unblock, Delete */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
          {/* Change Password Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onResetPassword(student)}
            style={{
              height: '30px',
              padding: '0 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={t('students.reset_password')}
          >
            <i className="fa-solid fa-key" style={{ fontSize: '0.72rem' }}></i>
            <span>كلمة المرور</span>
          </button>

          {/* Block / Unblock Toggle Button */}
          <button
            type="button"
            className="btn"
            onClick={() => onToggleBlock(student)}
            style={{
              height: '30px',
              padding: '0 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isBlocked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isBlocked ? '#34d399' : '#f87171',
              border: isBlocked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={isBlocked ? t('students.unblock_btn') : t('students.block_btn')}
          >
            <i className={`fa-solid ${isBlocked ? 'fa-lock-open' : 'fa-ban'}`} style={{ fontSize: '0.72rem' }}></i>
            <span>{isBlocked ? t('students.unblock_btn') : t('students.block_btn')}</span>
          </button>

          {/* Delete Student */}
          <button
            type="button"
            className="btn"
            onClick={() => onDelete(student)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
            title={t('btn.delete')}
          >
            <i className="fa-solid fa-trash" style={{ fontSize: '0.75rem' }}></i>
          </button>
        </div>
      </div>
    </div>
  );
}
