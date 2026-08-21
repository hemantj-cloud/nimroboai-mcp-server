'use client';

import React from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface UserProfileData {
  id?: string;
  email?: string;
  name?: string;
  organization?: string;
  role?: string;
  plan?: string;
  created_at?: string;
}

interface WrappedResponse {
  success?: boolean;
  data?: UserProfileData;
}

export default function UserProfileWidget() {
  const { isReady, getToolOutput, callTool, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const rawData = getToolOutput<WrappedResponse | UserProfileData>();

  const isDark = theme === 'dark';
  const profile: UserProfileData = (rawData && 'data' in rawData && rawData.data)
    ? rawData.data
    : (rawData as UserProfileData) || {};

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Active';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NB';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!rawData && isReady) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>
        No profile data available.
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
      {/* Profile Card */}
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
        {/* Header with Avatar & Plan */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '20px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              }}
            >
              {getInitials(profile.name)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {profile.name || 'Nimrobo AI User'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B' }}>
                {profile.email || 'user@nimroboai.com'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: profile.plan === 'enterprise'
                  ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF')
                  : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5'),
                color: profile.plan === 'enterprise' ? '#6366F1' : '#10B981',
                border: `1px solid ${profile.plan === 'enterprise' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {profile.plan || 'Enterprise'} Plan
            </span>
            <span style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF' }}>
              Role: <strong style={{ color: isDark ? '#E5E7EB' : '#374151' }}>{profile.role || 'Admin'}</strong>
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
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
              Organization
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {profile.organization || 'Nimrobo AI'}
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
              User ID
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, marginTop: '4px', color: '#6366F1' }}>
              {profile.id || 'usr_pilot_01'}
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
              Member Since
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: isDark ? '#F1F5F9' : '#0F172A' }}>
              {formatDate(profile.created_at)}
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
              Authentication
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              OAuth 2.0 PKCE (S256)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}` }}>
          <button
            onClick={() => callTool('get_outcomes', { status: 'active' })}
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            <span>🎯</span> View Active Outcomes
          </button>

          <button
            onClick={() => sendFollowUpMessage('Show me a summary of our recent outcome optimization experiments')}
            style={{
              background: isDark ? '#1F2937' : '#FFFFFF',
              color: isDark ? '#E5E7EB' : '#374151',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💬</span> Ask AI Summary
          </button>
        </div>
      </div>
    </div>
  );
}
