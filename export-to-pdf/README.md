# Export to PDF Plugin

A plugin for text editors that allows exporting text content to PDF files with proper Vietnamese character support.

## Features

- Export text content to PDF files
- Support for Vietnamese characters with proper encoding
- Clean, professional PDF output with customizable formatting

## Installation

### Prerequisites

- Node.js 16 or higher
- A compatible text editor that supports the plugin protocol

### Installation Steps

1. Download the plugin ZIP file
2. Extract the ZIP file to a directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start your text editor with plugin support enabled
5. The plugin will automatically connect to the text editor on port 5000

## Usage

1. Open a text file in your editor
2. Use the "Export to PDF" command from your editor's menu or command palette
3. Choose a destination file path for the PDF
4. The plugin will generate a PDF file with your text content

## Configuration

The plugin uses the following default settings:

- Connection port: 5000
- Plugin name: "pdf-export"
- Default font: Roboto

## Troubleshooting

If the plugin fails to connect to the editor:

1. Make sure your editor is running and supports plugins
2. Check that port 5000 is not blocked by a firewall
3. Verify that the plugin is properly installed

## License

ISC License

## Credits

Created by Text Editor Team
