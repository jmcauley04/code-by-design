# Code by Design

A visual project design tool that lets you inspect, design, and generate code for software projects using a UML-style interface.

## Features

- 📁 **Folder Analysis** — Load any project folder and automatically detect its structure
- 🎨 **Visual Graph** — Zoomable, pannable ReactFlow canvas with drag-and-drop node positioning
- 🏗️ **Layered Views** — Toggle between file reference, function-level, and framework-specific layers
- 🔍 **Node Inspection** — Click any file node to view metadata, functions, and raw code
- ⚡ **Code Generation** — Generate or regenerate files based on your visual design
- 🌐 **Multi-Language** — TypeScript, JavaScript, Python, Java, Go, Rust, and more
- 🔧 **Framework Support** — React, Next.js, Vue, Express, Django, Flask, and more

## Project Structure

```
code-by-design/
├── frontend/          # React + TypeScript + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── Canvas/       # ReactFlow visual graph
│       │   ├── Sidebar/      # File tree, layers, settings
│       │   ├── NodePanel/    # Node detail inspector
│       │   └── Toolbar/      # Top action bar
│       ├── api/              # Backend API client
│       ├── store/            # Zustand state management
│       ├── types/            # TypeScript type definitions
│       └── utils/            # Node utilities and layout
└── backend/           # Node.js + Express + TypeScript API
    └── src/
        ├── routes/           # API route handlers
        ├── services/         # Business logic
        │   ├── analyzeService    # Code parser (imports, functions, classes)
        │   ├── fileService       # File system operations
        │   └── generateService   # Code generation templates
        └── types/            # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

```bash
# Install all dependencies
npm install

# Or install individually
cd backend && npm install
cd frontend && npm install
```

### Running

```bash
# Start both backend and frontend (from root)
npm run dev

# Or separately:
npm run dev:backend   # Starts on http://localhost:3001
npm run dev:frontend  # Starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

### Usage

1. Enter a folder path in the sidebar (e.g., `/home/user/my-project`)
2. Select the language and framework if not auto-detected
3. Click **▶ Load** to analyze the project
4. Explore the visual graph — nodes represent files, edges show import relationships
5. Click any node to inspect its metadata, functions, and code
6. Use the **Layers** tab to toggle different relationship views
7. Click **⚡ Generate All** to regenerate files based on your design

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/files/analyze` | Analyze a project folder |
| `GET` | `/api/files/tree` | Get directory tree |
| `GET` | `/api/files/content` | Read file content |
| `POST` | `/api/files/content` | Write file content |
| `POST` | `/api/generate/file` | Generate code for a single file |
| `POST` | `/api/generate/project` | Generate code for entire project |
| `POST` | `/api/generate/scaffold` | Generate a new project scaffold |

## Node Types & Colors

| Type | Color | Description |
|------|-------|-------------|
| Component | 🔵 Cyan | UI components (React, Vue, etc.) |
| Controller | 🔴 Red | Route handlers and controllers |
| Service | 🟣 Purple | Business logic services |
| Model | 🟢 Green | Data models and entities |
| Utility | 🟡 Yellow | Helper functions and utilities |
| Config | ⚫ Slate | Configuration files |
| Test | 🟠 Amber | Test files |
| Style | 🩷 Pink | CSS/SCSS stylesheets |
| Types | 🔵 Cyan | TypeScript type definitions |

## Layers

- **File References** — Shows import/export dependencies between files
- **Function Layer** — Shows function-level relationships (planned)
- **Framework View** — Shows framework-specific relationships (planned)

## Building

```bash
# Build for production
npm run build

# Start production backend
npm run start
```
