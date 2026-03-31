import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { FileNode } from '../../types/index.js';
import { FILE_TYPE_COLORS, FILE_TYPE_LABELS, getFileIcon } from '../../utils/nodeUtils.js';

export interface CustomNodeData extends Record<string, unknown> {
  node: FileNode;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export type CustomNodeType = Node<CustomNodeData>;

const CustomNode: React.FC<NodeProps<CustomNodeType>> = ({ data }) => {
  const { node, onSelect, isSelected } = data;
  const color = FILE_TYPE_COLORS[node.type] || '#94a3b8';
  const label = FILE_TYPE_LABELS[node.type] || 'File';
  const icon = getFileIcon(node.type);

  return (
    <div
      onClick={() => onSelect(node.id)}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${color}33, ${color}22)`
          : 'rgba(30, 41, 59, 0.95)',
        border: `2px solid ${isSelected ? color : color + '66'}`,
        borderRadius: '10px',
        padding: '10px 14px',
        minWidth: '180px',
        maxWidth: '220px',
        cursor: 'pointer',
        boxShadow: isSelected
          ? `0 0 16px ${color}55, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: color,
          width: 8,
          height: 8,
          border: '2px solid rgba(30,41,59,0.9)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div>
          <div
            style={{
              fontSize: '11px',
              color: color,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#f1f5f9',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '160px',
            }}
            title={node.name}
          >
            {node.name}
          </div>
        </div>
      </div>

      {(node.functions.length > 0 || node.classes.length > 0) && (
        <div
          style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: `1px solid ${color}33`,
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {node.functions.length > 0 && (
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              ƒ {node.functions.length}
            </span>
          )}
          {node.classes.length > 0 && (
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              ⬛ {node.classes.length}
            </span>
          )}
          {node.imports.length > 0 && (
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              ↑ {node.imports.length}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          width: 8,
          height: 8,
          border: '2px solid rgba(30,41,59,0.9)',
        }}
      />
    </div>
  );
};

export default memo(CustomNode);
