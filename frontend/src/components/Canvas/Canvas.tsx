import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../../store/useStore.js';
import CustomNode, { type CustomNodeType } from './CustomNode.js';
import { computeAutoLayout, FILE_TYPE_COLORS } from '../../utils/nodeUtils.js';

const nodeTypes: NodeTypes = {
  fileNode: CustomNode as unknown as NodeTypes['fileNode'],
};

const Canvas: React.FC = () => {
  const { project, selectedNodeId, setSelectedNodeId, activeLayers, settings, nodePositions, setNodePosition } =
    useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodePosition(node.id, node.position);
    },
    [setNodePosition]
  );

  // Build nodes from project
  useEffect(() => {
    if (!project) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const files = project.files;
    const autoLayout = computeAutoLayout(files);

    const reactFlowNodes: CustomNodeType[] = files.map((file) => {
      const pos = nodePositions[file.id] || autoLayout[file.id] || { x: 0, y: 0 };
      return {
        id: file.id,
        type: 'fileNode',
        position: pos,
        data: {
          node: file,
          onSelect: setSelectedNodeId,
          isSelected: file.id === selectedNodeId,
        },
        style: { zIndex: file.id === selectedNodeId ? 10 : 1 },
      };
    });

    setNodes(reactFlowNodes);
  }, [project, selectedNodeId, nodePositions, setSelectedNodeId, setNodes, setEdges]);

  // Build edges based on active layers
  useEffect(() => {
    if (!project) return;

    const reactFlowEdges: Edge[] = [];

    if (activeLayers.has('fileRefs')) {
      for (const edge of project.edges) {
        reactFlowEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'rgba(148,163,184,0.4)', strokeWidth: 1.5 },
          markerEnd: {
            type: 'arrowclosed' as const,
            color: 'rgba(148,163,184,0.4)',
            width: 12,
            height: 12,
          },
        });
      }
    }

    if (activeLayers.has('functions')) {
      // Function-level connections: currently shown as metadata on nodes
      // Future: add explicit function-call edges here
    }

    setEdges(reactFlowEdges);
  }, [project, activeLayers, setEdges]);

  // Update selected state in nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSelected: n.id === selectedNodeId,
        },
        style: { zIndex: n.id === selectedNodeId ? 10 : 1 },
      }))
    );
  }, [selectedNodeId, setNodes]);

  if (!project) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#64748b',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '48px' }}>🎨</div>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#94a3b8' }}>
          Code by Design
        </div>
        <div style={{ fontSize: '14px', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6 }}>
          Select a folder from the sidebar to analyze your project and start designing.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={null}
        style={{ background: '#0f172a' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#1e293b"
          gap={24}
          size={1.5}
        />
        <Controls
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
          }}
        />
        {settings.showMiniMap && (
          <MiniMap
            nodeColor={(n) => {
              const fileNode = (n.data as CustomNodeType['data']).node;
              return fileNode ? FILE_TYPE_COLORS[fileNode.type] || '#475569' : '#475569';
            }}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            maskColor="rgba(15,23,42,0.7)"
          />
        )}
        <Panel position="top-center">
          <div
            style={{
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 16px',
              fontSize: '13px',
              color: '#94a3b8',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{project.name}</span>
            <span style={{ margin: '0 8px' }}>·</span>
            <span style={{ color: '#61dafb' }}>{project.language}</span>
            <span style={{ margin: '0 8px' }}>·</span>
            <span style={{ color: '#a855f7' }}>{project.framework}</span>
            <span style={{ margin: '0 8px' }}>·</span>
            <span>{project.files.length} files</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default Canvas;
