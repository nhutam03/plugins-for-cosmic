import * as net from 'net';
import * as prettier from 'prettier';

// Plugin information
const pluginInfo = {
  name: 'prettier-plugin',
  displayName: 'Prettier',
  version: '1.0.0',
  description: 'Code formatting using Prettier',
  author: 'Text Editor Team'
};

// Menu items to register
const menuItems = [
  {
    id: 'prettier-plugin.formatDocument',
    label: 'Format Document',
    parentMenu: 'edit',
    position: 50, // Position in the Edit menu
    shortcut: 'Shift+Alt+F' // Standard VS Code shortcut for formatting
  }
];

// Message types
enum MessageType {
  REGISTER = 'register-plugin',
  EXECUTE = 'execute-plugin',
  RESPONSE = 'plugin-response',
  REGISTER_MENU = 'register-menu',
  EXECUTE_MENU_ACTION = 'execute-menu-action'
}

// Connect to the text editor
const PORT = process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1] || 5000;
console.log(`Connecting to text editor on port ${PORT}`);

const client = new net.Socket();

client.connect(parseInt(PORT.toString()), 'localhost', () => {
  console.log('Connected to text editor');

  // Register the plugin
  const registerMessage = {
    type: MessageType.REGISTER,
    payload: pluginInfo
  };
  console.log('Sending register message:', JSON.stringify(registerMessage));
  client.write(JSON.stringify(registerMessage));

  // Register menu items
  setTimeout(() => {
    const registerMenuMessage = {
      type: MessageType.REGISTER_MENU,
      payload: {
        pluginName: pluginInfo.name,
        menuItems: menuItems
      }
    };
    console.log('Sending register menu message:', JSON.stringify(registerMenuMessage));
    client.write(JSON.stringify(registerMenuMessage));
    console.log('Registered menu items:', menuItems);
  }, 1000); // Wait a bit to ensure plugin is registered first
});

client.on('connect', () => {
  console.log('Successfully connected to text editor');
});

// Handle messages from the text editor
client.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('Received message:', message.type);

    if (message.type === MessageType.EXECUTE) {
      handleExecute(message);
    } else if (message.type === MessageType.EXECUTE_MENU_ACTION) {
      handleMenuAction(message);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
    // Don't try to access message if parsing failed
    sendResponse('error', false, 'Error parsing message');
  }
});

// Handle connection errors
client.on('error', (error) => {
  console.error('Connection error:', error);
});

// Handle execute message
async function handleExecute(message: any) {
  const { content, filePath, options } = message.payload;

  console.log('Executing plugin with content length:', content.length);
  console.log('File path:', filePath);

  try {
    // Format the content using Prettier
    const formattedContent = await formatCode(content, filePath, options);

    // Send response
    sendResponse(message.id, true, 'Code formatted successfully', {
      formattedText: formattedContent
    });
  } catch (error: any) {
    console.error('Error formatting code:', error);
    sendResponse(message.id, false, `Error formatting code: ${error.message}`);
  }
}

// Handle menu action
async function handleMenuAction(message: any) {
  const { menuItemId, content, filePath } = message.payload;

  console.log('Executing menu action:', menuItemId);
  console.log('Content length:', content?.length || 0);
  console.log('File path:', filePath || 'none');

  if (menuItemId === 'prettier-plugin.formatDocument') {
    try {
      console.log('Formatting document with Prettier...');
      // Format the content using Prettier
      const formattedContent = await formatCode(content, filePath);
      console.log('Formatting successful, content length:', formattedContent.length);

      // Send response
      console.log('Sending successful response');
      sendResponse(message.id, true, 'Code formatted successfully', {
        formattedText: formattedContent
      });
    } catch (error: any) {
      console.error('Error formatting code:', error);
      console.log('Sending error response');
      sendResponse(message.id, false, `Error formatting code: ${error.message}`);
    }
  } else {
    console.log('Unknown menu action, sending error response');
    sendResponse(message.id, false, `Unknown menu action: ${menuItemId}`);
  }
}

// Format code using Prettier
async function formatCode(content: string, filePath?: string, options?: any): Promise<string> {
  console.log('formatCode called with content length:', content?.length || 0);
  console.log('File path:', filePath || 'none');

  if (!content) {
    console.log('Empty content, returning empty string');
    return '';
  }

  try {
    // Determine the parser based on file extension
    const parser = getParserFromFilePath(filePath);
    console.log('Using parser:', parser);

    // Get Prettier options
    const prettierOptions = {
      parser,
      ...options?.prettierOptions
    };
    console.log('Prettier options:', prettierOptions);

    // Format the code
    console.log('Calling prettier.format...');
    const formattedCode = await prettier.format(content, prettierOptions);
    console.log('Formatting successful, result length:', formattedCode.length);
    return formattedCode;
  } catch (error) {
    console.error('Prettier formatting error:', error);
    throw error;
  }
}

// Determine the parser based on file extension
function getParserFromFilePath(filePath?: string): string {
  if (!filePath) {
    return 'babel'; // Default parser
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'babel';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'less':
      return 'less';
    case 'json':
    case 'jsonc':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'html':
    case 'htm':
      return 'html';
    case 'vue':
      return 'vue';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'graphql':
    case 'gql':
      return 'graphql';
    default:
      return 'babel'; // Default to babel parser
  }
}

// Send response to the text editor
function sendResponse(id: string, success: boolean, message: string, data?: any) {
  console.log(`Sending response - ID: ${id}, Success: ${success}, Message: ${message}`);

  const response = {
    type: MessageType.RESPONSE,
    id,
    payload: {
      success,
      message,
      data
    }
  };

  try {
    const responseJson = JSON.stringify(response);
    console.log(`Response JSON length: ${responseJson.length}`);
    client.write(responseJson);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error sending response:', error);
  }
}
