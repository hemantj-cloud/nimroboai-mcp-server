'use client';

import React from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface DispatchedRun {
  id: string;
  outcome_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  target_environment: 'local_mac' | 'cloud';
  hypothesis?: string;
  parameters?: Record<string, any>;
  dry_run?: boolean;
}

interface DispatchResultData {
  success?: boolean;
  message?: string;
  run?: DispatchedRun;
}

export default function DispatchResultWidget() {
  const { isReady, getToolOutput, callTool, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const rawData = getToolOutput<DispatchResultData | DispatchedRun>();

  const isDark = theme === 'dark';

  let run: DispatchedRun | undefined;
  let message: string = 'Outcome experiment run dispatched successfully.';

  if (rawData && 'run' in rawData && rawData.run) {
    run = rawData.run;
    if (rawData.message) message = rawData.message;
  } else if (rawData && 'id' in rawData) {
    run = rawData as DispatchedRun;
  }

  if (!run && isReady) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>
        No dispatch result available.
      </div>
    );
  }

  const {
    id = 'run_unknown',
    outcome_id = '',
    status = 'running',
    target_environment = 'local_mac',
    hypothesis,
    parameters,
    dry_run = false,
  } = run || {};

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
      {/* Dispatch Confirmation Card */}
      <div
        style={{
          background: isDark ? '#111827' : '#FFFFFF',
          border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: dry_run
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#FFFFFF',
              boxShadow: dry_run
                ? '0 4px 12px rgba(245, 158, 11, 0.35)'
                : '0 4px 12px rgba(16, 185, 129, 0.35)',
            }}
          >
            {dry_run ? '🧪' : '🚀'}
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              {dry_run ? 'Dry Run Simulated' : 'Experiment Dispatched!'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B' }}>
              {message}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? '#1A2234' : '#F1F5F9',
              border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
            }}
          >
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Run ID
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, marginTop: '4px', color: '#6366F1' }}>
              {id}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? '#1A2234' : '#F1F5F9',
              border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
            }}
          >
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Environment
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {target_environment === 'local_mac' ? '🍎 Local Mac Daemon' : '☁️ Cloud'}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? '#1A2234' : '#F1F5F9',
              border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
            }}
          >
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Outcome Target
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, marginTop: '4px', color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {outcome_id}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? '#1A2234' : '#F1F5F9',
              border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
            }}
          >
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Initial Status
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: '#10B981', textTransform: 'capitalize' }}>
              {status}
            </div>
          </div>
        </div>

        {/* Hypothesis */}
        {hypothesis && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? '#1A2234' : '#F8FAFC',
              border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              Test Hypothesis
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.4', color: isDark ? '#E2E8F0' : '#1E293B' }}>
              {hypothesis}
            </div>
          </div>
        )}

        {/* Parameters */}
        {parameters && Object.keys(parameters).length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDark ? '#0F172A' : '#1E293B',
              border: '1px solid #334155',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
              Parameters Applied
            </div>
            <pre style={{ margin: 0, fontSize: '12px', color: '#A5B4FC', fontFamily: 'monospace', overflowX: 'auto' }}>
              {JSON.stringify(parameters, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => callTool('get_run_status', { run_id: id, include_logs: true })}
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
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            <span>⏱️</span> Track Execution Logs
          </button>

          <button
            onClick={() => callTool('get_outcome_runs', { outcome_id, limit: 5 })}
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
            <span>📜</span> All Runs for Outcome
          </button>

          <button
            onClick={() => sendFollowUpMessage(`Check status and diagnostic logs for newly dispatched run ${id}`)}
            style={{
              background: isDark ? '#1F2937' : '#FFFFFF',
              color: '#6366F1',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            💬 Ask AI Status
          </button>
        </div>
      </div>
    </div>
  );
}
