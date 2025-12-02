# Sable Desktop

An AI-powered "Operating System Layer" for macOS and Windows.

## Features

### Flow Mode (Overlay)
- Floating, transparent glass chat panel
- Fully draggable and resizable
- Samsung Edge-style dock handle on the right screen edge
- Multiple chat windows support
- AI-powered conversations via Groq API

### Focus Mode (Coming Soon)
- Full-screen workspace overlay
- Widget dashboard with customizable layouts
- Todo, Weather, Clipboard, and File Explorer widgets

## Tech Stack

- **Runtime**: Electron (TypeScript)
- **Frontend**: React + Vite
- **State Management**: Zustand
- **Styling**: TailwindCSS with Glassmorphism
- **Animation**: Framer Motion
- **AI**: Groq API (LLaMA 3.1)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd sable-desktop
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Add your Groq API key to `.env`:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### Development

Run the development server with Electron:
```bash
npm run electron:dev
```

Or run just the web version for quick UI development:
```bash
npm run dev
```

### Building

Build for production:
```bash
npm run electron:build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Space` | Toggle/Create new chat window |
| `Escape` | Minimize chat to dock |

## Project Structure

```
sable-desktop/
├── electron/           # Electron main process
│   ├── main.ts         # Main window configuration
│   └── preload.ts      # IPC bridge
├── src/
│   ├── components/
│   │   └── FlowMode/   # Flow Mode components
│   ├── services/       # API services (Groq)
│   ├── store/          # Zustand state management
│   └── lib/            # Utilities
└── ...config files
```

## License

MIT
