export interface FileNode {
  id: string;
  path: string;
  name: string;
  type: FileType;
  language: string;
  content?: string;
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  size: number;
  layer: LayerType;
  goal?: string;
}

export type FileType =
  | 'component'
  | 'controller'
  | 'service'
  | 'model'
  | 'utility'
  | 'config'
  | 'test'
  | 'style'
  | 'type'
  | 'index'
  | 'unknown';

export type LayerType =
  | 'ui'
  | 'backend'
  | 'domain'
  | 'infrastructure'
  | 'shared'
  | 'config';

export interface FunctionInfo {
  name: string;
  params: string[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  isPrivate: boolean;
  goal?: string;
  startLine: number;
  endLine: number;
}

export interface ClassInfo {
  name: string;
  isExported: boolean;
  methods: FunctionInfo[];
  properties: string[];
}

export interface ProjectInfo {
  name: string;
  rootPath: string;
  language: string;
  framework: string;
  files: FileNode[];
  edges: FileEdge[];
}

export interface FileEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'extends' | 'implements' | 'uses';
}

export type ActiveLayer = 'fileRefs' | 'functions' | 'framework';

export interface AppSettings {
  language: string;
  framework: string;
  showMiniMap: boolean;
  darkMode: boolean;
}
