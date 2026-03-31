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

  for (const file of files) {
    for (const importPath of file.imports) {
      const target = findTargetFile(importPath, file.path, files);
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

/**
 * Attempt to resolve an import string to a project FileNode.
 *
 * Resolution rules (in priority order):
 *  1. Relative imports (start with ".") → resolve against the source file's
 *     directory using the exact normalised path + common extension suffixes.
 *  2. Alias imports (start with "@/") → resolve against every likely source
 *     root ("src/", "") with the same extension probing.
 *  3. Bare imports without a "/" (e.g. "react", "express") are third-party
 *     packages and are intentionally ignored.
 *  4. Slash-containing non-relative paths (e.g. "services/user") → try a
 *     name-only fallback as a last resort.
 *
 * Name-only fallback is only used when the basename is non-trivial (not
 * "index") to avoid false positives from ambiguous barrel exports.
 */
function findTargetFile(importPath: string, sourceFile: string, files: FileNode[]): FileNode | undefined {
  // Strip inline quotes that sometimes survive the regex extraction
  const raw = importPath.replace(/['"]/g, '').trim();
  if (!raw) return undefined;

  const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte'];

  // ── Helper: resolve a base path against the file list ──────────────────────
  function resolveBase(base: string): FileNode | undefined {
    const normalized = path.normalize(base);
    // 1. Exact match
    const exact = files.find(f => path.normalize(f.path) === normalized);
    if (exact) return exact;
    // 2. Match with extension appended
    for (const ext of EXTS) {
      const withExt = files.find(f => path.normalize(f.path) === path.normalize(base + ext));
      if (withExt) return withExt;
    }
    // 3. Match as a directory index
    for (const ext of EXTS) {
      const asIndex = files.find(f => path.normalize(f.path) === path.normalize(path.join(base, 'index' + ext)));
      if (asIndex) return asIndex;
    }
    return undefined;
  }

  // ── 1. Relative import ─────────────────────────────────────────────────────
  if (raw.startsWith('.')) {
    const sourceDir = path.dirname(sourceFile);
    // Remove any extension on the import so we can probe all extensions
    const withoutExt = raw.replace(/\.(ts|tsx|js|jsx|mjs|vue|svelte)$/, '');
    const resolved = resolveBase(path.join(sourceDir, withoutExt));
    if (resolved) return resolved;
    // Fallback: name-only match for non-index basenames (handles monorepos
    // where the relative path root differs from the on-disk root)
    const baseName = path.basename(withoutExt).toLowerCase();
    if (baseName && baseName !== 'index') {
      return files.find(f => {
        const fn = path.basename(f.path, path.extname(f.path)).toLowerCase();
        return fn === baseName;
      });
    }
    return undefined;
  }

  // ── 2. Alias import (e.g. "@/components/Button") ──────────────────────────
  if (raw.startsWith('@/')) {
    const withoutAlias = raw.slice(2).replace(/\.(ts|tsx|js|jsx|mjs|vue|svelte)$/, '');
    for (const srcRoot of ['src/', '']) {
      const resolved = resolveBase(path.join(srcRoot, withoutAlias));
      if (resolved) return resolved;
    }
    return undefined;
  }

  // ── 3. Bare package import (no "/" in the name) → skip ────────────────────
  if (!raw.includes('/')) return undefined;

  // ── 4. Slash path without "./" prefix (internal path alias, e.g.
  //        "components/Button" or "services/user") ──────────────────────────
  const withoutExt = raw.replace(/\.(ts|tsx|js|jsx|mjs|vue|svelte)$/, '');
  for (const srcRoot of ['src/', '']) {
    const resolved = resolveBase(path.join(srcRoot, withoutExt));
    if (resolved) return resolved;
  }
  // Last-resort name match (only for non-index)
  const baseName = path.basename(withoutExt).toLowerCase();
  if (baseName && baseName !== 'index') {
    return files.find(f => {
      const fn = path.basename(f.path, path.extname(f.path)).toLowerCase();
      return fn === baseName;
    });
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
