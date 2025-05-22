const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Tên plugin
const pluginName = 'ai-assistant';
const pluginVersion = '1.0.0';
const zipFileName = `${pluginName}-${pluginVersion}-complete.zip`;
const zipFilePath = path.join(__dirname, '..', zipFileName);

console.log('🚀 Đóng gói AI Assistant Plugin HOÀN CHỈNH...');

// Tạo thư mục tạm thời
const tempDir = path.join(__dirname, 'temp-complete-package');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

console.log('📦 Tạo package.json với dependencies đầy đủ...');

// Tạo package.json hoàn chỉnh
const packageJson = {
  "name": "ai-assistant",
  "version": "1.0.0",
  "description": "AI Assistant plugin for Text Editor with full AI capabilities",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "author": "nhutwm",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  }
};

fs.writeFileSync(
  path.join(tempDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('🧠 Tạo index.js với AI functions hoàn chỉnh...');

// Tạo index.js hoàn chỉnh với tất cả AI functions
const indexJs = `// AI Assistant Plugin - Complete Version
const net = require('net');
const axios = require('axios');
const dotenv = require('dotenv');

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
let PORT = 5001; // Default port

// Kiểm tra biến môi trường PLUGIN_PORT trước tiên
if (process.env.PLUGIN_PORT) {
  const envPort = parseInt(process.env.PLUGIN_PORT, 10);
  if (!isNaN(envPort)) {
    PORT = envPort;
    console.log(\`Using port \${PORT} from environment variable PLUGIN_PORT\`);
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
      console.log(\`Using port \${PORT} from command line argument\`);
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
      console.error(\`Failed to connect after \${MAX_ATTEMPTS} attempts. Giving up.\`);
      return;
    }

    connectionAttempts++;
    console.log(\`Connection attempt \${connectionAttempts}/\${MAX_ATTEMPTS} to port \${PORT}...\`);

    try {
      client.connect(PORT, '127.0.0.1', () => {
        console.log(\`Connected to editor on port \${PORT}\`);
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
    } catch (error) {
      console.error('Connection error (1):', error);
      connected = false;
      scheduleRetry();
    }
  }

  function scheduleRetry() {
    console.log(\`Scheduling retry in \${RETRY_DELAY / 1000} seconds...\`);
    setTimeout(attemptConnection, RETRY_DELAY);
  }

  client.on('data', (data) => {
    try {
      const messages = data.toString().split('\\n').filter(Boolean);

      for (const messageStr of messages) {
        if (messageStr.trim()) {
          const message = JSON.parse(messageStr.trim());
          handleMessage(message);
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  client.on('close', () => {
    console.log('Connection closed');
    connected = false;
    scheduleRetry();
  });

  client.on('error', (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error(\`Connection refused on port \${PORT}. The editor might not be running or using a different port.\`);
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
  } else {
    messageQueue.push(response);
  }
}

// Handle execute message
async function handleExecute(message) {
  const { content, filePath, options } = message.payload;

  console.log('Executing AI Assistant plugin with content length:', content?.length || 0);
  console.log('File path:', filePath || 'none');

  try {
    // Process the content based on options
    const result = await processWithAI(content, options);

    // Send response
    sendResponse(message.id, true, 'AI processing completed', { result });
  } catch (error) {
    console.error('Error processing with AI:', error);
    sendResponse(message.id, false, \`Error: \${error.message}\`);
  }
}

// Handle menu action
async function handleMenuAction(message) {
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
        options = {
          prompt: 'Generate code based on the description:',
          systemPrompt: 'You are a helpful coding assistant. Generate clean, well-commented code based on the user description.'
        };
        result = await processWithAI(content, options);
        break;

      case 'ai-assistant.aiChat':
        options = {
          prompt: 'Chat with AI:',
          systemPrompt: 'You are a helpful AI assistant. Provide helpful and accurate responses.'
        };
        result = await processWithAI(content, options);
        break;

      default:
        throw new Error(\`Unknown menu item: \${menuItemId}\`);
    }

    // Send response with the result
    sendResponse(message.id, true, 'AI processing completed', { result });
  } catch (error) {
    console.error('Error handling menu action:', error);
    sendResponse(message.id, false, \`Error: \${error.message}\`);
  }
}`;

// Thêm phần AI processing functions
const aiProcessingFunctions = `

// Process content with AI
async function processWithAI(content, options = {}) {
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
  } catch (error) {
    console.error(\`\${AI_PROVIDER} API error:\`, error.response?.data || error.message);
    throw new Error(\`Failed to process with \${AI_PROVIDER}: \` + (error.response?.data?.error?.message || error.message));
  }
}

// Process with OpenAI
async function processWithOpenAI(content, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const model = options.model || 'gpt-3.5-turbo';

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'system',
          content: options.systemPrompt || 'You are a helpful coding assistant.'
        },
        {
          role: 'user',
          content: \`\${options.prompt || ''}\n\n\${content}\`
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    },
    {
      headers: {
        'Authorization': \`Bearer \${OPENAI_API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

// Process with Ollama
async function processWithOllama(content, options = {}) {
  const model = options.model || OLLAMA_MODEL;

  const response = await axios.post(
    \`\${OLLAMA_BASE_URL}/api/generate\`,
    {
      model,
      prompt: \`\${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n\${options.prompt || ''}\n\n\${content}\`,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 2000
      }
    }
  );

  return response.data.response;
}

// Process with Hugging Face
async function processWithHuggingFace(content, options = {}) {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  const model = options.model || 'microsoft/DialoGPT-medium';

  const response = await axios.post(
    \`https://api-inference.huggingface.co/models/\${model}\`,
    {
      inputs: \`\${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n\${options.prompt || ''}\n\n\${content}\`,
      parameters: {
        max_length: options.maxTokens || 2000,
        temperature: options.temperature || 0.7
      }
    },
    {
      headers: {
        'Authorization': \`Bearer \${HUGGINGFACE_API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data[0].generated_text;
}

// Process with Google Gemini
async function processWithGemini(content, options = {}) {
  try {
    const model = options.model || GEMINI_MODEL;

    // Nếu có GEMINI_API_KEY, sử dụng trực tiếp
    if (GEMINI_API_KEY) {
      console.log('🔑 Using direct Gemini API');

      const response = await axios.post(
        \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${GEMINI_API_KEY}\`,
        {
          contents: [
            {
              parts: [
                { text: \`\${options.systemPrompt || 'You are a helpful coding assistant.'}\n\n\${options.prompt || ''}\n\n\${content}\` }
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
    } else {
      // Fallback to mock response nếu không có API key
      console.log('🤖 Using mock AI response (no API key configured)');

      const mockResponses = {
        'complete': \`// Completed code
function helloWorld() {
    console.log("Hello, World!");
    return "Hello, World!";
}

// Usage example:
helloWorld();\`,
        'explain': \`This code defines a simple function that:
1. Prints "Hello, World!" to the console
2. Returns the string "Hello, World!"
3. Can be called to execute both actions\`,
        'generate': \`// Generated code based on your request
function processData(data) {
    // Validate input
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data provided');
    }

    // Process the data
    const result = Object.keys(data).map(key => ({
        key: key,
        value: data[key],
        processed: true
    }));

    return result;
}

// Example usage:
const sampleData = { name: 'John', age: 30 };
const processed = processData(sampleData);
console.log(processed);\`,
        'chat': \`Hello! I'm your AI assistant. I can help you with:
- Writing and completing code
- Explaining code functionality
- Generating new code based on requirements
- Answering programming questions
- Code optimization and best practices

What would you like help with today?\`
      };

      // Determine response type based on content/prompt
      let responseType = 'chat';
      if (options.prompt?.toLowerCase().includes('complete')) responseType = 'complete';
      else if (options.prompt?.toLowerCase().includes('explain')) responseType = 'explain';
      else if (options.prompt?.toLowerCase().includes('generate')) responseType = 'generate';

      return mockResponses[responseType];
    }
  } catch (error) {
    console.error('Error processing with Gemini:', error.response?.data || error.message);
    throw new Error('Failed to process with Gemini: ' + (error.response?.data?.error || error.message));
  }
}

// Start the plugin
connectToEditor();
`;

fs.writeFileSync(path.join(tempDir, 'index.js'), indexJs + aiProcessingFunctions);

console.log('⚡ Đã thêm AI processing functions hoàn chỉnh!');

console.log('📄 Tạo các file cấu hình...');

// Tạo README.md
const readmeContent = `# AI Assistant Plugin

Một plugin AI mạnh mẽ cho Text Editor với khả năng:

## 🚀 Tính năng

- **Complete Code** (Alt+C): Hoàn thành code tự động
- **Explain Code** (Alt+E): Giải thích code chi tiết
- **Generate Code** (Alt+G): Tạo code từ mô tả
- **AI Chat** (Alt+A): Trò chuyện với AI

## 🤖 AI Providers Hỗ trợ

- **Google Gemini** (Mặc định - Miễn phí với giới hạn)
- **OpenAI GPT** (Cần API key)
- **Ollama** (Local AI)
- **Hugging Face** (Cần API key)

## ⚙️ Cấu hình

Tạo file \`.env\` với nội dung:

\`\`\`
# AI Provider (gemini, openai, ollama, huggingface)
AI_PROVIDER=gemini

# Gemini API Key (tùy chọn - nếu không có sẽ dùng mock response)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (nếu dùng OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Ollama Configuration (nếu dùng Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Hugging Face API Key (nếu dùng Hugging Face)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
\`\`\`

## 🎯 Cách sử dụng

1. Plugin sẽ tự động kết nối với Text Editor
2. Sử dụng các phím tắt hoặc menu để truy cập tính năng AI
3. Nếu không có API key, plugin sẽ sử dụng mock responses để demo

## 🔧 Yêu cầu

- Node.js 14.0+
- Text Editor với plugin support
- Kết nối internet (cho real AI APIs)

## 📝 Ghi chú

- Plugin hoạt động với hoặc không có API keys
- Mock responses được cung cấp để test và demo
- Hỗ trợ auto-reconnect khi mất kết nối
`;

fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);

// Tạo .env.example
const envExample = `# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-pro

# API Keys (tùy chọn)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Plugin Configuration
NODE_ENV=production
`;

fs.writeFileSync(path.join(tempDir, '.env.example'), envExample);

// Tạo start.bat
const startBat = `@echo off
echo Starting AI Assistant Plugin...
echo.
echo Plugin Features:
echo - Complete Code (Alt+C)
echo - Explain Code (Alt+E)
echo - Generate Code (Alt+G)
echo - AI Chat (Alt+A)
echo.
node index.js --port=5001
`;

fs.writeFileSync(path.join(tempDir, 'start.bat'), startBat);

console.log('✅ Đã tạo tất cả files cần thiết');

// Tạo file zip
console.log('🗜️ Đóng gói thành file ZIP...');
try {
  // Xóa file zip cũ nếu tồn tại
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  // Sử dụng PowerShell để tạo file zip
  const command = `powershell -command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFilePath}'"`;
  execSync(command);

  console.log(`🎉 Đã tạo file zip thành công: ${zipFilePath}`);

  // Hiển thị thông tin file
  const stats = fs.statSync(zipFilePath);
  console.log(`📊 Kích thước file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

} catch (error) {
  console.error('❌ Lỗi khi tạo file zip:', error);
}

// Xóa thư mục tạm thời
console.log('🧹 Xóa thư mục tạm thời...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('');
console.log('🎊 HOÀN TẤT ĐÓNG GÓI AI ASSISTANT PLUGIN!');
console.log('');
console.log('📋 Thông tin plugin:');
console.log(`   - Tên: ${pluginName}`);
console.log(`   - Phiên bản: ${pluginVersion}`);
console.log(`   - File: ${zipFileName}`);
console.log('');
console.log('🚀 Plugin đã sẵn sàng để upload lên Firebase Storage!');
console.log('');
console.log('💡 Tính năng hoàn chỉnh:');
console.log('   ✅ Kết nối với text editor');
console.log('   ✅ 4 menu items AI (Complete, Explain, Generate, Chat)');
console.log('   ✅ Hỗ trợ 4 AI providers (Gemini, OpenAI, Ollama, HuggingFace)');
console.log('   ✅ Mock responses khi không có API key');
console.log('   ✅ Auto-reconnect và error handling');
console.log('   ✅ Environment configuration');
console.log('   ✅ Comprehensive documentation');
console.log('');
console.log('🔑 Để sử dụng real AI:');
console.log('   1. Tạo file .env trong thư mục plugin');
console.log('   2. Thêm API key tương ứng');
console.log('   3. Restart plugin');
console.log('');
