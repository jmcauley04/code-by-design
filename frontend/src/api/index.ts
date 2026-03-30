import axios from 'axios';
import type { ProjectInfo, FileNode } from '../types/index.js';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function analyzeProject(rootPath: string, language?: string, framework?: string): Promise<ProjectInfo> {
  const { data } = await api.post('/files/analyze', { rootPath, language, framework });
  return data as ProjectInfo;
}

export async function getDirectoryTree(rootPath: string): Promise<unknown> {
  const { data } = await api.get('/files/tree', { params: { rootPath } });
  return data;
}

export async function getFileContent(filePath: string): Promise<string> {
  const { data } = await api.get('/files/content', { params: { filePath } });
  return (data as { content: string }).content;
}

export async function saveFileContent(filePath: string, content: string): Promise<{ success: boolean; node: FileNode }> {
  const { data } = await api.post('/files/content', { filePath, content });
  return data as { success: boolean; node: FileNode };
}

export async function generateFile(node: FileNode, language: string, framework: string): Promise<string> {
  const { data } = await api.post('/generate/file', { node, language, framework });
  return (data as { content: string }).content;
}

export async function generateProject(files: FileNode[], language: string, framework: string, projectName: string): Promise<Record<string, string>> {
  const { data } = await api.post('/generate/project', { files, language, framework, projectName });
  return (data as { files: Record<string, string> }).files;
}

export async function scaffoldProject(projectName: string, language: string, framework: string, fileTypes: string[]): Promise<Record<string, string>> {
  const { data } = await api.post('/generate/scaffold', { projectName, language, framework, fileTypes });
  return (data as { scaffold: Record<string, string> }).scaffold;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}
