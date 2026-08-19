import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBadges } from '../contexts/BadgesContext';
import { useI18n } from '../lib/i18n';
import logoImg from '../assets/logo.png';

export function AdminLayout() {
  const { logout, adminUser } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const {
    pendingReviewsCount,
    negativeReviewsCount,
    rejectedReviewsCount,
    totalReviewsCount,
    pendingFeedbackCount,
    pendingChatsCount,
    pendingRequestsCount,
  } = useBadges();
  const location = useLocation();

  const isChatsRoute = location.pathname.startsWith('/chats');

  const handleLanguageToggle = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const formatBadge = (count: number) => {
    if (count <= 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  const negativeReviewsText = formatBadge(negativeReviewsCount);
  const rejectedReviewsText = formatBadge(rejectedReviewsCount);
  const pendingReviewsText = formatBadge(pendingReviewsCount);
  const totalReviewsText = formatBadge(totalReviewsCount);
  const feedbackBadgeText = formatBadge(pendingFeedbackCount);
  const chatsBadgeText = formatBadge(pendingChatsCount);
  const requestsBadgeText = formatBadge(pendingRequestsCount);

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header className="admin-header">
        <div className="logo-area">
          <div className="logo-icon" style={{ padding: '4px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.08)', border: '1.5px solid #fbbf24', borderRadius: '12px' }}>
            <img src={logoImg} alt="Absher Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="logo-text">
            <h1>
              <span>{t('admin.title')}</span> <span className="badge">{t('admin.badge')}</span>
            </h1>
            <p>{t('admin.subtitle')}</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="action-btn"
            onClick={handleLanguageToggle}
            title={t('admin.switch_language')}
          >
            <i className="fa-solid fa-language"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={toggleTheme}
            title={t('admin.switch_theme')}
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => navigate('/settings')}
            title={lang === 'ar' ? 'الإعدادات وفريق العمل' : 'Settings & Staff'}
          >
            <i className="fa-solid fa-gear"></i>
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={logout}
            title={t('admin.logout')}
            style={{ color: '#f87171' }}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
          <div
            className="admin-profile"
            onClick={() => navigate('/settings')}
            title={lang === 'ar' ? 'الملف الشخصي والإعدادات' : 'Profile & Settings'}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 4px 6px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {adminUser?.full_name ? adminUser.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: lang === 'ar' ? 'right' : 'left', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{adminUser?.full_name || 'المدير العام'}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{adminUser?.job_title || 'المدير العام'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="nav-links">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-gauge-high"></i>
              <span>{t('nav.stats')}</span>
            </NavLink>
            <NavLink
              to="/apartments"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-building"></i>
              <span>{t('nav.apartments')}</span>
            </NavLink>
            <NavLink
              to="/offers"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-house-circle-check"></i>
              <span>{t('nav.offers')}</span>
            </NavLink>
            <NavLink
              to="/districts"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>{t('nav.districts')}</span>
            </NavLink>
            <NavLink
              to="/universities"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-university"></i>
              <span>{t('nav.universities')}</span>
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-screwdriver-wrench"></i>
              <span>{t('nav.services')}</span>
            </NavLink>
            <NavLink
              to="/requests"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-bell"></i>
              <span style={{ flex: 1 }}>{t('nav.requests')}</span>
              {requestsBadgeText && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {requestsBadgeText}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/promo-codes"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-tags"></i>
              <span>{t('nav.promo_codes')}</span>
            </NavLink>
            <NavLink
              to="/reviews"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-star"></i>
              <span style={{ flex: 1 }}>{t('nav.reviews')}</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                {negativeReviewsText && (
                  <span
                    title={lang === 'ar' ? `تقييمات سلبية (1-2 نجوم): ${negativeReviewsText}` : `Negative reviews (1-2 stars): ${negativeReviewsText}`}
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    {negativeReviewsText}
                  </span>
                )}
                {rejectedReviewsText && (
                  <span
                    title={lang === 'ar' ? `غير مرئي / مرفوض: ${rejectedReviewsText}` : `Hidden / Rejected: ${rejectedReviewsText}`}
                    style={{
                      background: '#f59e0b',
                      color: '#0f172a',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    {rejectedReviewsText}
                  </span>
                )}
                {pendingReviewsText && (
                  <span
                    title={lang === 'ar' ? `قيد المراجعة: ${pendingReviewsText}` : `Pending: ${pendingReviewsText}`}
                    style={{
                      background: '#3b82f6',
                      color: '#ffffff',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pendingReviewsText}
                  </span>
                )}
                {totalReviewsText && (
                  <span
                    title={lang === 'ar' ? `إجمالي التقييمات: ${totalReviewsText}` : `Total reviews: ${totalReviewsText}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {totalReviewsText}
                  </span>
                )}
              </div>
            </NavLink>
            <NavLink
              to="/feedback"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-comments"></i>
              <span style={{ flex: 1 }}>{t('nav.feedback')}</span>
              {feedbackBadgeText && (
                <span
                  style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {feedbackBadgeText}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/chats"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-headset"></i>
              <span style={{ flex: 1 }}>{t('nav.chats')}</span>
              {chatsBadgeText && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {chatsBadgeText}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/students"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-users"></i>
              <span>{t('nav.students')}</span>
            </NavLink>
            <NavLink
              to="/news"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-newspaper"></i>
              <span>{t('nav.news')}</span>
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-bullhorn"></i>
              <span>{t('nav.notifications')}</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="fa-solid fa-users-gear"></i>
              <span>{lang === 'ar' ? 'الإعدادات وفريق العمل' : 'Settings & Staff'}</span>
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <p>
              <i className="fa-solid fa-server"></i> {t('admin.connection_status')}{' '}
              <span className="status-online">{t('admin.online')}</span>
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className={`content-area custom-scrollbar ${isChatsRoute ? 'content-area-no-scroll' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
