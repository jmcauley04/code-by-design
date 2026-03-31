import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { analyzeProject, createFile } from '../../api/index.js';
import FileTree from './FileTree.js';
import Settings from './Settings.js';
import type { LayerType, FileType, ActiveLayer } from '../../types/index.js';
import { FILE_TYPE_COLORS, LAYER_LABELS } from '../../utils/nodeUtils.js';

type SidebarTab = 'files' | 'layers' | 'settings';

const LANGUAGES = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp'];
const FRAMEWORKS: Record<string, string[]> = {
  typescript: ['react', 'nextjs', 'vue', 'svelte', 'express', 'nestjs', 'angular'],
  javascript: ['react', 'nextjs', 'vue', 'svelte', 'express'],
  python: ['django', 'flask', 'fastapi'],
  java: ['spring', 'quarkus'],
  go: ['gin', 'echo', 'fiber'],
  rust: ['actix', 'axum'],
  csharp: ['aspnet', 'blazor'],
};

const FILE_TYPE_LIST: FileType[] = [
  'component', 'controller', 'service', 'model',
  'utility', 'config', 'test', 'style', 'type', 'index', 'unknown',
];

const LAYER_LIST: LayerType[] = ['ui', 'backend', 'domain', 'infrastructure', 'shared', 'config'];

const LAYER_COLORS_SIDE: Record<LayerType, string> = {
  ui: '#60a5fa',
  backend: '#fb923c',
  domain: '#a78bfa',
  infrastructure: '#34d399',
  shared: '#94a3b8',
  config: '#fbbf24',
};

const LAYER_LIST_ALL: ActiveLayer[] = ['fileRefs', 'functions', 'framework'];
const LAYER_DISPLAY: Record<ActiveLayer, { label: string; description: string; icon: string }> = {
  fileRefs: { label: 'File References', description: 'Show import/dependency edges', icon: '🔗' },
  functions: { label: 'Function Layer', description: 'Show function-level connections', icon: 'ƒ' },
  framework: { label: 'Framework View', description: 'Show framework-specific relationships', icon: '🏗️' },
};

