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
  const { t } = useI18n();
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
    } catch (err) {
      console.error('[DashboardModule] fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics
  const activeRequestsCount = stats.requests.filter(
    (r) => r.status !== 'مكتمل' && r.status !== 'ملغي' && r.status !== 'completed' && r.status !== 'cancelled'
  ).length;

  const recentRequests = stats.requests.slice(0, 5);
  const recentStudents = stats.students.slice(0, 5);

  const getStatusColor = (st: string) => {
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
    <section className="section active">
      {/* Module Header */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>{t('dashboard.title')}</h2>
          <p>{t('dashboard.desc')}</p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchDashboardData}
          disabled={isLoading}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
          <span>تحديث البيانات</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>جارِ تحميل لوحة القيادة...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
          <i className="fa-solid fa-triangle-exclamation fa-2x"></i>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchDashboardData}
            style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem' }}
          >
            {t('btn.retry')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: KPI Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px',
            }}
          >
            {/* KPI: Total Apartments */}
            <Link
              to="/apartments"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-building"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    {t('dashboard.kpi_apartments')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800 }}>
                    {stats.apartments.length}
                  </strong>
                </div>
              </div>
            </Link>

            {/* KPI: Total Services */}
            <Link
              to="/services"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-screwdriver-wrench"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    {t('dashboard.kpi_services')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800 }}>
                    {stats.services.length}
                  </strong>
                </div>
              </div>
            </Link>

            {/* KPI: Active Requests */}
            <Link
              to="/requests"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    {t('dashboard.kpi_requests')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 800 }}>
                    {activeRequestsCount}
                  </strong>
                </div>
              </div>
            </Link>

            {/* KPI: Total Students */}
            <Link
              to="/students"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    {t('dashboard.kpi_students')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800 }}>
                    {stats.students.length}
                  </strong>
                </div>
              </div>
            </Link>

            {/* KPI: Avg Rating */}
            <Link
              to="/reviews"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-star"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    {t('dashboard.kpi_rating')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 800 }}>
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '5.0'} ★
                  </strong>
                </div>
              </div>
            </Link>

            {/* KPI: Attention Required (Chats) */}
            <Link
              to="/chats"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    {t('dashboard.kpi_chats')}
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: pendingChatsCount > 0 ? '#f87171' : 'var(--text-main)', fontWeight: 800 }}>
                    {pendingChatsCount}
                  </strong>
                </div>
              </div>
            </Link>

            {/* KPI: Promo Codes */}
            <Link
              to="/promo-codes"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="item-card"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-tags"></i>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    أكواد الخصم النشطة
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: '#38bdf8', fontWeight: 800 }}>
                    {stats.promoCodesCount}
                  </strong>
                </div>
              </div>
            </Link>
          </div>

          {/* Row 2: Quick Operations Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-bolt" style={{ color: '#fbbf24', fontSize: '0.9rem' }}></i>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{t('dashboard.quick_actions')}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                to="/apartments"
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="fa-solid fa-plus"></i>
                <span>{t('dashboard.action_add_apartment')}</span>
              </Link>
              <Link
                to="/services"
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="fa-solid fa-plus"></i>
                <span>{t('dashboard.action_add_service')}</span>
              </Link>
              <Link
                to="/students"
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="fa-solid fa-user-plus"></i>
                <span>{t('dashboard.action_add_student')}</span>
              </Link>
              <Link
                to="/notifications"
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <i className="fa-solid fa-bullhorn"></i>
                <span>{t('dashboard.action_send_notif')}</span>
              </Link>
            </div>
          </div>

          {/* Row 3: Two Column Recent Activity */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Recent Service Requests */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-bell" style={{ color: '#fbbf24', fontSize: '0.85rem' }}></i>
                  <span>{t('dashboard.recent_requests')}</span>
                </strong>
                <Link to="/requests" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  عرض الكل &larr;
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  لا توجد طلبات مسجلة حالياً
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentRequests.map((req) => {
                    const stColor = getStatusColor(req.status);
                    return (
                      <div
                        key={req.id}
                        style={{
                          background: 'var(--bg-main)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.service_title}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {req.student_name} • {req.created_at ? req.created_at.split(' ')[0] : ''}
                          </span>
                        </div>

                        <span
                          style={{
                            background: stColor.bg,
                            color: stColor.color,
                            border: `1px solid ${stColor.border}`,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.68rem',
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

            {/* Recent Registered Students */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-users" style={{ color: '#34d399', fontSize: '0.85rem' }}></i>
                  <span>{t('dashboard.recent_students')}</span>
                </strong>
                <Link to="/students" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  عرض الكل &larr;
                </Link>
              </div>

              {recentStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  لا يوجد طلاب مسجلين حالياً
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentStudents.map((stu) => (
                    <div
                      key={stu.id}
                      style={{
                        background: 'var(--bg-main)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stu.full_name}
                          </strong>
                          {stu.nationality && (
                            <span style={{ fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                              {stu.nationality}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {stu.university || 'جامعة في جورجيا'} • {stu.created_at ? stu.created_at.split(' ')[0] : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        <i className="fa-solid fa-coins" style={{ color: '#fbbf24', fontSize: '0.7rem' }}></i>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
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
    </section>
  );
}
