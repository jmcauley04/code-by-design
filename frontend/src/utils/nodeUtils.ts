import type { FileType, LayerType } from '../types/index.js';

export const FILE_TYPE_COLORS: Record<FileType, string> = {
  component: '#61dafb',   // React blue
  controller: '#ff7e67',  // Orange-red
  service: '#a855f7',     // Purple
  model: '#22c55e',       // Green
  utility: '#eab308',     // Yellow
  config: '#94a3b8',      // Slate
  test: '#f59e0b',        // Amber
  style: '#ec4899',       // Pink
  type: '#06b6d4',        // Cyan
  index: '#64748b',       // Gray
  unknown: '#475569',     // Dark gray
};

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  component: 'Component',
  controller: 'Controller',
  service: 'Service',
  model: 'Model',
  utility: 'Utility',
  config: 'Config',
  test: 'Test',
  style: 'Style',
  type: 'Types',
  index: 'Index',
  unknown: 'File',
};

export const LAYER_ORDER: Record<LayerType, number> = {
  ui: 0,
  backend: 1,
  domain: 2,
  infrastructure: 3,
  shared: 4,
  config: 5,
};

export const LAYER_COLORS: Record<LayerType, string> = {
  ui: 'rgba(96, 165, 250, 0.05)',
  backend: 'rgba(251, 146, 60, 0.05)',
  domain: 'rgba(167, 139, 250, 0.05)',
  infrastructure: 'rgba(52, 211, 153, 0.05)',
  shared: 'rgba(148, 163, 184, 0.05)',
  config: 'rgba(251, 191, 36, 0.05)',
};

export const LAYER_LABELS: Record<LayerType, string> = {
  ui: 'UI Layer',
  backend: 'Backend Layer',
  domain: 'Domain Layer',
  infrastructure: 'Infrastructure Layer',
  shared: 'Shared',
  config: 'Configuration',
};

export function computeAutoLayout(
  files: { id: string; layer: LayerType }[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const byLayer: Record<string, string[]> = {};

  for (const file of files) {
    if (!byLayer[file.layer]) byLayer[file.layer] = [];
    byLayer[file.layer].push(file.id);
  }

  const layers = Object.keys(byLayer).sort(
    (a, b) => (LAYER_ORDER[a as LayerType] || 99) - (LAYER_ORDER[b as LayerType] || 99)
  );

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 80;
  const H_GAP = 60;
  const V_GAP = 120;
  const LAYER_GAP = 200;

  let yOffset = 80;
  for (const layer of layers) {
    const ids = byLayer[layer];
    let xOffset = 60;
    ids.forEach((id) => {
      positions[id] = { x: xOffset, y: yOffset };
      xOffset += NODE_WIDTH + H_GAP;
    });
    yOffset += NODE_HEIGHT + V_GAP + LAYER_GAP;
  }

  return positions;
}

export function getFileIcon(type: FileType): string {
  const icons: Record<FileType, string> = {
    component: '⚛️',
    controller: '🎮',
    service: '⚙️',
    model: '🗄️',
    utility: '🔧',
    config: '⚡',
    test: '🧪',
    style: '🎨',
    type: '📐',
    index: '📋',
    unknown: '📄',
  };
  return icons[type] || '📄';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
