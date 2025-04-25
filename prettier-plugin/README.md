# Prettier Plugin

A plugin for text editors that provides code formatting using Prettier.

## Features

- Format document with Prettier
- Supports multiple languages and file types
- Accessible from the Edit menu or via keyboard shortcut (Shift+Alt+F)

## Installation

### Prerequisites

- Node.js 16 or higher
- A compatible text editor that supports the plugin protocol

### Installation Steps

1. Download the plugin ZIP file
2. Install the plugin through your text editor's plugin manager
3. The plugin will automatically connect to the text editor

## Usage

1. Open a code file in your editor
2. Use the "Format Document" command from the Edit menu
3. Alternatively, use the keyboard shortcut Shift+Alt+F

## Supported File Types

The plugin automatically detects the file type based on the extension and uses the appropriate Prettier parser:

- JavaScript (.js, .jsx, .mjs, .cjs)
- TypeScript (.ts, .tsx)
- CSS (.css)
- SCSS/SASS (.scss, .sass)
- LESS (.less)
- JSON (.json, .jsonc)
- Markdown (.md, .markdown)
- HTML (.html, .htm)
- Vue (.vue)
- YAML (.yaml, .yml)
- GraphQL (.graphql, .gql)

## Configuration

The plugin uses Prettier's default configuration. In future versions, it will support reading from a .prettierrc file in your project.

## Development

To build the plugin from source:

```bash
npm install
npm run build
```

## License

MIT
