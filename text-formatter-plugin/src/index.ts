import * as net from 'net';

// Thông tin plugin
const pluginInfo = {
  name: 'text-formatter',
  version: '1.0.0',
  description: 'A plugin for formatting text in various ways',
  author: 'Text Editor User'
};

// Lấy port từ tham số dòng lệnh
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const PORT = portArg ? parseInt(portArg.split('=')[1]) : 5000;
const HOST = 'localhost';

console.log(`Starting text-formatter plugin on port ${PORT}`);

// Tạo kết nối socket
const socket = net.createConnection({ port: PORT, host: HOST }, () => {
  console.log('Connected to Text Editor');
  
  // Đăng ký plugin
  registerPlugin();
});

// Xử lý dữ liệu nhận được
socket.on('data', (data) => {
  try {
    const message = JSON.parse(data.toString());
    handleMessage(message);
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Xử lý lỗi kết nối
socket.on('error', (error) => {
  console.error('Connection error:', error);
});

// Xử lý khi kết nối đóng
socket.on('close', () => {
  console.log('Connection closed');
});

/**
 * Đăng ký plugin với Text Editor
 */
function registerPlugin() {
  const registerMessage = {
    type: 'register-plugin',
    payload: pluginInfo
  };
  
  socket.write(JSON.stringify(registerMessage));
}

/**
 * Xử lý thông điệp từ Text Editor
 */
function handleMessage(message: any) {
  console.log('Received message:', message);
  
  // Xử lý thông điệp thực thi plugin
  if (message.type === 'execute-plugin') {
    const { content, options } = message.payload;
    
    // Xử lý nội dung
    processContent(content, options)
      .then((result) => {
        // Gửi phản hồi thành công
        sendResponse(message.id, true, 'Text formatting completed successfully', result);
      })
      .catch((error) => {
        // Gửi phản hồi lỗi
        sendResponse(message.id, false, error.message);
      });
  }
}

/**
 * Xử lý nội dung văn bản
 */
async function processContent(content: string, options?: any): Promise<any> {
  if (!content) {
    return { formattedText: '', message: 'No content provided' };
  }
  
  // Lấy loại định dạng từ options (mặc định là 'uppercase')
  const formatType = options?.formatType || 'uppercase';
  
  let formattedText = '';
  let message = '';
  
  switch (formatType) {
    case 'uppercase':
      formattedText = content.toUpperCase();
      message = 'Text converted to uppercase';
      break;
    
    case 'lowercase':
      formattedText = content.toLowerCase();
      message = 'Text converted to lowercase';
      break;
    
    case 'capitalize':
      formattedText = content
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      message = 'Text capitalized';
      break;
    
    case 'trim':
      formattedText = content
        .replace(/\s+/g, ' ')
        .trim();
      message = 'Extra whitespace removed';
      break;
    
    default:
      formattedText = content;
      message = 'No formatting applied';
  }
  
  return {
    formattedText,
    message,
    originalLength: content.length,
    formattedLength: formattedText.length
  };
}

/**
 * Gửi phản hồi đến Text Editor
 */
function sendResponse(id: string, success: boolean, message: string, data?: any) {
  const response = {
    type: 'plugin-response',
    id,
    payload: {
      success,
      message,
      data
    }
  };
  
  socket.write(JSON.stringify(response));
}
