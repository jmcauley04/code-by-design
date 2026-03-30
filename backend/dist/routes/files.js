"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesRouter = void 0;
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fileService_js_1 = require("../services/fileService.js");
const analyzeService_js_1 = require("../services/analyzeService.js");
exports.filesRouter = (0, express_1.Router)();
exports.filesRouter.post('/analyze', (req, res) => {
    const { rootPath, language, framework } = req.body;
    if (!rootPath) {
        res.status(400).json({ error: 'rootPath is required' });
        return;
    }
    try {
        const files = (0, fileService_js_1.readProjectFiles)(rootPath);
        const edges = (0, fileService_js_1.buildEdges)(files);
        const detectedLanguage = language || detectLanguage(files);
        const detectedFramework = framework || detectFramework(files, detectedLanguage);
        res.json({
            name: path_1.default.basename(rootPath),
            rootPath,
            language: detectedLanguage,
            framework: detectedFramework,
            files,
            edges,
        });
    }
    catch (error) {
        res.status(500).json({ error: `Failed to analyze project: ${error.message}` });
    }
});
exports.filesRouter.get('/tree', (req, res) => {
    const { rootPath } = req.query;
    if (!rootPath) {
        res.status(400).json({ error: 'rootPath is required' });
        return;
    }
    try {
        const tree = (0, fileService_js_1.getDirectoryTree)(rootPath);
        res.json(tree);
    }
    catch (error) {
        res.status(500).json({ error: `Failed to read directory: ${error.message}` });
    }
});
exports.filesRouter.get('/content', (req, res) => {
    const { filePath } = req.query;
    if (!filePath) {
        res.status(400).json({ error: 'filePath is required' });
        return;
    }
    try {
        const content = (0, fileService_js_1.readFileContent)(filePath);
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: `Failed to read file: ${error.message}` });
    }
});
exports.filesRouter.post('/content', (req, res) => {
    const { filePath, content } = req.body;
    if (!filePath || content === undefined) {
        res.status(400).json({ error: 'filePath and content are required' });
        return;
    }
    try {
        (0, fileService_js_1.writeFileContent)(filePath, content);
        // Re-analyze the updated file
        const ext = path_1.default.extname(filePath).toLowerCase();
        const langMap = {
            '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript',
            '.jsx': 'javascript', '.py': 'python', '.java': 'java',
        };
        const language = langMap[ext] || 'text';
        const relativePath = path_1.default.basename(filePath);
        const updated = (0, analyzeService_js_1.analyzeFile)(filePath, relativePath, language);
        res.json({ success: true, node: updated });
    }
    catch (error) {
        res.status(500).json({ error: `Failed to write file: ${error.message}` });
    }
});
function detectLanguage(files) {
    const langCount = {};
    for (const file of files) {
        langCount[file.language] = (langCount[file.language] || 0) + 1;
    }
    const entries = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || 'typescript';
}
function detectFramework(files, language) {
    const paths = files.map(f => f.path.toLowerCase());
    const names = files.map(f => f.name.toLowerCase());
    if (names.includes('package.json')) {
        if (paths.some(p => p.includes('components/') || p.endsWith('.tsx') || p.endsWith('.jsx'))) {
            if (paths.some(p => p.includes('pages/') || p.includes('app/') || p.includes('_app.')))
                return 'nextjs';
            return 'react';
        }
        if (paths.some(p => p.endsWith('.vue')))
            return 'vue';
        if (paths.some(p => p.endsWith('.svelte')))
            return 'svelte';
        if (paths.some(p => p.includes('routes/') || p.includes('controllers/')))
            return 'express';
    }
    if (names.includes('requirements.txt') || names.includes('setup.py')) {
        if (paths.some(p => p.includes('views/') || p.includes('models/'))) {
            if (paths.some(p => p.includes('settings.py')))
                return 'django';
            return 'flask';
        }
        return 'python';
    }
    return language;
}
