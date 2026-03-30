"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFileContent = generateFileContent;
exports.generateProject = generateProject;
const templates = [
    // TypeScript React Component
    {
        language: 'typescript',
        framework: 'react',
        fileType: 'component',
        generate: (node) => `import React from 'react';

interface ${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}Props {
  // Add props here
}

const ${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}: React.FC<${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}Props> = (props) => {
${node.functions.map(fn => `
  const ${fn.name} = ${fn.isAsync ? 'async ' : ''}(${fn.params.join(', ')}): ${fn.returnType || 'void'} => {
    // TODO: implement ${fn.goal || fn.name}
  };
`).join('')}
  return (
    <div className="${toKebabCase(node.name.replace(/\.[^.]+$/, ''))}">
      {/* ${node.name} component */}
    </div>
  );
};

export default ${toPascalCase(node.name.replace(/\.[^.]+$/, ''))};
`,
    },
    // TypeScript Service
    {
        language: 'typescript',
        framework: 'any',
        fileType: 'service',
        generate: (node) => `${node.imports.filter(i => !i.startsWith('.')).map(i => `import { } from '${i}';`).join('\n')}

export class ${toPascalCase(node.name.replace(/\.[^.]+$/, ''))} {
${node.functions.map(fn => `
  ${fn.isAsync ? 'async ' : ''}${fn.name}(${fn.params.join(', ')}): ${fn.isAsync ? `Promise<${fn.returnType || 'void'}>` : fn.returnType || 'void'} {
    // TODO: implement ${fn.goal || fn.name}
    throw new Error('Not implemented');
  }
`).join('')}
}

export const ${toCamelCase(node.name.replace(/\.[^.]+$/, ''))} = new ${toPascalCase(node.name.replace(/\.[^.]+$/, ''))};
`,
    },
    // TypeScript Controller
    {
        language: 'typescript',
        framework: 'express',
        fileType: 'controller',
        generate: (node) => `import { Request, Response, Router } from 'express';

export const ${toCamelCase(node.name.replace(/\.[^.]+$/, ''))}Router = Router();

${node.functions.map(fn => `
${toCamelCase(node.name.replace(/\.[^.]+$/, ''))}Router.get('/${toKebabCase(fn.name)}', ${fn.isAsync ? 'async ' : ''}(req: Request, res: Response) => {
  // TODO: implement ${fn.goal || fn.name}
  res.json({ message: '${fn.name} endpoint' });
});
`).join('')}
`,
    },
    // TypeScript Model
    {
        language: 'typescript',
        framework: 'any',
        fileType: 'model',
        generate: (node) => `export interface ${toPascalCase(node.name.replace(/\.[^.]+$/, ''))} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add fields here
}

export type Create${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}Dto = Omit<${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}, 'id' | 'createdAt' | 'updatedAt'>;
export type Update${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}Dto = Partial<Create${toPascalCase(node.name.replace(/\.[^.]+$/, ''))}Dto>;
`,
    },
    // Python Module
    {
        language: 'python',
        framework: 'any',
        fileType: 'unknown',
        generate: (node) => `"""${node.name} module."""

${node.imports.filter(i => !i.startsWith('.')).map(i => `import ${i}`).join('\n')}

${node.functions.map(fn => `
${fn.isAsync ? 'async ' : ''}def ${fn.name}(${fn.params.join(', ')}):
    """${fn.goal || fn.name}."""
    # TODO: implement
    raise NotImplementedError
`).join('\n')}
`,
    },
    // Default TypeScript file
    {
        language: 'typescript',
        framework: 'any',
        fileType: 'unknown',
        generate: (node) => `// ${node.name}
${node.imports.filter(i => !i.startsWith('.')).slice(0, 5).map(i => `import {} from '${i}';`).join('\n')}

${node.functions.map(fn => `
export ${fn.isAsync ? 'async ' : ''}function ${fn.name}(${fn.params.join(', ')}): ${fn.isAsync ? `Promise<${fn.returnType || 'void'}>` : fn.returnType || 'void'} {
  // TODO: implement ${fn.goal || fn.name}
  throw new Error('Not implemented');
}
`).join('')}
`,
    },
];
function generateFileContent(node, language, framework) {
    // If file has content and was not explicitly set to regenerate, return as-is
    const template = templates.find(t => t.language === language &&
        (t.framework === framework || t.framework === 'any') &&
        t.fileType === node.type) || templates.find(t => t.language === language && t.framework === 'any' && t.fileType === 'unknown') || templates[templates.length - 1];
    return template.generate(node);
}
function generateProject(req) {
    const result = {};
    for (const file of req.files) {
        if (file.type === 'style' || file.type === 'config')
            continue;
        result[file.path] = generateFileContent(file, req.language, req.framework);
    }
    // Generate index file
    result['index.ts'] = generateIndexFile(req);
    return result;
}
function generateIndexFile(req) {
    const components = req.files.filter(f => f.type === 'component');
    const services = req.files.filter(f => f.type === 'service');
    return `// ${req.projectName} - Generated by Code by Design
// Language: ${req.language}, Framework: ${req.framework}

${components.map(c => `export * from './${c.path}';`).join('\n')}
${services.map(s => `export * from './${s.path}';`).join('\n')}
`;
}
// Utility helpers
function toPascalCase(str) {
    return str
        .replace(/[-_./](\w)/g, (_, c) => c.toUpperCase())
        .replace(/^\w/, c => c.toUpperCase());
}
function toCamelCase(str) {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
function toKebabCase(str) {
    return str
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/_/g, '-');
}
