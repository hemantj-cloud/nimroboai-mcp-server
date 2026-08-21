'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface TimelinePoint {
  date: string;
  value: number;
  sample_size?: number;
  confidence_lower?: number;
  confidence_upper?: number;
}

interface AnalyticsSummary {
  baseline: number;
  current: number;
  absolute_change?: number;
  relative_lift_percent: number;
  is_statistically_significant: boolean;
  confidence_level: number;
  total_runs?: number;
  successful_runs?: number;
}

interface OutcomeAnalyticsData {
  outcome_id: string;
  outcome_name: string;
  time_range: string;
  summary: AnalyticsSummary;
  timeline?: TimelinePoint[];
}

interface WrappedResponse {
  success?: boolean;
  analytics?: OutcomeAnalyticsData;
}

export default function OutcomeAnalyticsWidget() {
  const { isReady, getToolOutput, callTool } = useWidgetSDK();
  const theme = useTheme();
  const rawData = getToolOutput<WrappedResponse | OutcomeAnalyticsData>();
  const [activePoint, setActivePoint] = useState<TimelinePoint | null>(null);

  const isDark = theme === 'dark';
  
  const analytics: OutcomeAnalyticsData | undefined = (rawData && 'analytics' in rawData && rawData.analytics)
    ? rawData.analytics
    : (rawData && 'summary' in rawData ? (rawData as OutcomeAnalyticsData) : undefined);

  if (!analytics && isReady) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>
        No outcome analytics data available.
      </div>
    );
  }

  const { outcome_name, outcome_id, time_range, summary, timeline = [] } = analytics || {
    outcome_name: 'Outcome Analytics',
    outcome_id: '',
    time_range: '30d',
    summary: { baseline: 0, current: 0, relative_lift_percent: 0, is_statistically_significant: false, confidence_level: 0 },
    timeline: [],
  };

  // Compute SVG chart coordinates
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 25;

  const values = timeline.map((p) => p.value);
  const minVal = Math.min(...values, summary.baseline) * 0.95 || 0;
  const maxVal = Math.max(...values, summary.current) * 1.05 || 10;

  const getX = (idx: number) => {
    if (timeline.length <= 1) return paddingX;
    return paddingX + (idx / (timeline.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return chartHeight / 2;
    return chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
  };

  const linePath = timeline.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.value)}`).join(' ');
  const areaPath = timeline.length > 0
    ? `${linePath} L ${getX(timeline.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`
    : '';

  const isLiftPositive = summary.relative_lift_percent >= 0;

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: isDark ? '#0B0F19' : '#F8FAFC',
        color: isDark ? '#F1F5F9' : '#0F172A',
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              {outcome_name}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: isDark ? '#1E293B' : '#E2E8F0',
                color: '#6366F1',
              }}
            >
              {time_range.toUpperCase()}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', fontFamily: 'monospace' }}>
            {outcome_id}
          </p>
        </div>

        {/* Statistical Significance Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: summary.is_statistically_significant
              ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
              : (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB'),
            color: summary.is_statistically_significant ? '#10B981' : '#F59E0B',
            border: `1px solid ${summary.is_statistically_significant ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <span>{summary.is_statistically_significant ? '✓' : '⚠️'}</span>
          {summary.is_statistically_significant ? 'Statistically Significant' : 'Collecting Data'}
          <span style={{ opacity: 0.8, fontSize: '11px' }}>({summary.confidence_level}% conf)</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Relative Lift */}
        <div
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Relative Lift
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: isLiftPositive ? '#10B981' : '#EF4444',
              marginTop: '4px',
            }}
          >
            {isLiftPositive ? '+' : ''}{summary.relative_lift_percent.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', marginTop: '2px' }}>
            vs {summary.baseline} baseline
          </div>
        </div>

        {/* Current Metric */}
        <div
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Current Value
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', marginTop: '4px' }}>
            {summary.current}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>
            +{summary.absolute_change !== undefined ? summary.absolute_change : (summary.current - summary.baseline).toFixed(2)} abs
          </div>
        </div>

        {/* Confidence Level */}
        <div
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Confidence
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#6366F1', marginTop: '4px' }}>
            {summary.confidence_level}%
          </div>
          <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', marginTop: '2px' }}>
            p-value &lt; 0.05
          </div>
        </div>

        {/* Experiment Runs */}
        <div
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Completed Runs
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', marginTop: '4px' }}>
            {summary.successful_runs || 0} / {summary.total_runs || 0}
          </div>
          <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', marginTop: '2px' }}>
            Successful experiments
          </div>
        </div>
      </div>

      {/* Interactive Timeline Chart */}
      {timeline.length > 0 && (
        <div
          style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A' }}>
              Metric Progression Trend
            </h3>
            {activePoint ? (
              <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600 }}>
                {activePoint.date}: <strong>{activePoint.value}</strong>
                {activePoint.sample_size ? ` (${activePoint.sample_size} sessions)` : ''}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8' }}>
                Hover data point for details
              </div>
            )}
          </div>

          {/* SVG Chart */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Baseline reference line */}
              <line
                x1={paddingX}
                y1={getY(summary.baseline)}
                x2={chartWidth - paddingX}
                y2={getY(summary.baseline)}
                stroke={isDark ? '#374151' : '#CBD5E1'}
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text
                x={paddingX + 4}
                y={getY(summary.baseline) - 6}
                fill={isDark ? '#64748B' : '#94A3B8'}
                fontSize="10"
                fontWeight="600"
              >
                Baseline: {summary.baseline}
              </text>

              {/* Area fill */}
              <path d={areaPath} fill="url(#areaGradient)" />

              {/* Trend Line */}
              <path d={linePath} fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />

              {/* Data points */}
              {timeline.map((point, idx) => {
                const cx = getX(idx);
                const cy = getY(point.value);
                const isActive = activePoint?.date === point.date;

                return (
                  <g key={point.date}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActive ? 6 : 4}
                      fill={isActive ? '#10B981' : '#6366F1'}
                      stroke={isDark ? '#111827' : '#FFFFFF'}
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={() => setActivePoint(point)}
                      onClick={() => setActivePoint(point)}
                    />
                    <text
                      x={cx}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill={isDark ? '#64748B' : '#94A3B8'}
                      fontSize="9"
                    >
                      {point.date.slice(5)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => callTool('get_outcome_runs', { outcome_id, limit: 10 })}
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>⚡</span> View Experiment Runs
        </button>

        <button
          onClick={() =>
            callTool('dispatch_outcome_run', {
              outcome_id,
              hypothesis: `Continuous optimization run for ${outcome_name}`,
              target_environment: 'local_mac',
              dry_run: false,
            })
          }
          style={{
            background: isDark ? '#1F2937' : '#FFFFFF',
            color: '#6366F1',
            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🚀</span> Dispatch New Local Run
        </button>
      </div>
    </div>
  );
}
