import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { getFileContent, saveFileContent, generateFile } from '../../api/index.js';
import type { FunctionInfo } from '../../types/index.js';
import { FILE_TYPE_COLORS, FILE_TYPE_LABELS, getFileIcon, formatFileSize } from '../../utils/nodeUtils.js';

type PanelTab = 'metadata' | 'functions' | 'code';

const NodePanel: React.FC = () => {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectedNode = useStore((s) =>
    s.selectedNodeId && s.project
      ? s.project.files.find((f) => f.id === s.selectedNodeId) || null
      : null
  );
  const setSelectedNodeId = useStore((s) => s.setSelectedNodeId);
  const updateNode = useStore((s) => s.updateNode);
  const settings = useStore((s) => s.settings);
  const nodePanelOpen = useStore((s) => s.nodePanelOpen);
  const setNodePanelOpen = useStore((s) => s.setNodePanelOpen);
  void selectedNodeId;
  const [activeTab, setActiveTab] = useState<PanelTab>('metadata');
  const [code, setCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setGoalValue(selectedNode.goal || '');
      if (selectedNode.content !== undefined) {
        setCode(selectedNode.content);
      } else {
        setCode('');
      }
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedNode && activeTab === 'code' && !code) {
      setLoadingCode(true);
      getFileContent(selectedNode.path)
        .then((c) => setCode(c))
        .catch(() => setCode('// Could not load file content'))
        .finally(() => setLoadingCode(false));
    }
  }, [selectedNode, activeTab]);

  if (!nodePanelOpen || !selectedNode) return null;

  const color = FILE_TYPE_COLORS[selectedNode.type] || '#94a3b8';
  const label = FILE_TYPE_LABELS[selectedNode.type] || 'File';
  const icon = getFileIcon(selectedNode.type);

  const tabStyle = (tab: PanelTab): React.CSSProperties => ({
    flex: 1,
    padding: '8px',
    background: activeTab === tab ? '#1e293b' : 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? `2px solid ${color}` : '2px solid transparent',
    color: activeTab === tab ? '#f1f5f9' : '#64748b',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    transition: 'all 0.15s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  });

  const handleSaveGoal = () => {
    updateNode(selectedNode.id, { goal: goalValue });
    setEditingGoal(false);
  };

  const handleSaveCode = async () => {
    setSaving(true);
    try {
      await saveFileContent(selectedNode.path, code);
      updateNode(selectedNode.id, { content: code });
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await generateFile(selectedNode, settings.language, settings.framework);
      setCode(generated);
    } catch (err) {
      console.error('Failed to generate:', err);
    } finally {
      setGenerating(false);
    }
  };

  const updateFunctionGoal = (fnName: string, goal: string) => {
    const updatedFunctions = selectedNode.functions.map((f) =>
      f.name === fnName ? { ...f, goal } : f
    );
    updateNode(selectedNode.id, { functions: updatedFunctions });
  };

  const addFunction = () => {
    const name = prompt('Function name:');
    if (!name) return;
    const newFn: FunctionInfo = {
      name,
      params: [],
      returnType: 'void',
      isAsync: false,
      isExported: true,
      isPrivate: false,
      startLine: 0,
      endLine: 0,
    };
    updateNode(selectedNode.id, { functions: [...selectedNode.functions, newFn] });
  };

  const removeFunction = (fnName: string) => {
    updateNode(selectedNode.id, {
      functions: selectedNode.functions.filter((f) => f.name !== fnName),
    });
  };

  return (
    <div
      style={{
        width: '360px',
        minWidth: '360px',
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e293b',
          background: `linear-gradient(135deg, ${color}11, transparent)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '11px', color: color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </div>
              <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: 600 }}>
                {selectedNode.name}
              </div>
            </div>
          </div>
          <button
            onClick={() => { setSelectedNodeId(null); setNodePanelOpen(false); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0a111e' }}>
        <button style={tabStyle('metadata')} onClick={() => setActiveTab('metadata')}>📋 Info</button>
        <button style={tabStyle('functions')} onClick={() => setActiveTab('functions')}>ƒ Functions</button>
        <button style={tabStyle('code')} onClick={() => setActiveTab('code')}>{'<>'} Code</button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Metadata tab */}
        {activeTab === 'metadata' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {[
              { label: 'File Name', value: selectedNode.name },
              { label: 'Path', value: selectedNode.path },
              { label: 'Type', value: label },
              { label: 'Language', value: selectedNode.language },
              { label: 'Layer', value: selectedNode.layer },
              { label: 'Size', value: formatFileSize(selectedNode.size) },
              { label: 'Imports', value: `${selectedNode.imports.length} files` },
              { label: 'Exports', value: `${selectedNode.exports.length} symbols` },
              { label: 'Functions', value: `${selectedNode.functions.length} defined` },
              { label: 'Classes', value: `${selectedNode.classes.length} defined` },
            ].map(({ label: l, value: v }) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{l}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}

            {/* Goal */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Purpose / Goal
              </div>
              {editingGoal ? (
                <div>
                  <textarea
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Describe the purpose of this file..."
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      onClick={handleSaveGoal}
                      style={{ flex: 1, padding: '6px', background: '#61dafb', border: 'none', borderRadius: '4px', color: '#0f172a', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGoal(false)}
                      style={{ flex: 1, padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingGoal(true)}
                  style={{
                    minHeight: '40px',
                    padding: '8px',
                    background: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: selectedNode.goal ? '#94a3b8' : '#334155',
                    cursor: 'pointer',
                    border: '1px solid #1e293b',
                    fontStyle: selectedNode.goal ? 'normal' : 'italic',
                  }}
                >
                  {selectedNode.goal || 'Click to add a purpose...'}
                </div>
              )}
            </div>

            {/* Imports */}
            {selectedNode.imports.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Imports
                </div>
                {selectedNode.imports.slice(0, 10).map((imp, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#64748b', padding: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imp}
                  </div>
                ))}
                {selectedNode.imports.length > 10 && (
                  <div style={{ fontSize: '10px', color: '#334155' }}>
                    +{selectedNode.imports.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Functions tab */}
        {activeTab === 'functions' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {selectedNode.functions.length} function{selectedNode.functions.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={addFunction}
                style={{ padding: '4px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#61dafb', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
              >
                + Add
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {selectedNode.functions.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>
                  No functions detected in this file.
                </div>
              )}
              {selectedNode.functions.map((fn) => (
                <FunctionCard key={fn.name} fn={fn} onUpdateGoal={updateFunctionGoal} onRemove={removeFunction} color={color} />
              ))}
            </div>
          </div>
        )}

        {/* Code tab */}
        {activeTab === 'code' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '6px' }}>
              <button
                onClick={handleSaveCode}
                disabled={saving}
                style={{ flex: 1, padding: '6px', background: '#22c55e', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : '💾 Save'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{ flex: 1, padding: '6px', background: '#a855f7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', opacity: generating ? 0.6 : 1 }}
              >
                {generating ? 'Generating...' : '⚡ Regenerate'}
              </button>
            </div>
            {loadingCode ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Loading...
              </div>
            ) : (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0a0f1a',
                  border: 'none',
                  color: '#e2e8f0',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontSize: '12px',
                  padding: '12px',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.6,
                  tabSize: 2,
                }}
                spellCheck={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface FunctionCardProps {
  fn: FunctionInfo;
  onUpdateGoal: (name: string, goal: string) => void;
  onRemove: (name: string) => void;
  color: string;
}

const FunctionCard: React.FC<FunctionCardProps> = ({ fn, onUpdateGoal, onRemove, color }) => {
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState(fn.goal || '');

  return (
    <div
      style={{
        marginBottom: '6px',
        padding: '10px 12px',
        background: 'rgba(30,41,59,0.6)',
        borderRadius: '6px',
        border: '1px solid #1e293b',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: color, fontWeight: 600 }}>
              {fn.name}
            </span>
            {fn.isAsync && <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>async</span>}
            {fn.isExported && <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>export</span>}
            {fn.isPrivate && <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }}>private</span>}
          </div>
          {fn.params.length > 0 && (
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', fontFamily: 'monospace' }}>
              ({fn.params.slice(0, 3).join(', ')}{fn.params.length > 3 ? ', ...' : ''})
            </div>
          )}
          {fn.returnType && fn.returnType !== 'void' && (
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '1px', fontFamily: 'monospace' }}>
              → {fn.returnType}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(fn.name)}
          style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '12px', padding: '0', lineHeight: 1 }}
          title="Remove function"
        >
          ✕
        </button>
      </div>

      {editing ? (
        <div style={{ marginTop: '6px' }}>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onBlur={() => { onUpdateGoal(fn.name, goal); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onUpdateGoal(fn.name, goal); setEditing(false); }
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
            placeholder="What does this function do?"
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '5px 8px',
              color: '#f1f5f9',
              fontSize: '11px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            marginTop: '5px',
            fontSize: '10px',
            color: fn.goal ? '#64748b' : '#334155',
            fontStyle: fn.goal ? 'normal' : 'italic',
            cursor: 'pointer',
          }}
        >
          {fn.goal || 'Add goal...'}
        </div>
      )}
    </div>
  );
};

export default NodePanel;
