"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFile = analyzeFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
function analyzeFile(fullPath, relativePath, language) {
    let content = '';
    let size = 0;
    try {
        const stat = fs_1.default.statSync(fullPath);
        size = stat.size;
        if (size < 500000) {
            content = fs_1.default.readFileSync(fullPath, 'utf-8');
        }
    }
    catch {
        // ignore
    }
    const id = crypto_1.default.createHash('md5').update(relativePath).digest('hex').slice(0, 8);
    const name = path_1.default.basename(relativePath);
    const fileType = detectFileType(name, relativePath, language);
    const layer = detectLayer(relativePath, fileType, language);
    const imports = language === 'python'
        ? extractPythonImports(content)
        : extractJsImports(content);
    const exports_ = language === 'python'
        ? extractPythonExports(content)
        : extractJsExports(content);
    const functions = language === 'python'
        ? extractPythonFunctions(content)
        : extractJsFunctions(content);
    const classes = language === 'python'
        ? extractPythonClasses(content)
        : extractJsClasses(content);
    return {
        id,
        path: relativePath,
        name,
        type: fileType,
        language,
        content: size < 100000 ? content : undefined,
        imports,
        exports: exports_,
        functions,
        classes,
        size,
        layer,
    };
}
function detectFileType(name, relPath, language) {
    const lower = name.toLowerCase();
    const pathLower = relPath.toLowerCase().replace(/\\/g, '/');
    if (lower.match(/\.(test|spec)\.(ts|tsx|js|jsx|py)$/))
        return 'test';
    if (lower.match(/\.stories\.(ts|tsx|js|jsx)$/))
        return 'unknown';
    if (lower === 'index.ts' || lower === 'index.tsx' || lower === 'index.js' || lower === '__init__.py')
        return 'index';
    if (lower.match(/\.(css|scss|sass|less|styl)$/))
        return 'style';
    if (lower.match(/\.(d\.ts|types?\.ts|interfaces?\.ts)$/))
        return 'type';
    if (lower.match(/config|settings|env|\.json|\.yaml|\.yml|\.env/i))
        return 'config';
    if (pathLower.includes('/controller') || lower.includes('controller') || lower.includes('handler') || lower.includes('resolver'))
        return 'controller';
    if (pathLower.includes('/service') || lower.includes('service') || lower.includes('repository') || lower.includes('repo'))
        return 'service';
    if (pathLower.includes('/model') || lower.includes('model') || lower.includes('entity') || lower.includes('schema'))
        return 'model';
    if (pathLower.includes('/component') || lower.match(/\.(tsx|jsx|vue|svelte)$/) || lower.includes('component') || lower.includes('page') || lower.includes('view'))
        return 'component';
    if (pathLower.includes('/util') || lower.includes('util') || lower.includes('helper') || lower.includes('lib'))
        return 'utility';
    if (language === 'typescript' || language === 'javascript') {
        if (lower.endsWith('.tsx') || lower.endsWith('.jsx'))
            return 'component';
    }
    return 'unknown';
}
function detectLayer(relPath, fileType, language) {
    const pathLower = relPath.toLowerCase().replace(/\\/g, '/');
    if (pathLower.includes('/component') || pathLower.includes('/page') || pathLower.includes('/view') || pathLower.includes('/ui'))
        return 'ui';
    if (pathLower.includes('/controller') || pathLower.includes('/route') || pathLower.includes('/handler') || pathLower.includes('/api'))
        return 'backend';
    if (pathLower.includes('/service') || pathLower.includes('/domain') || pathLower.includes('/use-case') || pathLower.includes('/usecase'))
        return 'domain';
    if (pathLower.includes('/model') || pathLower.includes('/entity') || pathLower.includes('/repository') || pathLower.includes('/infra'))
        return 'infrastructure';
    if (pathLower.includes('/config') || pathLower.includes('/setting') || pathLower.includes('/env'))
        return 'config';
    if (fileType === 'component')
        return 'ui';
    if (fileType === 'controller')
        return 'backend';
    if (fileType === 'service')
        return 'domain';
    if (fileType === 'model')
        return 'infrastructure';
    if (fileType === 'config')
        return 'config';
    return 'shared';
}
// JS/TS analysis
function extractJsImports(content) {
    const imports = [];
    const patterns = [
        /^import\s+.*?\s+from\s+['"]([^'"]+)['"]/gm,
        /^import\s+['"]([^'"]+)['"]/gm,
        /require\(['"]([^'"]+)['"]\)/g,
        /^export\s+.*?\s+from\s+['"]([^'"]+)['"]/gm,
    ];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
    }
    return [...new Set(imports)];
}
function extractJsExports(content) {
    const exports_ = [];
    const patterns = [
        /^export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+(\w+)/gm,
        /^module\.exports\s*=\s*\{([^}]+)\}/gm,
        /^exports\.(\w+)\s*=/gm,
    ];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            if (match[1])
                exports_.push(match[1].trim());
        }
    }
    return [...new Set(exports_)];
}
function extractJsFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    const patterns = [
        /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
        /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::\s*\S+\s*)?=>/,
        /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)/,
        /^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*\S+\s*)?\{/,
        /^\s+(?:private|public|protected|static|async|\s)*\s+(\w+)\s*\(([^)]*)\)/,
    ];
    lines.forEach((line, index) => {
        for (const pattern of patterns) {
            const match = pattern.exec(line);
            if (match && match[1] && match[1] !== 'if' && match[1] !== 'for' && match[1] !== 'while') {
                const name = match[1];
                const params = match[2]
                    ? match[2].split(',').map(p => p.trim()).filter(Boolean)
                    : [];
                const isAsync = line.includes('async ');
                const isExported = line.includes('export ');
                const isPrivate = line.includes('private ') || name.startsWith('_');
                const returnTypeMatch = line.match(/\)\s*:\s*([^{=]+)/);
                const returnType = returnTypeMatch ? returnTypeMatch[1].trim() : 'void';
                if (!functions.find(f => f.name === name)) {
                    functions.push({
                        name,
                        params,
                        returnType,
                        isAsync,
                        isExported,
                        isPrivate,
                        startLine: index + 1,
                        endLine: index + 1,
                    });
                }
                break;
            }
        }
    });
    return functions.slice(0, 50);
}
function extractJsClasses(content) {
    const classes = [];
    const classPattern = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm;
    let match;
    while ((match = classPattern.exec(content)) !== null) {
        const isExported = content.substring(Math.max(0, match.index - 10), match.index + match[0].length).includes('export');
        classes.push({
            name: match[1],
            isExported,
            methods: [],
            properties: [],
        });
    }
    return classes;
}
// Python analysis
function extractPythonImports(content) {
    const imports = [];
    const patterns = [
        /^import\s+(\S+)/gm,
        /^from\s+(\S+)\s+import/gm,
    ];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
    }
    return [...new Set(imports)];
}
function extractPythonExports(content) {
    const exports_ = [];
    const pattern = /^(?:def|class)\s+(\w+)/gm;
    let match;
    while ((match = pattern.exec(content)) !== null) {
        if (!match[1].startsWith('_')) {
            exports_.push(match[1]);
        }
    }
    return exports_;
}
function extractPythonFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    const pattern = /^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/;
    lines.forEach((line, index) => {
        const match = pattern.exec(line);
        if (match) {
            const name = match[2];
            const params = match[3]
                ? match[3].split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p && p !== 'self')
                : [];
            const isAsync = line.includes('async ');
            const isPrivate = name.startsWith('_');
            const isExported = !isPrivate;
            const returnTypeMatch = line.match(/->\s*([^:]+):/);
            const returnType = returnTypeMatch ? returnTypeMatch[1].trim() : '';
            functions.push({
                name,
                params,
                returnType,
                isAsync,
                isExported,
                isPrivate,
                startLine: index + 1,
                endLine: index + 1,
            });
        }
    });
    return functions.slice(0, 50);
}
function extractPythonClasses(content) {
    const classes = [];
    const pattern = /^class\s+(\w+)/gm;
    let match;
    while ((match = pattern.exec(content)) !== null) {
        classes.push({
            name: match[1],
            isExported: true,
            methods: [],
            properties: [],
        });
    }
    return classes;
}
