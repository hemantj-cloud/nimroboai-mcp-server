'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface OutcomeItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived' | 'draft';
  target_metric: string;
  baseline_value: number;
  current_value: number;
  unit: string;
  tags?: string[];
  updated_at?: string;
}

interface WrappedResponse {
  success?: boolean;
  count?: number;
  outcomes?: OutcomeItem[];
}

export default function OutcomesCatalogWidget() {
  const { isReady, getToolOutput, callTool } = useWidgetSDK();
  const theme = useTheme();
  const rawData = getToolOutput<WrappedResponse | OutcomeItem[]>();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const isDark = theme === 'dark';
  
  let outcomes: OutcomeItem[] = [];
  if (Array.isArray(rawData)) {
    outcomes = rawData;
  } else if (rawData && Array.isArray(rawData.outcomes)) {
    outcomes = rawData.outcomes;
  }

  const filteredOutcomes = outcomes.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          color: '#10B981',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'Active',
          dot: true,
        };
      case 'paused':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
          color: '#F59E0B',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'Paused',
          dot: false,
        };
      default:
        return {
          bg: isDark ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6',
          color: '#6B7280',
          border: 'rgba(107, 114, 128, 0.3)',
          label: status,
          dot: false,
        };
    }
  };

  const calculateLift = (baseline: number, current: number) => {
    if (!baseline || baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  };

  if (!rawData && isReady) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>
        No optimization outcomes found.
      </div>
    );
  }

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
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎯</span> Optimization Outcomes
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: isDark ? '#1F2937' : '#E2E8F0',
                color: isDark ? '#94A3B8' : '#475569',
              }}
            >
              {outcomes.length}
            </span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B' }}>
            Live metrics and targets tracked by Nimrobo AI
          </p>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            background: isDark ? '#111827' : '#E2E8F0',
            padding: '3px',
            borderRadius: '8px',
            gap: '2px',
          }}
        >
          {(['all', 'active', 'paused'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filter === tab ? (isDark ? '#1F2937' : '#FFFFFF') : 'transparent',
                color: filter === tab ? (isDark ? '#F1F5F9' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B'),
                boxShadow: filter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Outcomes Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredOutcomes.map((item) => {
          const badge = getStatusBadge(item.status);
          const lift = calculateLift(item.baseline_value, item.current_value);
          const isPositiveLift = lift >= 0;

          return (
            <div
              key={item.id}
              style={{
                background: isDark ? '#111827' : '#FFFFFF',
                border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '18px',
                boxShadow: isDark
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card Top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A' }}>
                      {item.name}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.dot && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: badge.color,
                          }}
                        />
                      )}
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px' }}>
                    Target: <code style={{ fontFamily: 'monospace', color: '#6366F1' }}>{item.target_metric}</code>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                    Current vs Baseline
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      {item.current_value} {item.unit}
                    </span>
                    <span style={{ fontSize: '12px', color: isDark ? '#64748B' : '#94A3B8', textDecoration: 'line-through' }}>
                      {item.baseline_value} {item.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isPositiveLift ? '#10B981' : '#EF4444',
                      marginTop: '2px',
                    }}
                  >
                    {isPositiveLift ? '▲ +' : '▼ '}{lift.toFixed(1)}% lift
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ margin: '0 0 14px', fontSize: '13px', lineHeight: '1.4', color: isDark ? '#94A3B8' : '#475569' }}>
                {item.description}
              </p>

              {/* Tags & Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
                }}
              >
                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {item.tags?.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: isDark ? '#1E293B' : '#F1F5F9',
                        color: isDark ? '#94A3B8' : '#475569',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => callTool('get_outcome_analytics', { outcome_id: item.id, time_range: '30d' })}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>📊</span> Analytics
                  </button>

                  <button
                    onClick={() => callTool('get_outcome_runs', { outcome_id: item.id, limit: 5 })}
                    style={{
                      background: isDark ? '#1F2937' : '#F1F5F9',
                      color: isDark ? '#E5E7EB' : '#374151',
                      border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⚡</span> Runs
                  </button>

                  <button
                    onClick={() =>
                      callTool('dispatch_outcome_run', {
                        outcome_id: item.id,
                        hypothesis: `Optimize ${item.name}`,
                        target_environment: 'local_mac',
                        dry_run: true,
                      })
                    }
                    style={{
                      background: isDark ? '#1F2937' : '#F1F5F9',
                      color: '#6366F1',
                      border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Simulate / Dispatch Run"
                  >
                    🚀 Dispatch
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
