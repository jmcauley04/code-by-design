import { create } from 'zustand';
import type { ProjectInfo, FileNode, FileEdge, ActiveLayer, AppSettings } from '../types/index.js';

interface AppState {
  // Project
  project: ProjectInfo | null;
  setProject: (project: ProjectInfo | null) => void;
  updateNode: (nodeId: string, updates: Partial<FileNode>) => void;
  addNode: (node: FileNode) => void;
  setEdges: (edges: FileEdge[]) => void;

  // Selected node
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Layers
  activeLayers: Set<ActiveLayer>;
  toggleLayer: (layer: ActiveLayer) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  nodePanelOpen: boolean;
  setNodePanelOpen: (open: boolean) => void;

  // Node positions (for ReactFlow)
  nodePositions: Record<string, { x: number; y: number }>;
  setNodePosition: (id: string, position: { x: number; y: number }) => void;
}

export const useStore = create<AppState>((set, get) => ({
  project: null,
  setProject: (project) => set({ project, selectedNodeId: null, nodePositions: {} }),
  updateNode: (nodeId, updates) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          files: state.project.files.map((f) =>
            f.id === nodeId ? { ...f, ...updates } : f
          ),
        },
      };
    }),
  addNode: (node) =>
    set((state) => {
      if (!state.project) return state;
      // Avoid duplicates
      if (state.project.files.some((f) => f.id === node.id)) return state;
      return {
        project: {
          ...state.project,
          files: [...state.project.files, node],
        },
      };
    }),
  setEdges: (edges) =>
    set((state) => {
      if (!state.project) return state;
      return { project: { ...state.project, edges } };
    }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id, nodePanelOpen: !!id }),

  activeLayers: new Set<ActiveLayer>(['fileRefs']),
  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.activeLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { activeLayers: next };
    }),

  settings: {
    language: 'typescript',
    framework: 'react',
    showMiniMap: true,
    darkMode: true,
  },
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  nodePanelOpen: false,
  setNodePanelOpen: (open) => set({ nodePanelOpen: open }),

  nodePositions: {},
  setNodePosition: (id, position) =>
    set((state) => ({ nodePositions: { ...state.nodePositions, [id]: position } })),
}));
