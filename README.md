# Text Editor Plugins

This directory contains plugins for the Text Editor application. Plugins extend the functionality of the text editor through a modular architecture.

## Plugin Architecture

The Text Editor uses a plugin-based architecture where plugins are:
1. Stored in Firebase Storage
2. Downloaded as zip files
3. Extracted to the plugins directory (`~/.myeditor/plugins/`)
4. Loaded and integrated with the core application through the PluginManager

## Plugin Structure

Each plugin should follow this structure:

```
plugin-name/
├── package.json         # Plugin metadata and dependencies
├── src/                 # Source code
│   └── index.ts         # Main entry point
└── dist/                # Compiled code
    └── index.js         # Compiled entry point
```

### Required Files

#### package.json

The `package.json` file must include:

```json
{
  "name": "plugin-name",         // Unique plugin identifier
  "version": "1.0.0",            // Plugin version
  "description": "...",          // Plugin description
  "author": "...",               // Plugin author
  "main": "dist/index.js",       // Entry point
  "dependencies": {
    // Required dependencies
  }
}
```

#### Main Entry Point (index.ts/js)

The main entry point must:
1. Connect to the Text Editor core via socket
2. Register the plugin with the core
3. Handle messages from the core
4. Process content and return results

Example:

```typescript
import * as net from 'net';

// Plugin information
const pluginInfo = {
  name: 'plugin-name',
  version: '1.0.0',
  description: 'Plugin description',
  author: 'Author Name'
};

// Get port from command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const PORT = portArg ? parseInt(portArg.split('=')[1]) : 5001;
const HOST = 'localhost';

// Create socket connection
const socket = net.createConnection({ port: PORT, host: HOST }, () => {
  console.log('Connected to Text Editor');
  
  // Register plugin
  socket.write(JSON.stringify({
    type: 'register-plugin',
    payload: pluginInfo
  }));
});

// Handle messages
socket.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'execute-plugin') {
      const { content, filePath, options } = message.payload;
      
      // Process content
      // ...
      
      // Send response
      socket.write(JSON.stringify({
        type: 'plugin-response',
        id: message.id,
        payload: {
          success: true,
          message: 'Operation completed successfully',
          data: { result: '...' }
        }
      }));
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});
```

## Plugin Interface

Plugins communicate with the Text Editor core through a defined interface:

### Messages

1. **Register Plugin**
   ```typescript
   {
     type: 'register-plugin',
     payload: {
       name: string,
       version: string,
       description: string,
       author: string
     }
   }
   ```

2. **Execute Plugin**
   ```typescript
   {
     type: 'execute-plugin',
     id: string,
     payload: {
       content: string,
       filePath?: string,
       options?: any
     }
   }
   ```

3. **Plugin Response**
   ```typescript
   {
     type: 'plugin-response',
     id: string,
     payload: {
       success: boolean,
       message: string,
       data?: any
     }
   }
   ```

## Creating a New Plugin

1. Create a new directory in the plugins folder with your plugin name
2. Initialize a new npm project with `npm init`
3. Create the required files (package.json, src/index.ts)
4. Implement the plugin interface
5. Build your plugin with TypeScript/Webpack/Vite
6. Test your plugin locally
7. Package your plugin as a zip file
8. Upload to Firebase Storage using the upload-plugin.js script

## Example Plugins

This directory contains several example plugins:

- **export-to-pdf**: Exports text content to PDF format
- **prettier-plugin**: Formats code using Prettier
- **text-formatter-plugin**: Provides various text formatting options

## Plugin Lifecycle

1. **Installation**: Plugins are downloaded from Firebase Storage and extracted to the plugins directory
2. **Loading**: The PluginManager loads installed plugins on startup
3. **Registration**: Plugins register themselves with the PluginManager
4. **Execution**: The PluginManager executes plugins when requested
5. **Uninstallation**: Plugins can be uninstalled, removing them from the plugins directory

## Development Guidelines

1. Keep plugins focused on a single responsibility
2. Handle errors gracefully and provide meaningful error messages
3. Follow the plugin interface specification
4. Document your plugin's functionality and options
5. Test your plugin thoroughly before distribution
6. Use TypeScript for better type safety and developer experience
