import fs from 'fs';
import path from 'path';
import { FileNode, FileEdge } from '../types/index.js';
import { analyzeFile } from './analyzeService.js';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  '__pycache__', '.venv', 'venv', '.env', 'vendor', 'target',
  '.gradle', 'bin', 'obj',
]);

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.css': 'css',
  '.scss': 'scss',
  '.html': 'html',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
};

export function readProjectFiles(rootPath: string): FileNode[] {
  const files: FileNode[] = [];
  traverseDirectory(rootPath, rootPath, files);
  return files;
}

function traverseDirectory(rootPath: string, dirPath: string, files: FileNode[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') {
      continue;
    }
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      traverseDirectory(rootPath, fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const language = SUPPORTED_EXTENSIONS[ext];
      if (language) {
        const relativePath = path.relative(rootPath, fullPath);
        const node = analyzeFile(fullPath, relativePath, language);
        files.push(node);
      }
    }
  }
}

export function buildEdges(files: FileNode[]): FileEdge[] {
  const edges: FileEdge[] = [];
  const fileMap = new Map<string, FileNode>();

  for (const file of files) {
    fileMap.set(file.path, file);
    const basename = path.basename(file.path, path.extname(file.path));
    fileMap.set(basename.toLowerCase(), file);
    fileMap.set(file.name.toLowerCase(), file);
  }

  for (const file of files) {
    for (const importPath of file.imports) {
      const normalized = normalizeImport(importPath);
      const target = findTargetFile(normalized, file.path, files);
      if (target && target.id !== file.id) {
        const edgeId = `${file.id}->${target.id}`;
        if (!edges.find(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: file.id,
            target: target.id,
            type: 'import',
          });
        }
      }
    }
  }

  return edges;
}

function normalizeImport(importPath: string): string {
  return importPath.replace(/['"]/g, '').replace(/^@\//, '').trim();
}

function findTargetFile(importPath: string, sourceFile: string, files: FileNode[]): FileNode | undefined {
  const sourceDir = path.dirname(sourceFile);
  const candidates: string[] = [];

  if (importPath.startsWith('.')) {
    const resolved = path.join(sourceDir, importPath);
    candidates.push(resolved);
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte']) {
      candidates.push(resolved + ext);
      candidates.push(path.join(resolved, 'index' + ext));
    }
  }

  const importName = path.basename(importPath).toLowerCase();
  for (const file of files) {
    const fileName = path.basename(file.path, path.extname(file.path)).toLowerCase();
    if (fileName === importName) return file;
  }

  for (const candidate of candidates) {
    const match = files.find(f => f.path === candidate || path.resolve(f.path) === path.resolve(candidate));
    if (match) return match;
  }

  return undefined;
}

export function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export function writeFileContent(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function getDirectoryTree(rootPath: string): object {
  return buildTree(rootPath, rootPath);
}

function buildTree(rootPath: string, dirPath: string): object {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const children: object[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath);

    if (entry.isDirectory()) {
      children.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children: buildTree(rootPath, fullPath),
      });
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      children.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        language: SUPPORTED_EXTENSIONS[ext] || 'text',
      });
    }
  }

  return children;
}
