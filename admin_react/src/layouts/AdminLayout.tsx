import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBadges } from '../contexts/BadgesContext';
import { useI18n } from '../lib/i18n';
import logoImg from '../assets/logo.png';

export function AdminLayout() {
  const { logout } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { pendingReviewsCount, pendingFeedbackCount, pendingChatsCount, pendingRequestsCount } = useBadges();
  const location = useLocation();

  const isChatsRoute = location.pathname.startsWith('/chats');

  const handleLanguageToggle = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const formatBadge = (count: number) => {
    if (count <= 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  const reviewsBadgeText = formatBadge(pendingReviewsCount);
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
            onClick={logout}
            title={t('admin.logout')}
            style={{ color: '#f87171' }}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
          <div className="admin-profile">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              alt="Admin"
            />
            <span>{t('admin.general_manager')}</span>
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
              {reviewsBadgeText && (
                <span
                  style={{
                    background: '#f59e0b',
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
                  {reviewsBadgeText}
                </span>
              )}
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
