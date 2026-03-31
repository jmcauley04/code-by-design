import React from 'react';
import { useStore } from '../../store/useStore.js';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore();

  const row = (label: string, control: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
      {control}
    </div>
  );

  const toggle = (value: boolean, onChange: (v: boolean) => void) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        border: 'none',
        background: value ? '#61dafb' : '#334155',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: value ? '18px' : '3px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        Display Settings
      </div>

      {row('Show Mini Map', toggle(settings.showMiniMap, (v) => updateSettings({ showMiniMap: v })))}
      {row('Dark Mode', toggle(settings.darkMode, (v) => updateSettings({ darkMode: v })))}

      <div style={{ height: '1px', background: '#1e293b', margin: '16px 0' }} />

      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        About
      </div>
      <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.7 }}>
        <div>Code by Design v1.0.0</div>
        <div>Visual project designer for developers.</div>
        <div style={{ marginTop: '8px' }}>
          Analyze existing projects or scaffold new ones using the visual graph editor.
        </div>
      </div>
    </div>
  );
};

export default Settings;
