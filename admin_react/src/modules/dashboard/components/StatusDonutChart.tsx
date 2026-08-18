import { useState, useMemo } from 'react';
import { ServiceRequest } from '../../../types/request';
import { useI18n } from '../../../lib/i18n';

interface StatusDonutChartProps {
  requests: ServiceRequest[];
}

export function StatusDonutChart({ requests }: StatusDonutChartProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const statusStats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    requests.forEach((r) => {
      const s = (r.status || '').toLowerCase().trim();
      if (s === 'مكتمل' || s === 'completed') {
        completed++;
      } else if (s === 'قيد التنفيذ' || s === 'in_progress' || s === 'processing') {
        inProgress++;
      } else if (s === 'ملغي' || s === 'cancelled' || s === 'مرفوض' || s === 'rejected') {
        cancelled++;
      } else {
        pending++;
      }
    });

    const total = requests.length || 1; // Avoid divide by 0
    return [
      {
        id: 'pending',
        label: isRtl ? 'طلبات جديدة / بانتظار المراجعة' : 'New / Pending',
        count: pending,
        color: '#38bdf8',
        percent: Math.round((pending / total) * 100),
      },
      {
        id: 'in_progress',
        label: isRtl ? 'قيد التنفيذ والمعالجة' : 'In Progress',
        count: inProgress,
        color: '#fbbf24',
        percent: Math.round((inProgress / total) * 100),
      },
      {
        id: 'completed',
        label: isRtl ? 'طلبات مكتملة وناجحة' : 'Completed',
        count: completed,
        color: '#34d399',
        percent: Math.round((completed / total) * 100),
      },
      {
        id: 'cancelled',
        label: isRtl ? 'طلبات ملغية أو مرفوضة' : 'Cancelled',
        count: cancelled,
        color: '#f87171',
        percent: Math.round((cancelled / total) * 100),
      },
    ];
  }, [requests, isRtl]);

  const totalCount = requests.length;

  // Donut SVG params
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = statusStats.map((item) => {
    const ratio = totalCount > 0 ? item.count / totalCount : 0;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += ratio * circumference;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(16, 185, 129, 0.2))',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}
        >
          <i className="fa-solid fa-chart-pie"></i>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {isRtl ? 'توزيع حالات الطلبات' : 'Request Status Distribution'}
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'نسب الإنجاز والمعالجة الحالية' : 'Real-time completion & workflow ratios'}
          </span>
        </div>
      </div>

      {/* Content: Donut + Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '6px',
        }}
      >
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {totalCount === 0 ? (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth={strokeWidth}
              />
            ) : (
              segments.map((seg) => {
                const isHovered = hoveredStatus === seg.id;
                return (
                  <circle
                    key={seg.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      filter: isHovered ? `drop-shadow(0 0 6px ${seg.color})` : 'none',
                    }}
                    onMouseEnter={() => setHoveredStatus(seg.id)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Center Text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
              {totalCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              {isRtl ? 'إجمالي الطلبات' : 'Total Requests'}
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
          {statusStats.map((item) => {
            const isHovered = hoveredStatus === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredStatus(item.id)}
                onMouseLeave={() => setHoveredStatus(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  border: isHovered ? `1px solid ${item.color}40` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}80`,
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: isHovered ? 700 : 500 }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.85rem', color: item.color }}>
                    {item.count}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({item.percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
