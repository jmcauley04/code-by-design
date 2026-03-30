import React, { useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { generateProject } from '../../api/index.js';

const Toolbar: React.FC = () => {
  const { project, sidebarOpen, setSidebarOpen, isLoading, settings } = useStore();
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateAll = async () => {
    if (!project) return;
    setGenerating(true);
    setMessage('');
    try {
      const files = await generateProject(project.files, settings.language, settings.framework, project.name);
      const count = Object.keys(files).length;
      setMessage(`✅ Generated ${count} files`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        height: '48px',
        background: '#0a111e',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        fontFamily: "'Inter', system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        style={{
          background: 'transparent',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          padding: '6px 10px',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.15s',
        }}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <div style={{ width: '1px', height: '24px', background: '#1e293b' }} />

      {/* Project info */}
      {project && (
        <>
          <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 600 }}>
            {project.name}
          </span>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            {project.files.length} files · {project.edges.length} connections
          </span>
          <div style={{ width: '1px', height: '24px', background: '#1e293b' }} />
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Status message */}
      {message && (
        <span style={{ fontSize: '12px', color: '#94a3b8', animation: 'fadeIn 0.2s' }}>
          {message}
        </span>
      )}

      {/* Generate button */}
      {project && (
        <button
          onClick={handleGenerateAll}
          disabled={generating || isLoading}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            border: 'none',
            borderRadius: '6px',
            padding: '7px 14px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12px',
            cursor: generating ? 'wait' : 'pointer',
            opacity: generating ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {generating ? '⏳ Generating...' : '⚡ Generate All'}
        </button>
      )}

      <div style={{ width: '1px', height: '24px', background: '#1e293b' }} />

      {/* Health indicator */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
        }}
        title="Backend connected"
      />
    </div>
  );
};

export default Toolbar;
