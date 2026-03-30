import React, { useEffect } from 'react';
import { useStore } from './store/useStore.js';
import Canvas from './components/Canvas/Canvas.js';
import Sidebar from './components/Sidebar/Sidebar.js';
import NodePanel from './components/NodePanel/NodePanel.js';
import Toolbar from './components/Toolbar/Toolbar.js';
import { checkHealth } from './api/index.js';

const App: React.FC = () => {
  const { sidebarOpen, error, setError, nodePanelOpen } = useStore();

  useEffect(() => {
    // Check backend health on startup
    checkHealth().then((ok) => {
      if (!ok) {
        setError('Backend is not running. Start the backend server on port 3001.');
      }
    });
  }, [setError]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#0f172a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <Toolbar />

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && <Sidebar />}
        <Canvas />
        {nodePanelOpen && <NodePanel />}
      </div>
    </div>
  );
};

export default App;
