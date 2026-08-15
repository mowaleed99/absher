import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BadgesProvider } from './contexts/BadgesContext';
import { I18nProvider, useI18n } from './lib/i18n';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { ApartmentsModule } from './modules/apartments/ApartmentsModule';
import { DistrictsModule } from './modules/districts/DistrictsModule';
import { UniversitiesModule } from './modules/universities/UniversitiesModule';
import { ServicesModule } from './modules/services/ServicesModule';
import { RequestsModule } from './modules/requests/RequestsModule';
import { ReviewsModule } from './modules/reviews/ReviewsModule';
import { FeedbackModule } from './modules/feedback/FeedbackModule';
import { StudentsModule } from './modules/students/StudentsModule';
import { NewsModule } from './modules/news/NewsModule';
import { NotificationsModule } from './modules/notifications/NotificationsModule';
import { ChatsModule } from './modules/chats/ChatsModule';
import { PromoCodesModule } from './modules/promo/PromoCodesModule';
import { HousingOffersModule } from './modules/offers/HousingOffersModule';
import { LoginOverlay } from './components/LoginOverlay';
import logoImg from './assets/logo.png';
import './style.css';

function MainRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();

  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  if (isLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#111827',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', color: '#fbbf24' }}>
          <img src={logoImg} alt="Absher Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '12px' }} />
          <p style={{ fontSize: '1.1rem', color: '#9ca3af' }}>{t('admin.auth_checking')}</p>
        </div>
      </div>
    );
  }

  // Prevent protected routes and data hooks from mounting before authentication
  if (!isAuthenticated) {
    return <LoginOverlay />;
  }

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardModule />} />
          <Route path="dashboard" element={<DashboardModule />} />
          <Route path="apartments" element={<ApartmentsModule />} />
          <Route path="offers" element={<HousingOffersModule />} />
          <Route path="districts" element={<DistrictsModule />} />
          <Route path="universities" element={<UniversitiesModule />} />
          <Route path="services" element={<ServicesModule />} />
          <Route path="requests" element={<RequestsModule />} />
          <Route path="reviews" element={<ReviewsModule />} />
          <Route path="feedback" element={<FeedbackModule />} />
          <Route path="students" element={<StudentsModule />} />
          <Route path="news" element={<NewsModule />} />
          <Route path="notifications" element={<NotificationsModule />} />
          <Route path="chats" element={<ChatsModule />} />
          <Route path="promo-codes" element={<PromoCodesModule />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <BadgesProvider>
            <ToastProvider>
              <ConfirmDialogProvider>
                <MainRouter />
              </ConfirmDialogProvider>
            </ToastProvider>
          </BadgesProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
