import React, { useState } from 'react';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  language?: string;
  children?: TreeNode[];
}

interface FileTreeProps {
  tree: TreeNode[] | object;
  onSelect?: (path: string) => void;
}

const TreeItem: React.FC<{ node: TreeNode; depth: number; onSelect?: (path: string) => void }> = ({
  node,
  depth,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);

  return (
    <div>
      <div
        onClick={() => {
          if (node.type === 'directory') setExpanded(!expanded);
          else onSelect?.(node.path);
        }}
        style={{
          padding: `4px 8px 4px ${8 + depth * 14}px`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#94a3b8',
          borderRadius: '4px',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.6)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {node.type === 'directory' ? (
          <span>{expanded ? '📂' : '📁'}</span>
        ) : (
          <span>📄</span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </div>
      {node.type === 'directory' && expanded && node.children && (
        <div>
          {(node.children as TreeNode[]).map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ tree, onSelect }) => {
  const nodes = Array.isArray(tree) ? tree : [];

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {nodes.map((node) => (
        <TreeItem key={node.path} node={node as TreeNode} depth={0} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default FileTree;
