import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/apiFetch';
import { useBadges } from '../../contexts/BadgesContext';
import { useI18n } from '../../lib/i18n';
import { parseApartments, parseServices, parseRequests, parseStudents, parseFeedbackList, parseNewsList } from '../../lib/validators';
import { Apartment } from '../../types/apartment';
import { Service } from '../../types/service';
import { ServiceRequest } from '../../types/request';
import { Student } from '../../types/student';
import { ApplicationFeedback } from '../../types/feedback';
import { NewsItem } from '../../types/news';

interface DashboardStats {
  apartments: Apartment[];
  services: Service[];
  requests: ServiceRequest[];
  students: Student[];
  feedback: ApplicationFeedback[];
  news: NewsItem[];
  promoCodesCount: number;
  avgRating: number;
  ratingDistribution: Record<string, number>;
}

export function DashboardModule() {
  const { t, lang } = useI18n();
  const isRtl = lang === 'ar';
  const { pendingChatsCount } = useBadges();

  const [stats, setStats] = useState<DashboardStats>({
    apartments: [],
    services: [],
    requests: [],
    students: [],
    feedback: [],
    news: [],
    promoCodesCount: 0,
    avgRating: 0,
    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Record<string, unknown>>('get_all');
      if (!result.success) {
        setError(result.error || 'Failed to fetch dashboard data');
        return;
      }

      if (!result.data) {
        setError('Empty dashboard payload');
        return;
      }

      const d = result.data;
      const apts = parseApartments(d.apartments) || [];
      const srvs = parseServices(d.services) || [];
      const reqs = parseRequests(d.requests) || [];
      const stus = parseStudents(d.students) || [];
      const fdbk = parseFeedbackList(d.application_feedback || d.feedback) || [];
      const nws = parseNewsList(d.news) || [];
      const promoCount = Array.isArray(d.promo_codes)
        ? (d.promo_codes as Array<{ status?: string }>).filter((p) => p.status === 'active').length
        : 0;

      let avg = 0;
      let dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

      if (d.reviews_analytics && typeof d.reviews_analytics === 'object') {
        const ra = d.reviews_analytics as Record<string, unknown>;
        avg = Number(ra.average_rating) || 0;
        if (ra.rating_distribution && typeof ra.rating_distribution === 'object') {
          dist = { ...dist, ...(ra.rating_distribution as Record<string, number>) };
        }
      }

      setStats({
        apartments: apts,
        services: srvs,
        requests: reqs,
        students: stus,
        feedback: fdbk,
        news: nws,
        promoCodesCount: promoCount,
        avgRating: avg,
        ratingDistribution: dist,
      });

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[DashboardModule] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [isRtl]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics
  const activeRequestsCount = stats.requests.filter(
    (r) => r.status !== 'مكتمل' && r.status !== 'ملغي' && r.status !== 'completed' && r.status !== 'cancelled'
  ).length;

  const recentRequests = stats.requests.slice(0, 6);
  const recentStudents = stats.students.slice(0, 6);

  const getStatusStyle = (st: string) => {
    switch (st) {
      case 'قيد المراجعة':
      case 'pending':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'قيد التنفيذ':
      case 'in_progress':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'مكتمل':
      case 'completed':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'ملغي':
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. Header: Professional compact title & integrated actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)',
            }}
          >
            <i className="fa-solid fa-gauge-high"></i>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('dashboard.title')}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {t('dashboard.desc')}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdated && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              <span>آخر تحديث: {lastUpdated}</span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            title="تحديث بيانات لوحة القيادة"
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0d1527';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ color: '#38bdf8' }}></i>
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {isLoading && stats.apartments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#38bdf8' }}></i>
          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>جارِ تحميل لوحة المؤشرات التنفيذية...</p>
        </div>
      ) : error && stats.apartments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>
          <button
            type="button"
            onClick={fetchDashboardData}
            style={{
              marginTop: '10px',
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {t('btn.retry')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 2. Balanced 7 KPI Cards Grid */}
          <div
            className="kpi-grid-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* KPI 1: Apartments */}
            <Link to="/apartments" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('dashboard.kpi_apartments')}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-building"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: 'var(--text-main)', fontWeight: 800, lineHeight: 1.2 }}>
                    {stats.apartments.length}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    شقة مسجلة ومعتمدة
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 2: Services */}
            <Link to="/services" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('dashboard.kpi_services')}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-screwdriver-wrench"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: 'var(--text-main)', fontWeight: 800, lineHeight: 1.2 }}>
                    {stats.services.length}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    خدمة طلابية نشطة
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 3: Active Requests */}
            <Link to="/requests" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('dashboard.kpi_requests')}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-bell"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: '#fbbf24', fontWeight: 800, lineHeight: 1.2 }}>
                    {activeRequestsCount}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    طلب قيد المتابعة والإجراء
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 4: Students */}
            <Link to="/students" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('dashboard.kpi_students')}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-users"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: 'var(--text-main)', fontWeight: 800, lineHeight: 1.2 }}>
                    {stats.students.length}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    طالب مسجل في المنصة
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 5: Avg Rating */}
            <Link to="/reviews" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('dashboard.kpi_rating')}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(251, 191, 36, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-star"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: '#fbbf24', fontWeight: 800, lineHeight: 1.2 }}>
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '5.0'} ★
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    متوسط تقييمات الطلاب
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 6: Customer Support Chats */}
            <Link to="/chats" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('dashboard.kpi_chats')}
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-headset"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: pendingChatsCount > 0 ? '#f87171' : 'var(--text-main)', fontWeight: 800, lineHeight: 1.2 }}>
                    {pendingChatsCount}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    محادثات بانتظار الرد
                  </span>
                </div>
              </div>
            </Link>

            {/* KPI 7: Promo Codes */}
            <Link to="/promo-codes" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="dashboard-kpi-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    أكواد الخصم
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    <i className="fa-solid fa-tags"></i>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.45rem', color: '#38bdf8', fontWeight: 800, lineHeight: 1.2 }}>
                    {stats.promoCodesCount}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    كود خصم ساري ونشط
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* 3. Quick Actions Toolbar */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                  {t('dashboard.quick_actions')}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  إجراءات سريعة لإدارة المحتوى والخدمات والطلاب
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                to="/apartments"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1527')}
              >
                <i className="fa-solid fa-plus" style={{ color: '#818cf8' }}></i>
                <span>{t('dashboard.action_add_apartment')}</span>
              </Link>

              <Link
                to="/services"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1527')}
              >
                <i className="fa-solid fa-plus" style={{ color: '#60a5fa' }}></i>
                <span>{t('dashboard.action_add_service')}</span>
              </Link>

              <Link
                to="/students"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1527')}
              >
                <i className="fa-solid fa-user-plus" style={{ color: '#34d399' }}></i>
                <span>{t('dashboard.action_add_student')}</span>
              </Link>

              <Link
                to="/offers"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1527')}
              >
                <i className="fa-solid fa-house-circle-check" style={{ color: '#a855f7' }}></i>
                <span>عروض السكن</span>
              </Link>

              <Link
                to="/notifications"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  background: '#0d1527',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0d1527')}
              >
                <i className="fa-solid fa-bullhorn" style={{ color: '#fbbf24' }}></i>
                <span>{t('dashboard.action_send_notif')}</span>
              </Link>
            </div>
          </div>

          {/* 4. Two Column Recent Activity Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Column 1: Latest Service Requests */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-bell" style={{ color: '#fbbf24', fontSize: '0.95rem' }}></i>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {t('dashboard.recent_requests')}
                  </strong>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#fbbf24',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {stats.requests.length}
                  </span>
                </div>
                <Link
                  to="/requests"
                  style={{
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>عرض الكل</span>
                  <i className={`fa-solid ${isRtl ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-clipboard-list fa-2x" style={{ opacity: 0.3, marginBottom: '8px' }}></i>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>لا توجد طلبات خدمات مسجلة حالياً</p>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentRequests.map((req) => {
                    const stStyle = getStatusStyle(req.status);
                    return (
                      <div
                        key={req.id}
                        style={{
                          background: '#0d1527',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              #{req.id}
                            </span>
                            <strong
                              style={{
                                fontSize: '0.84rem',
                                color: 'var(--text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {req.service_title}
                            </strong>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {req.student_name} • {req.created_at ? req.created_at.split(' ')[0] : ''}
                          </div>
                        </div>

                        <span
                          style={{
                            background: stStyle.bg,
                            color: stStyle.color,
                            border: `1px solid ${stStyle.border}`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 2: Latest Registered Students */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-users" style={{ color: '#34d399', fontSize: '0.95rem' }}></i>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {t('dashboard.recent_students')}
                  </strong>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#34d399',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {stats.students.length}
                  </span>
                </div>
                <Link
                  to="/students"
                  style={{
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>عرض الكل</span>
                  <i className={`fa-solid ${isRtl ? 'fa-arrow-left' : 'fa-arrow-right'}`}></i>
                </Link>
              </div>

              {recentStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-user-group fa-2x" style={{ opacity: 0.3, marginBottom: '8px' }}></i>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>لا يوجد طلاب مسجلين حالياً</p>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentStudents.map((stu) => (
                    <div
                      key={stu.id}
                      style={{
                        background: '#0d1527',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {stu.full_name ? stu.full_name.charAt(0) : 'ط'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong
                              style={{
                                fontSize: '0.84rem',
                                color: 'var(--text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {stu.full_name}
                            </strong>
                            {stu.nationality && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  color: '#60a5fa',
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {stu.nationality}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {stu.university || 'جامعة في جورجيا'} • {stu.created_at ? stu.created_at.split(' ')[0] : ''}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid rgba(251, 191, 36, 0.25)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-coins" style={{ color: '#fbbf24', fontSize: '0.72rem' }}></i>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fbbf24' }}>
                          {stu.points}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
