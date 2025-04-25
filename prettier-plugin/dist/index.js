"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const prettier = __importStar(require("prettier"));
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
var MessageType;
(function (MessageType) {
    MessageType["REGISTER"] = "register-plugin";
    MessageType["EXECUTE"] = "execute-plugin";
    MessageType["RESPONSE"] = "plugin-response";
    MessageType["REGISTER_MENU"] = "register-menu";
    MessageType["EXECUTE_MENU_ACTION"] = "execute-menu-action";
})(MessageType || (MessageType = {}));
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
        }
        else if (message.type === MessageType.EXECUTE_MENU_ACTION) {
            handleMenuAction(message);
        }
    }
    catch (error) {
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
async function handleExecute(message) {
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
    }
    catch (error) {
        console.error('Error formatting code:', error);
        sendResponse(message.id, false, `Error formatting code: ${error.message}`);
    }
}
// Handle menu action
async function handleMenuAction(message) {
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
        }
        catch (error) {
            console.error('Error formatting code:', error);
            console.log('Sending error response');
            sendResponse(message.id, false, `Error formatting code: ${error.message}`);
        }
    }
    else {
        console.log('Unknown menu action, sending error response');
        sendResponse(message.id, false, `Unknown menu action: ${menuItemId}`);
    }
}
// Format code using Prettier
async function formatCode(content, filePath, options) {
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
    }
    catch (error) {
        console.error('Prettier formatting error:', error);
        throw error;
    }
}
// Determine the parser based on file extension
function getParserFromFilePath(filePath) {
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
function sendResponse(id, success, message, data) {
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
    }
    catch (error) {
        console.error('Error sending response:', error);
    }
}
