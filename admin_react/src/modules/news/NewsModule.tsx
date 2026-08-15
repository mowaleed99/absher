import { useState, useMemo, useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import { NewsItem } from '../../types/news';
import { useI18n } from '../../lib/i18n';
import { NewsCard } from './NewsCard';
import { AddNewsModal } from './AddNewsModal';
import { EditNewsModal } from './EditNewsModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

const PAGE_SIZE = 12;

export function NewsModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const { news, isLoading, error, refetch, addNews, updateNews, deleteNews } = useNews();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const filteredNews = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return news;
    return news.filter((n) => {
      const matchTitleAr = (n.title_ar || n.title || '').toLowerCase().includes(q);
      const matchTitleEn = (n.title_en || '').toLowerCase().includes(q);
      const matchContentAr = (n.content_ar || n.content || '').toLowerCase().includes(q);
      const matchContentEn = (n.content_en || '').toLowerCase().includes(q);
      const matchId = String(n.id).includes(q);
      return matchTitleAr || matchTitleEn || matchContentAr || matchContentEn || matchId;
    });
  }, [news, searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE));
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredNews.slice(start, start + PAGE_SIZE);
  }, [filteredNews, currentPage]);

  const handleDelete = async (item: NewsItem) => {
    const ok = await confirm({
      title: t('dialog.delete_news_title'),
      message: t('dialog.delete_news_msg'),
      variant: 'danger',
    });
    if (!ok) return;

    const res = await deleteNews(item.id);
    if (res.success) {
      showToast(isRtl ? 'تم حذف الخبر بنجاح' : 'News deleted successfully', 'success');
    } else {
      showToast(res.error || (isRtl ? 'فشل حذف الخبر' : 'Failed to delete news'), 'error');
    }
  };

  return (
    <section className="section active">
      {/* Module Header */}
      <div className="section-header">
        <div>
          <h2>{t('news.title')}</h2>
          <p>{t('news.desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>{t('news.add_news')}</span>
          </button>
        </div>
      </div>

      {/* Unified Single-Row Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '460px' }}>
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('news.search_placeholder')}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid #1e293b',
              color: '#f8fafc',
              padding: isRtl ? '0 36px 0 12px' : '0 12px 0 36px',
              fontSize: '0.82rem',
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '0.8rem',
            }}
          ></i>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
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
            fontSize: '0.82rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {t('news.count', { count: filteredNews.length })}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{t('news.loading')}</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={refetch}
            style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem' }}
          >
            {t('btn.retry')}
          </button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-newspaper fa-3x" style={{ opacity: 0.3, marginBottom: '12px' }}></i>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('news.empty_state')}</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {paginatedNews.map((n) => (
              <NewsCard
                key={n.id}
                news={n}
                onEdit={(item) => setEditingNews(item)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '20px',
                padding: '12px 0',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '0.8rem' }}
              >
                {t('pagination.prev')}
              </button>

              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '0 8px' }}>
                {t('pagination.page', { current: currentPage, total: totalPages })}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '0.8rem' }}
              >
                {t('pagination.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddNewsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addNews}
        showToast={showToast}
      />

      <EditNewsModal
        isOpen={!!editingNews}
        newsItem={editingNews}
        onClose={() => setEditingNews(null)}
        onSubmit={updateNews}
        showToast={showToast}
      />
    </section>
  );
}
