import { useState, useMemo } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { useBadges } from '../../contexts/BadgesContext';
import { ApplicationFeedback, FeedbackStatus } from '../../types/feedback';
import { FeedbackCard } from './FeedbackCard';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { useI18n } from '../../lib/i18n';

export function FeedbackModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { feedback, isLoading, error, refetch, updateStatus, deleteFeedback } = useFeedback();
  const { refetchBadges } = useBadges();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isFocused, setIsFocused] = useState(false);

  const statusOptions = [
    { key: 'all', label: t('feedback.status_all'), icon: 'fa-inbox' },
    { key: 'pending', label: t('feedback.status_pending'), icon: 'fa-clock' },
    { key: 'reviewed', label: t('feedback.status_reviewed'), icon: 'fa-eye' },
    { key: 'resolved', label: t('feedback.status_resolved'), icon: 'fa-circle-check' },
  ];

  const typeOptions = [
    { key: 'all', label: t('feedback.type_all') },
    { key: 'suggestion', label: t('feedback.type_suggestion') },
    { key: 'bug', label: t('feedback.type_bug') },
    { key: 'ux', label: t('feedback.type_ux') },
    { key: 'feature', label: t('feedback.type_feature') },
  ];

  const filteredFeedback = useMemo(() => {
    return feedback.filter((f) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && f.status !== statusFilter) {
        return false;
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && f.feedback_type !== typeFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesStudent = f.student_name && f.student_name.toLowerCase().includes(q);
        const matchesUni = f.student_uni && f.student_uni.toLowerCase().includes(q);
        const matchesComment = f.comment && f.comment.toLowerCase().includes(q);
        const matchesId = String(f.id) === q;
        if (!matchesStudent && !matchesUni && !matchesComment && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [feedback, statusFilter, typeFilter, searchQuery]);

  const handleUpdateStatus = async (id: number, status: FeedbackStatus) => {
    const res = await updateStatus(id, status);
    if (res.success) {
      showToast(t('msg.feedback_status_updated'), 'success');
      refetchBadges();
    } else {
      showToast(res.error || t('msg.error_update_feedback'), 'error');
    }
  };

  const handleDelete = async (item: ApplicationFeedback) => {
    const confirmed = await confirm({
      title: t('dialog.delete_feedback_title'),
      message: `${t('dialog.delete_feedback_msg')} (بلاغ #${item.id} - ${item.student_name})`,
      confirmText: t('btn.delete'),
      cancelText: t('btn.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    const res = await deleteFeedback(item.id);
    if (res.success) {
      showToast(t('msg.feedback_deleted'), 'success');
      refetchBadges();
    } else {
      showToast(res.error || t('msg.error_delete_feedback'), 'error');
    }
  };

  return (
    <section className="tab-pane active" style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title">
          <h2>
            <i className="fa-solid fa-comments" style={{ color: 'var(--primary)', marginLeft: '8px' }}></i>
            {t('feedback.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.85rem' }}>
            {t('feedback.desc')}
          </p>
        </div>
      </div>

      {/* Unified Compact Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.key;
            const count = opt.key === 'all'
              ? feedback.length
              : feedback.filter((f) => f.status === opt.key).length;

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-main)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  boxShadow: isActive ? '0 0 10px var(--primary-glow)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className={`fa-solid ${opt.icon}`} style={{ fontSize: '0.75rem' }}></i>
                <span>{opt.label}</span>
                <span
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Type Filter Select */}
        <div style={{ minWidth: '150px' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 10px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {typeOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 200px',
            maxWidth: '380px',
          }}
        >
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          ></i>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('feedback.search_placeholder')}
            style={{
              width: '100%',
              height: '38px',
              paddingRight: isRtl ? '36px' : '32px',
              paddingLeft: isRtl ? '32px' : '36px',
              borderRadius: '10px',
              border: isFocused ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none',
              boxShadow: isFocused
                ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
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
                fontSize: '0.75rem',
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
            padding: '6px 12px',
            borderRadius: '16px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {t('feedback.count', { count: filteredFeedback.length })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '10px' }}></i>
          <p style={{ fontSize: '0.9rem' }}>{t('feedback.loading')}</p>
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
      {!isLoading && !error && filteredFeedback.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-inbox fa-2x" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '12px' }}></i>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{t('feedback.empty_state')}</h3>
        </div>
      )}

      {/* High-Density Feedback Grid (3-4 cards on desktop) */}
      {!isLoading && !error && filteredFeedback.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {filteredFeedback.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
