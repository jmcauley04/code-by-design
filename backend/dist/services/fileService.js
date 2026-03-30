"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readProjectFiles = readProjectFiles;
exports.buildEdges = buildEdges;
exports.readFileContent = readFileContent;
exports.writeFileContent = writeFileContent;
exports.getDirectoryTree = getDirectoryTree;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const analyzeService_js_1 = require("./analyzeService.js");
const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
    '__pycache__', '.venv', 'venv', '.env', 'vendor', 'target',
    '.gradle', 'bin', 'obj',
]);
const SUPPORTED_EXTENSIONS = {
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
function readProjectFiles(rootPath) {
    const files = [];
    traverseDirectory(rootPath, rootPath, files);
    return files;
}
function traverseDirectory(rootPath, dirPath, files) {
    let entries;
    try {
        entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env.example') {
            continue;
        }
        if (IGNORED_DIRS.has(entry.name))
            continue;
        const fullPath = path_1.default.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            traverseDirectory(rootPath, fullPath, files);
        }
        else if (entry.isFile()) {
            const ext = path_1.default.extname(entry.name).toLowerCase();
            const language = SUPPORTED_EXTENSIONS[ext];
            if (language) {
                const relativePath = path_1.default.relative(rootPath, fullPath);
                const node = (0, analyzeService_js_1.analyzeFile)(fullPath, relativePath, language);
                files.push(node);
            }
        }
    }
}
function buildEdges(files) {
    const edges = [];
    const fileMap = new Map();
    for (const file of files) {
        fileMap.set(file.path, file);
        const basename = path_1.default.basename(file.path, path_1.default.extname(file.path));
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
function normalizeImport(importPath) {
    return importPath.replace(/['"]/g, '').replace(/^@\//, '').trim();
}
function findTargetFile(importPath, sourceFile, files) {
    const sourceDir = path_1.default.dirname(sourceFile);
    const candidates = [];
    if (importPath.startsWith('.')) {
        const resolved = path_1.default.join(sourceDir, importPath);
        candidates.push(resolved);
        for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte']) {
            candidates.push(resolved + ext);
            candidates.push(path_1.default.join(resolved, 'index' + ext));
        }
    }
    const importName = path_1.default.basename(importPath).toLowerCase();
    for (const file of files) {
        const fileName = path_1.default.basename(file.path, path_1.default.extname(file.path)).toLowerCase();
        if (fileName === importName)
            return file;
    }
    for (const candidate of candidates) {
        const match = files.find(f => f.path === candidate || path_1.default.resolve(f.path) === path_1.default.resolve(candidate));
        if (match)
            return match;
    }
    return undefined;
}
function readFileContent(filePath) {
    try {
        return fs_1.default.readFileSync(filePath, 'utf-8');
    }
    catch {
        return '';
    }
}
function writeFileContent(filePath, content) {
    fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
    fs_1.default.writeFileSync(filePath, content, 'utf-8');
}
function getDirectoryTree(rootPath) {
    return buildTree(rootPath, rootPath);
}
function buildTree(rootPath, dirPath) {
    const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
    const children = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.'))
            continue;
        if (IGNORED_DIRS.has(entry.name))
            continue;
        const fullPath = path_1.default.join(dirPath, entry.name);
        const relativePath = path_1.default.relative(rootPath, fullPath);
        if (entry.isDirectory()) {
            children.push({
                name: entry.name,
                path: relativePath,
                type: 'directory',
                children: buildTree(rootPath, fullPath),
            });
        }
        else {
            const ext = path_1.default.extname(entry.name).toLowerCase();
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
