import { useState, useMemo } from 'react';
import { ServiceRequest } from '../../../types/request';
import { useI18n } from '../../../lib/i18n';

interface TrendAreaChartProps {
  requests: ServiceRequest[];
}

export function TrendAreaChart({ requests }: TrendAreaChartProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group requests for the last 7 days
  const chartData = useMemo(() => {
    const days: { label: string; fullDate: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayName = d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        weekday: 'short',
      });

      // Count requests matching this day
      const count = requests.filter((r) => {
        if (!r.created_at) return false;
        return r.created_at.startsWith(dateStr);
      }).length;

      days.push({
        label: dayName,
        fullDate: dateStr,
        count,
      });
    }
    return days;
  }, [requests, isRtl]);

  const maxVal = Math.max(...chartData.map((d) => d.count), 5);

  // Chart coordinates calculation
  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * chartW;
    const y = height - paddingY - (d.count / maxVal) * chartH;
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier curve
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const baseY = height - paddingY;
    return `${pathD} L ${lastX},${baseY} L ${firstX},${baseY} Z`;
  }, [pathD, points, height, paddingY]);

  const totalWeekRequests = chartData.reduce((acc, curr) => acc + curr.count, 0);

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.2))',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {isRtl ? 'حركة الطلبات خلال آخر 7 أيام' : 'Requests Trend (Last 7 Days)'}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isRtl ? 'تحليل تدفق ونمو الطلبات اليومية' : 'Daily request flow & volume analysis'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {totalWeekRequests} {isRtl ? 'طلب هذا الأسبوع' : 'Requests this week'}
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '6px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const yPos = paddingY + ratio * chartH;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={isRtl ? width - paddingX + 8 : paddingX - 8}
                  y={yPos + 4}
                  textAnchor={isRtl ? 'start' : 'end'}
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="inherit"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Glowing Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#chartGlow)"
          />

          {/* Data Points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={height - paddingY}
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                )}

                {/* Outer halo on hover */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="rgba(56, 189, 248, 0.25)"
                  />
                )}

                {/* Main point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 4}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={isHovered ? '3' : '2'}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* X-axis Label */}
                <text
                  x={pt.x}
                  y={height - paddingY + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#38bdf8' : 'var(--text-muted)'}
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '500'}
                  fontFamily="inherit"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            style={{
              position: 'absolute',
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`,
              transform: 'translate(-50%, -120%)',
              background: '#0d1527',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
              {points[hoveredIndex].count} {isRtl ? 'طلب' : 'Requests'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
              {points[hoveredIndex].fullDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
