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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// AI Provider Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
// Parse command line arguments
const args = process.argv.slice(2);
let PORT = 5001; // Default port changed to 5001 to match Firebase emulator port
// Kiểm tra biến môi trường PLUGIN_PORT trước tiên
if (process.env.PLUGIN_PORT) {
    const envPort = parseInt(process.env.PLUGIN_PORT, 10);
    if (!isNaN(envPort)) {
        PORT = envPort;
        console.log(`Using port ${PORT} from environment variable PLUGIN_PORT`);
    }
}
// Look for --port argument (ưu tiên cao hơn biến môi trường)
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--port=')) {
        const portStr = arg.split('=')[1];
        const portNum = parseInt(portStr, 10);
        if (!isNaN(portNum)) {
            PORT = portNum;
            console.log(`Using port ${PORT} from command line argument`);
        }
    }
}
let client;
let messageQueue = [];
let connected = false;
// Connect to the editor
function connectToEditor() {
    client = new net.Socket();
    // Thêm xử lý lỗi kết nối
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 10;
    const RETRY_DELAY = 5000; // 5 giây
    // Hàm thử kết nối với xử lý lỗi
    function attemptConnection() {
        if (connectionAttempts >= MAX_ATTEMPTS) {
            console.error(`Failed to connect after ${MAX_ATTEMPTS} attempts. Giving up.`);
            return;
        }
        connectionAttempts++;
        console.log(`Connection attempt ${connectionAttempts}/${MAX_ATTEMPTS} to port ${PORT}...`);
        try {
            client.connect(PORT, '127.0.0.1', () => {
                console.log(`Connected to editor on port ${PORT}`);
                connectionAttempts = 0; // Reset counter on successful connection
                connected = true;
                // Process any queued messages
                while (messageQueue.length > 0) {
                    const message = messageQueue.shift();
                    client.write(JSON.stringify(message));
                }
                // Register plugin
                client.write(JSON.stringify({
                    type: 'REGISTER_PLUGIN',
                    payload: {
                        name: 'ai-assistant',
                        version: '1.0.0',
                        description: 'AI Assistant plugin for Text Editor',
                        author: 'nhtam'
                    }
                }));
                // Register menu items
                client.write(JSON.stringify({
                    type: 'REGISTER_MENU',
                    payload: {
                        pluginName: 'ai-assistant',
                        menuItems: [
                            {
                                id: 'ai-assistant.completeCode',
                                label: 'Complete Code',
                                parentMenu: 'edit',
                                accelerator: 'Alt+C'
                            },
                            {
                                id: 'ai-assistant.explainCode',
                                label: 'Explain Code',
                                parentMenu: 'edit',
                                accelerator: 'Alt+E'
                            },
                            {
                                id: 'ai-assistant.generateCode',
                                label: 'Generate Code',
                                parentMenu: 'edit',
                                accelerator: 'Alt+G'
                            },
                            {
                                id: 'ai-assistant.aiChat',
                                label: 'AI Chat',
                                parentMenu: 'view',
                                accelerator: 'Alt+A'
                            }
                        ]
                    }
                }));
            });
        }
        catch (err) {
            console.error('Error during connection attempt:', err);
            scheduleRetry();
        }
    }
    // Lên lịch thử lại kết nối
    function scheduleRetry() {
        console.log(`Scheduling retry in ${RETRY_DELAY / 1000} seconds...`);
        setTimeout(attemptConnection, RETRY_DELAY);
    }
    client.on('data', (data) => {
        try {
            const messages = data.toString().split('\n').filter(Boolean);
            for (const messageStr of messages) {
                const message = JSON.parse(messageStr);
                handleMessage(message);
            }
        }
        catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    client.on('close', () => {
        console.log('Connection closed');
        connected = false;
        // Try to reconnect after a delay
        scheduleRetry();
    });
    client.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
            console.error(`Connection refused on port ${PORT}. The editor might not be running or using a different port.`);
        }
        else {
            console.error('Connection error:', error);
        }
        connected = false;
        // Đóng socket hiện tại để tránh rò rỉ bộ nhớ
        try {
            client.destroy();
        }
        catch (destroyError) {
            console.error('Error destroying socket:', destroyError);
        }
    });
    // Bắt đầu quá trình kết nối
    attemptConnection();
}
// Handle incoming messages
function handleMessage(message) {
    console.log('Received message:', message.type);
    switch (message.type) {
        case 'EXECUTE':
            handleExecute(message);
            break;
        case 'MENU_ACTION':
            handleMenuAction(message);
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
}
// Send a response
function sendResponse(id, success, message, data = {}) {
    const response = {
        id,
        success,
        message,
        data
    };
    if (connected) {
        client.write(JSON.stringify(response));
    }
    else {
        messageQueue.push(response);
    }
}
// Handle execute message
function handleExecute(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const { content, filePath, options } = message.payload;
        console.log('Executing AI Assistant plugin with content length:', (content === null || content === void 0 ? void 0 : content.length) || 0);
        console.log('File path:', filePath || 'none');
        try {
            // Process the content based on options
            const result = yield processWithAI(content, options);
            // Send response
            sendResponse(message.id, true, 'AI processing completed', { result });
        }
        catch (error) {
            console.error('Error processing with AI:', error);
            sendResponse(message.id, false, `Error: ${error.message}`);
        }
    });
}
// Handle menu action
function handleMenuAction(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const { menuItemId, content, filePath } = message.payload;
        console.log('Executing menu action:', menuItemId);
        try {
            let result = '';
            let options = {};
            switch (menuItemId) {
                case 'ai-assistant.completeCode':
                    options = {
                        prompt: 'Complete the following code:',
                        systemPrompt: 'You are a helpful coding assistant. Complete the code below in the same style and language. Only provide the completed code, no explanations.'
                    };
                    result = yield processWithAI(content, options);
                    break;
                case 'ai-assistant.explainCode':
                    options = {
                        prompt: 'Explain the following code:',
                        systemPrompt: 'You are a helpful coding assistant. Explain the following code in detail, including what it does and how it works.'
                    };
                    result = yield processWithAI(content, options);
                    break;
                case 'ai-assistant.generateCode':
                    // For generate code, we'll open a dialog to get user input
                    sendResponse(message.id, true, 'Opening AI Chat dialog');
                    client.write(JSON.stringify({
                        type: 'SHOW_AI_CHAT',
                        payload: {
                            title: 'Generate Code',
                            initialPrompt: 'Generate code for:'
                        }
                    }));
                    return;
                case 'ai-assistant.aiChat':
                    // Open AI Chat dialog
                    sendResponse(message.id, true, 'Opening AI Chat dialog');
                    client.write(JSON.stringify({
                        type: 'SHOW_AI_CHAT',
                        payload: {
                            title: 'AI Chat',
                            initialPrompt: ''
                        }
                    }));
                    return;
                default:
                    throw new Error(`Unknown menu item: ${menuItemId}`);
            }
            // Send response with the result
            sendResponse(message.id, true, 'AI processing completed', { result });
        }
        catch (error) {
            console.error('Error handling menu action:', error);
            sendResponse(message.id, false, `Error: ${error.message}`);
        }
    });
}
// Process content with AI
function processWithAI(content_1) {
    return __awaiter(this, arguments, void 0, function* (content, options = {}) {
        var _a, _b, _c, _d;
        try {
            switch (AI_PROVIDER.toLowerCase()) {
                case 'openai':
                    return yield processWithOpenAI(content, options);
                case 'ollama':
                    return yield processWithOllama(content, options);
                case 'huggingface':
                    return yield processWithHuggingFace(content, options);
                case 'gemini':
                    return yield processWithGemini(content, options);
                default:
                    // Default to Gemini as it's free with API limits
                    return yield processWithGemini(content, options);
            }
        }
        catch (error) {
            console.error(`${AI_PROVIDER} API error:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error(`Failed to process with ${AI_PROVIDER}: ` + (((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message));
        }
    });
}
// Process with OpenAI
function processWithOpenAI(content_1) {
    return __awaiter(this, arguments, void 0, function* (content, options = {}) {
        if (!OPENAI_API_KEY) {
            throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in .env file.');
        }
        const model = options.model || 'gpt-3.5-turbo';
        const response = yield axios_1.default.post('https://api.openai.com/v1/chat/completions', {
            model,
            messages: [
                { role: 'system', content: options.systemPrompt || 'You are a helpful coding assistant.' },
                { role: 'user', content: options.prompt ? `${options.prompt}\n\n${content}` : content }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    });
}
// Process with Ollama (local)
function processWithOllama(content_1) {
    return __awaiter(this, arguments, void 0, function* (content, options = {}) {
        const model = options.model || OLLAMA_MODEL;
        const response = yield axios_1.default.post(`${OLLAMA_BASE_URL}/api/generate`, {
            model,
            prompt: `${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n${options.prompt || ''}\n\n${content}`,
            stream: false
        });
        return response.data.response;
    });
}
// Process with Hugging Face
function processWithHuggingFace(content_1) {
    return __awaiter(this, arguments, void 0, function* (content, options = {}) {
        if (!HUGGINGFACE_API_KEY) {
            throw new Error('Hugging Face API key not found. Please set HUGGINGFACE_API_KEY in .env file.');
        }
        const model = options.model || 'mistralai/Mistral-7B-Instruct-v0.2';
        const response = yield axios_1.default.post(`https://api-inference.huggingface.co/models/${model}`, {
            inputs: `${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n${options.prompt || content}`
        }, {
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data[0].generated_text;
    });
}
// Process with Google Gemini via Proxy
function processWithGemini(content_1) {
    return __awaiter(this, arguments, void 0, function* (content, options = {}) {
        var _a, _b, _c;
        try {
            const model = options.model || GEMINI_MODEL;
            // Tạm thời trả về mock response để test
            console.log('🧠 AI processing request:', content.substring(0, 50) + '...');

            // Mock AI response
            const mockResponse = `function helloWorld() {
    console.log("Hello, World!");
    return "Hello, World!";
}

// Usage example:
helloWorld();`;

            return mockResponse;
        }
        catch (error) {
            console.error('Error processing with Gemini proxy:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new Error('Failed to process with Gemini: ' + (((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || error.message));
        }
    });
}
// Start the plugin
connectToEditor();
