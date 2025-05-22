import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import axios from 'axios';
import * as dotenv from 'dotenv';

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

let client: net.Socket;
let messageQueue: any[] = [];
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
    } catch (err) {
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
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  client.on('close', () => {
    console.log('Connection closed');
    connected = false;
    // Try to reconnect after a delay
    scheduleRetry();
  });

  client.on('error', (error: any) => {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Connection refused on port ${PORT}. The editor might not be running or using a different port.`);
    } else {
      console.error('Connection error:', error);
    }
    connected = false;

    // Đóng socket hiện tại để tránh rò rỉ bộ nhớ
    try {
      client.destroy();
    } catch (destroyError) {
      console.error('Error destroying socket:', destroyError);
    }
  });

  // Bắt đầu quá trình kết nối
  attemptConnection();
}

// Handle incoming messages
function handleMessage(message: any) {
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
function sendResponse(id: string, success: boolean, message: string, data: any = {}) {
  const response = {
    id,
    success,
    message,
    data
  };

  if (connected) {
    client.write(JSON.stringify(response));
  } else {
    messageQueue.push(response);
  }
}

// Handle execute message
async function handleExecute(message: any) {
  const { content, filePath, options } = message.payload;

  console.log('Executing AI Assistant plugin with content length:', content?.length || 0);
  console.log('File path:', filePath || 'none');

  try {
    // Process the content based on options
    const result = await processWithAI(content, options);

    // Send response
    sendResponse(message.id, true, 'AI processing completed', { result });
  } catch (error: any) {
    console.error('Error processing with AI:', error);
    sendResponse(message.id, false, `Error: ${error.message}`);
  }
}

// Handle menu action
async function handleMenuAction(message: any) {
  const { menuItemId, content, filePath } = message.payload;
  console.log('Executing menu action:', menuItemId);

  try {
    let result = '';
    let options: any = {};

    switch (menuItemId) {
      case 'ai-assistant.completeCode':
        options = {
          prompt: 'Complete the following code:',
          systemPrompt: 'You are a helpful coding assistant. Complete the code below in the same style and language. Only provide the completed code, no explanations.'
        };
        result = await processWithAI(content, options);
        break;

      case 'ai-assistant.explainCode':
        options = {
          prompt: 'Explain the following code:',
          systemPrompt: 'You are a helpful coding assistant. Explain the following code in detail, including what it does and how it works.'
        };
        result = await processWithAI(content, options);
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
  } catch (error: any) {
    console.error('Error handling menu action:', error);
    sendResponse(message.id, false, `Error: ${error.message}`);
  }
}

// Process content with AI
async function processWithAI(content: string, options: any = {}) {
  try {
    switch (AI_PROVIDER.toLowerCase()) {
      case 'openai':
        return await processWithOpenAI(content, options);
      case 'ollama':
        return await processWithOllama(content, options);
      case 'huggingface':
        return await processWithHuggingFace(content, options);
      case 'gemini':
        return await processWithGemini(content, options);
      default:
        // Default to Gemini as it's free with API limits
        return await processWithGemini(content, options);
    }
  } catch (error: any) {
    console.error(`${AI_PROVIDER} API error:`, error.response?.data || error.message);
    throw new Error(`Failed to process with ${AI_PROVIDER}: ` + (error.response?.data?.error?.message || error.message));
  }
}

// Process with OpenAI
async function processWithOpenAI(content: string, options: any = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in .env file.');
  }

  const model = options.model || 'gpt-3.5-turbo';

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: options.systemPrompt || 'You are a helpful coding assistant.' },
        { role: 'user', content: options.prompt ? `${options.prompt}\n\n${content}` : content }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

// Process with Ollama (local)
async function processWithOllama(content: string, options: any = {}) {
  const model = options.model || OLLAMA_MODEL;

  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/generate`,
    {
      model,
      prompt: `${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n${options.prompt || ''}\n\n${content}`,
      stream: false
    }
  );

  return response.data.response;
}

// Process with Hugging Face
async function processWithHuggingFace(content: string, options: any = {}) {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not found. Please set HUGGINGFACE_API_KEY in .env file.');
  }

  const model = options.model || 'mistralai/Mistral-7B-Instruct-v0.2';

  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      inputs: `${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n${options.prompt || content}`
    },
    {
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data[0].generated_text;
}

// Process with Google Gemini via Proxy
async function processWithGemini(content: string, options: any = {}) {
  try {
    const model = options.model || GEMINI_MODEL;

    // Sử dụng Firebase Function proxy thay vì gọi trực tiếp Gemini API
    // Thử emulator local trước, nếu không được thì dùng deployed function
    const proxyUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:5002/cosmic-text-editor/us-central1/geminiProxy'
      : 'https://us-central1-cosmic-text-editor.cloudfunctions.net/geminiProxy';

    const response = await axios.post(
      proxyUrl,
      {
        model,
        contents: [
          {
            parts: [
              { text: `${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n${options.prompt || ''}\n\n${content}` }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2000
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error('Error processing with Gemini proxy:', error.response?.data || error.message);
    throw new Error('Failed to process with Gemini: ' + (error.response?.data?.error || error.message));
  }
}

// Start the plugin
connectToEditor();
