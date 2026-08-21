'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface RunStep {
  step_number: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  logs?: string[];
}

interface RunStatusData {
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
  run?: RunStatusData;
}

export default function RunStatusWidget() {
  const { isReady, getToolOutput, callTool, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const rawData = getToolOutput<WrappedResponse | RunStatusData>();
  const [activeStepTab, setActiveStepTab] = useState<number | 'all'>('all');

  const isDark = theme === 'dark';

  const run: RunStatusData | undefined = (rawData && 'run' in rawData && rawData.run)
    ? rawData.run
    : (rawData && 'id' in rawData ? (rawData as RunStatusData) : undefined);

  if (!run && isReady) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>
        No execution status data available.
      </div>
    );
  }

  const {
    id = '',
    outcome_id = '',
    status = 'completed',
    target_environment = 'local_mac',
    hypothesis,
    metric_before,
    metric_after,
    duration_seconds,
    steps = [],
    started_at,
    completed_at,
  } = run || {};

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return '✓';
      case 'running':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return '#10B981';
      case 'running':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      default:
        return isDark ? '#4B5563' : '#9CA3AF';
    }
  };

  const allLogs: Array<{ stepNumber: number; stepName: string; text: string }> = [];
  steps.forEach((st) => {
    if (st.logs && Array.isArray(st.logs)) {
      st.logs.forEach((log) => {
        allLogs.push({ stepNumber: st.step_number, stepName: st.name, text: log });
      });
    }
  });

  const displayedLogs = activeStepTab === 'all'
    ? allLogs
    : allLogs.filter((l) => l.stepNumber === activeStepTab);

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
      <div
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: isDark
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'monospace' }}>
                {id}
              </h2>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: status === 'completed'
                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                    : status === 'running'
                    ? (isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF')
                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                  color: status === 'completed' ? '#10B981' : status === 'running' ? '#3B82F6' : '#EF4444',
                  border: `1px solid ${status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                }}
              >
                {status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', marginTop: '4px' }}>
              Target Outcome: <code style={{ color: '#6366F1' }}>{outcome_id}</code>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: isDark ? '#1E293B' : '#F1F5F9',
                color: isDark ? '#94A3B8' : '#475569',
                fontWeight: 600,
              }}
            >
              {target_environment === 'local_mac' ? '🍎 Local Mac Daemon' : '☁️ Cloud'}
            </span>
            {duration_seconds ? (
              <span style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' }}>
                ⏱️ {Math.round(duration_seconds / 60)} mins
              </span>
            ) : null}
          </div>
        </div>

        {hypothesis && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isDark ? '#1A2234' : '#F8FAFC',
              border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
              fontSize: '13px',
              color: isDark ? '#E2E8F0' : '#334155',
              lineHeight: '1.4',
            }}
          >
            <strong style={{ color: '#6366F1' }}>Hypothesis: </strong>
            {hypothesis}
          </div>
        )}
      </div>

      {/* Stepper Progress */}
      <div
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#94A3B8' : '#64748B' }}>
          Step Progression
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {steps.map((st, idx) => {
            const color = getStepColor(st.status);
            const isLast = idx === steps.length - 1;

            return (
              <div key={st.step_number} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                {/* Step Circle */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: isDark ? '#1A2234' : '#F1F5F9',
                    border: `2px solid ${color}`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0,
                    zIndex: 2,
                  }}
                >
                  {getStepIcon(st.status)}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#F1F5F9' : '#0F172A' }}>
                      Step {st.step_number}: {st.name}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        color: color,
                      }}
                    >
                      {st.status}
                    </span>
                  </div>

                  {st.logs && st.logs.length > 0 && (
                    <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', marginTop: '3px' }}>
                      {st.logs[st.logs.length - 1]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnostic Terminal Logs */}
      <div
        style={{
          background: isDark ? '#0F172A' : '#1E293B',
          borderRadius: '14px',
          border: '1px solid #334155',
          padding: '16px',
          color: '#E2E8F0',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, marginLeft: '6px', color: '#94A3B8', fontFamily: 'monospace' }}>
              diagnostic_logs.log
            </span>
          </div>

          {/* Filter step tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveStepTab('all')}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: activeStepTab === 'all' ? '#475569' : 'transparent',
                color: '#E2E8F0',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {steps.map((st) => (
              <button
                key={st.step_number}
                onClick={() => setActiveStepTab(st.step_number)}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: activeStepTab === st.step_number ? '#475569' : 'transparent',
                  color: '#E2E8F0',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Step {st.step_number}
              </button>
            ))}
          </div>
        </div>

        {/* Console output */}
        <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6', maxHeight: '180px', overflowY: 'auto' }}>
          {displayedLogs.length > 0 ? (
            displayedLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#64748B' }}>[Step {log.stepNumber}]</span>
                <span style={{ color: '#10B981' }}>➜</span>
                <span style={{ color: '#E2E8F0' }}>{log.text}</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#64748B' }}>No log entries recorded.</div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => callTool('get_outcome_analytics', { outcome_id, time_range: '30d' })}
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
          <span>📊</span> Outcome Analytics
        </button>

        <button
          onClick={() => sendFollowUpMessage(`Analyze the step execution logs for run ${id} and suggest next optimization actions`)}
          style={{
            background: isDark ? '#1F2937' : '#FFFFFF',
            color: isDark ? '#E5E7EB' : '#374151',
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
          <span>💬</span> Ask AI to Analyze Logs
        </button>
      </div>
    </div>
  );
}
