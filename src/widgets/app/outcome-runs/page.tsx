'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface RunStep {
  step_number: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  logs?: string[];
}

interface OutcomeRunItem {
  id: string;
  outcome_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  target_environment: 'local_mac' | 'cloud';
  parameters?: Record<string, any>;
  hypothesis?: string;
  actions_executed?: string[];
  metric_before?: number;
  metric_after?: number;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  steps?: RunStep[];
}

interface WrappedResponse {
  success?: boolean;
  count?: number;
  runs?: OutcomeRunItem[];
}

export default function OutcomeRunsWidget() {
  const { isReady, getToolOutput, callTool } = useWidgetSDK();
  const theme = useTheme();
  const rawData = getToolOutput<WrappedResponse | OutcomeRunItem[]>();
  const [filter, setFilter] = useState<'all' | 'completed' | 'running'>('all');

  const isDark = theme === 'dark';

  let runs: OutcomeRunItem[] = [];
  if (Array.isArray(rawData)) {
    runs = rawData;
  } else if (rawData && Array.isArray(rawData.runs)) {
    runs = rawData.runs;
  }

  const filteredRuns = runs.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          color: '#10B981',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'Completed',
          icon: '✓',
        };
      case 'running':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
          color: '#3B82F6',
          border: 'rgba(59, 130, 246, 0.3)',
          label: 'Running',
          icon: '⚡',
        };
      case 'failed':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
          color: '#EF4444',
          border: 'rgba(239, 68, 68, 0.3)',
          label: 'Failed',
          icon: '✗',
        };
      default:
        return {
          bg: isDark ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6',
          color: '#6B7280',
          border: 'rgba(107, 114, 128, 0.3)',
          label: status,
          icon: '•',
        };
    }
  };

  if (!rawData && isReady) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>
        No outcome execution runs found.
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
      {/* Header & Filter */}
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
            <span>⚡</span> Outcome Experiment Runs
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: isDark ? '#1F2937' : '#E2E8F0',
                color: isDark ? '#94A3B8' : '#475569',
              }}
            >
              {runs.length}
            </span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B' }}>
            Execution history and evaluated metrics across macOS and Cloud
          </p>
        </div>

        {/* Filter */}
        <div
          style={{
            display: 'flex',
            background: isDark ? '#111827' : '#E2E8F0',
            padding: '3px',
            borderRadius: '8px',
            gap: '2px',
          }}
        >
          {(['all', 'completed', 'running'] as const).map((tab) => (
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

      {/* Runs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRuns.map((run) => {
          const badge = getStatusBadge(run.status);
          const hasMetrics = run.metric_before !== undefined && run.metric_after !== undefined;
          const metricDiff = hasMetrics ? (run.metric_after! - run.metric_before!) : null;

          return (
            <div
              key={run.id}
              style={{
                background: isDark ? '#111827' : '#FFFFFF',
                border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '16px',
                boxShadow: isDark
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Top Row: Run ID, Status, Environment */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '13px', fontWeight: 700, color: '#6366F1', fontFamily: 'monospace' }}>
                    {run.id}
                  </code>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    <span>{badge.icon}</span>
                    {badge.label}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isDark ? '#1E293B' : '#F1F5F9',
                      color: isDark ? '#94A3B8' : '#475569',
                      fontWeight: 600,
                    }}
                  >
                    {run.target_environment === 'local_mac' ? '🍎 macOS Bridge' : '☁️ Cloud'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' }}>
                  {formatDate(run.started_at)} {run.duration_seconds ? `(${formatDuration(run.duration_seconds)})` : ''}
                </div>
              </div>

              {/* Hypothesis */}
              {run.hypothesis && (
                <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '12px', color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  <strong style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>Hypothesis: </strong>
                  {run.hypothesis}
                </div>
              )}

              {/* Metrics Before / After */}
              {hasMetrics && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isDark ? '#1A2234' : '#F8FAFC',
                    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
                    marginBottom: '12px',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Before: </span>
                    <strong>{run.metric_before}</strong>
                  </div>
                  <div>→</div>
                  <div>
                    <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>After: </span>
                    <strong style={{ color: '#10B981' }}>{run.metric_after}</strong>
                  </div>
                  {metricDiff !== null && (
                    <div style={{ marginLeft: 'auto', fontWeight: 700, color: metricDiff >= 0 ? '#10B981' : '#EF4444' }}>
                      {metricDiff >= 0 ? '▲ +' : '▼ '}{metricDiff.toFixed(2)} delta
                    </div>
                  )}
                </div>
              )}

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8' }}>
                  Outcome: <code style={{ color: '#6366F1' }}>{run.outcome_id}</code>
                </div>

                <button
                  onClick={() => callTool('get_run_status', { run_id: run.id, include_logs: true })}
                  style={{
                    background: isDark ? '#1F2937' : '#FFFFFF',
                    color: '#6366F1',
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
                  <span>🔍</span> View Step Logs
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
