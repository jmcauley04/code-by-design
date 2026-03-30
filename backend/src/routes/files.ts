import { Router, Request, Response } from 'express';
import path from 'path';
import { readProjectFiles, buildEdges, readFileContent, writeFileContent, getDirectoryTree } from '../services/fileService.js';
import { analyzeFile } from '../services/analyzeService.js';

export const filesRouter = Router();

filesRouter.post('/analyze', (req: Request, res: Response) => {
  const { rootPath, language, framework } = req.body as { rootPath: string; language?: string; framework?: string };

  if (!rootPath) {
    res.status(400).json({ error: 'rootPath is required' });
    return;
  }

  try {
    const files = readProjectFiles(rootPath);
    const edges = buildEdges(files);

    const detectedLanguage = language || detectLanguage(files);
    const detectedFramework = framework || detectFramework(files, detectedLanguage);

    res.json({
      name: path.basename(rootPath),
      rootPath,
      language: detectedLanguage,
      framework: detectedFramework,
      files,
      edges,
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to analyze project: ${(error as Error).message}` });
  }
});

filesRouter.get('/tree', (req: Request, res: Response) => {
  const { rootPath } = req.query as { rootPath: string };

  if (!rootPath) {
    res.status(400).json({ error: 'rootPath is required' });
    return;
  }

  try {
    const tree = getDirectoryTree(rootPath);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: `Failed to read directory: ${(error as Error).message}` });
  }
});

filesRouter.get('/content', (req: Request, res: Response) => {
  const { filePath } = req.query as { filePath: string };

  if (!filePath) {
    res.status(400).json({ error: 'filePath is required' });
    return;
  }

  try {
    const content = readFileContent(filePath);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: `Failed to read file: ${(error as Error).message}` });
  }
});

filesRouter.post('/content', (req: Request, res: Response) => {
  const { filePath, content } = req.body as { filePath: string; content: string };

  if (!filePath || content === undefined) {
    res.status(400).json({ error: 'filePath and content are required' });
    return;
  }

  try {
    writeFileContent(filePath, content);
    // Re-analyze the updated file
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript',
      '.jsx': 'javascript', '.py': 'python', '.java': 'java',
    };
    const language = langMap[ext] || 'text';
    const relativePath = path.basename(filePath);
    const updated = analyzeFile(filePath, relativePath, language);
    res.json({ success: true, node: updated });
  } catch (error) {
    res.status(500).json({ error: `Failed to write file: ${(error as Error).message}` });
  }
});

function detectLanguage(files: { language: string }[]): string {
  const langCount: Record<string, number> = {};
  for (const file of files) {
    langCount[file.language] = (langCount[file.language] || 0) + 1;
  }
  const entries = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || 'typescript';
}

function detectFramework(files: { path: string; name: string }[], language: string): string {
  const paths = files.map(f => f.path.toLowerCase());
  const names = files.map(f => f.name.toLowerCase());

  if (names.includes('package.json')) {
    if (paths.some(p => p.includes('components/') || p.endsWith('.tsx') || p.endsWith('.jsx'))) {
      if (paths.some(p => p.includes('pages/') || p.includes('app/') || p.includes('_app.'))) return 'nextjs';
      return 'react';
    }
    if (paths.some(p => p.endsWith('.vue'))) return 'vue';
    if (paths.some(p => p.endsWith('.svelte'))) return 'svelte';
    if (paths.some(p => p.includes('routes/') || p.includes('controllers/'))) return 'express';
  }

  if (names.includes('requirements.txt') || names.includes('setup.py')) {
    if (paths.some(p => p.includes('views/') || p.includes('models/'))) {
      if (paths.some(p => p.includes('settings.py'))) return 'django';
      return 'flask';
    }
    return 'python';
  }

  return language;
}