const Sidebar: React.FC = () => {
  const {
    project, setProject, settings, updateSettings, isLoading, setIsLoading, setError,
    activeLayers, toggleLayer, selectedNodeId, setSelectedNodeId,
    addNode, setEdges,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SidebarTab>('files');
  const [folderPath, setFolderPath] = useState('');
  const [filterType, setFilterType] = useState<FileType | ''>('');
  const [filterLayer, setFilterLayer] = useState<LayerType | ''>('');
  const folderInputRef = useRef<HTMLInputElement>(null);

  // New-file dialog state
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);

  const handleAnalyze = async () => {
    if (!folderPath.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeProject(folderPath.trim(), settings.language, settings.framework);
      setProject(result);
      updateSettings({ language: result.language, framework: result.framework });
    } catch (err) {
      setError(`Failed to analyze project: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async () => {
    if (!project || !newFilePath.trim()) return;
    setCreatingFile(true);
    setError(null);
    try {
      const { node, edges } = await createFile(
        project.rootPath,
        newFilePath.trim(),
        settings.language,
        settings.framework,
      );
      addNode(node);
      setEdges(edges);
      setNewFilePath('');
      setShowNewFile(false);
      setSelectedNodeId(node.id);
    } catch (err) {
      setError(`Failed to create file: ${(err as Error).message}`);
    } finally {
      setCreatingFile(false);
    }
  };

  const filteredFiles = project?.files.filter((f) => {
    if (filterType && f.type !== filterType) return false;
    if (filterLayer && f.layer !== filterLayer) return false;
    return true;
  }) || [];

  const tabStyle = (tab: SidebarTab): React.CSSProperties => ({
    flex: 1,
    padding: '8px',
    background: activeTab === tab ? '#1e293b' : 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #61dafb' : '2px solid transparent',
    color: activeTab === tab ? '#f1f5f9' : '#64748b',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.15s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  });

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ fontSize: '24px' }}>🎨</div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px' }}>Code by Design</div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>Visual project designer</div>
          </div>
        </div>

        {/* Folder input */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <input
            ref={folderInputRef}
            type="text"
            placeholder="Enter folder path..."
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            style={{
              flex: 1,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '7px 10px',
              color: '#f1f5f9',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !folderPath.trim()}
            style={{
              background: '#61dafb',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 12px',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '12px',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: !folderPath.trim() ? 0.5 : 1,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? '⏳' : '▶ Load'}
          </button>
        </div>

        {/* Language / Framework */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value, framework: FRAMEWORKS[e.target.value]?.[0] || '' })}
            style={{
              flex: 1,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#94a3b8',
              fontSize: '11px',
              outline: 'none',
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={settings.framework}
            onChange={(e) => updateSettings({ framework: e.target.value })}
            style={{
              flex: 1,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#94a3b8',
              fontSize: '11px',
              outline: 'none',
            }}
          >
            {(FRAMEWORKS[settings.language] || [settings.framework]).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0a111e' }}>
        <button style={tabStyle('files')} onClick={() => setActiveTab('files')}>📁 Files</button>
        <button style={tabStyle('layers')} onClick={() => setActiveTab('layers')}>🔀 Layers</button>
        <button style={tabStyle('settings')} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'files' && (
          <>
            {/* Filters */}
            {project && (
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '6px' }}>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FileType | '')}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    color: '#94a3b8',
                    fontSize: '10px',
                    outline: 'none',
                  }}
                >
                  <option value="">All types</option>
                  {FILE_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={filterLayer}
                  onChange={(e) => setFilterLayer(e.target.value as LayerType | '')}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    color: '#94a3b8',
                    fontSize: '10px',
                    outline: 'none',
                  }}
                >
                  <option value="">All layers</option>
                  {LAYER_LIST.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {!project && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                  No project loaded. Enter a folder path above and click Load.
                </div>
              )}
              {project && filteredFiles.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                  No files match the current filters.
                </div>
              )}
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedNodeId(file.id === selectedNodeId ? null : file.id)}
                  style={{
                    padding: '8px 10px',
                    marginBottom: '2px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: file.id === selectedNodeId ? 'rgba(97,218,251,0.1)' : 'transparent',
                    border: `1px solid ${file.id === selectedNodeId ? 'rgba(97,218,251,0.3)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: FILE_TYPE_COLORS[file.type] || '#475569',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#f1f5f9',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {file.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569' }}>
                        {file.layer} · {file.type}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        background: LAYER_COLORS_SIDE[file.layer] + '22',
                        color: LAYER_COLORS_SIDE[file.layer],
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {file.layer.slice(0, 3).toUpperCase()}
                    </div>
                  </div>
                  {file.path !== file.name && (
                    <div style={{ fontSize: '9px', color: '#334155', marginTop: '2px', paddingLeft: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.path}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {project && (
              <div style={{ padding: '6px 8px', borderTop: '1px solid #1e293b' }}>
                {showNewFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      New file path (relative to project root):
                    </div>
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. src/services/UserService.ts"
                      value={newFilePath}
                      onChange={(e) => setNewFilePath(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFile();
                        if (e.key === 'Escape') { setShowNewFile(false); setNewFilePath(''); }
                      }}
                      style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        color: '#f1f5f9',
                        fontSize: '11px',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={handleCreateFile}
                        disabled={creatingFile || !newFilePath.trim()}
                        style={{
                          flex: 1,
                          padding: '5px',
                          background: '#22c55e',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: creatingFile ? 'wait' : 'pointer',
                          opacity: !newFilePath.trim() ? 0.5 : 1,
                        }}
                      >
                        {creatingFile ? '⏳ Creating…' : '✔ Create'}
                      </button>
                      <button
                        onClick={() => { setShowNewFile(false); setNewFilePath(''); }}
                        style={{
                          flex: 1,
                          padding: '5px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          color: '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewFile(true)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      background: 'transparent',
                      border: '1px dashed #334155',
                      borderRadius: '5px',
                      color: '#61dafb',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s',
                    }}
                  >
                    + New File
                  </button>
                )}
              </div>
            )}

            {project && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#475569', display: 'flex', gap: '12px' }}>
                <span>📁 {project.files.length} files</span>
                <span>🔗 {project.edges.length} edges</span>
              </div>
            )}
          </>
        )}

        {activeTab === 'layers' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Visualization Layers
            </div>
            {LAYER_LIST_ALL.map((layer) => {
              const info = LAYER_DISPLAY[layer];
              const isActive = activeLayers.has(layer);
              return (
                <div
                  key={layer}
                  onClick={() => toggleLayer(layer)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(97,218,251,0.08)' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${isActive ? 'rgba(97,218,251,0.3)' : '#1e293b'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{info.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: isActive ? '#f1f5f9' : '#64748b', fontWeight: 600 }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569' }}>{info.description}</div>
                    </div>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isActive ? '#61dafb' : '#334155',
                        transition: 'all 0.15s',
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: '20px', fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Node Type Legend
            </div>
            {FILE_TYPE_LIST.map((type) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: FILE_TYPE_COLORS[type], flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{type}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
};

export default Sidebar;
