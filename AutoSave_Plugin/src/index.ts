import * as net from "net";
import * as fs from "fs";
import * as path from "path";

// Plugin thông tin
const pluginInfo = {
  name: "autosave-plugin",
  displayName: "Auto Save Plugin",
  version: "1.0.0",
  description: "Automatically saves your document after every set interval",
  author: "Text Editor Team",
};

// Menu item để đăng ký
const menuItems = [
  {
    id: "autosave-plugin.toggleAutoSave",
    label: "Toggle Auto Save",
    parentMenu: "edit",
    position: 60, // Vị trí trong menu Edit
    shortcut: "Shift+Alt+S", // Shortcut để bật/tắt auto-save
  },
];

// Message types
enum MessageType {
  REGISTER = "register-plugin",
  RESPONSE = "plugin-response",
  REGISTER_MENU = "register-menu",
  EXECUTE_MENU_ACTION = "execute-menu-action",
}

// Cài đặt kết nối tới text editor
const PORT =
  process.argv.find((arg) => arg.startsWith("--port="))?.split("=")[1] || 8080;
console.log(`Connecting to text editor on port ${PORT}`);

const client = new net.Socket();

// Cập nhật vào text editor
client.connect(parseInt(PORT.toString()), "localhost", () => {
  console.log("Connected to text editor");

  // Đăng ký plugin
  const registerMessage = {
    type: MessageType.REGISTER,
    payload: pluginInfo,
  };
  client.write(JSON.stringify(registerMessage));

  // Đăng ký menu item
  setTimeout(() => {
    const registerMenuMessage = {
      type: MessageType.REGISTER_MENU,
      payload: {
        pluginName: pluginInfo.name,
        menuItems: menuItems,
      },
    };
    client.write(JSON.stringify(registerMenuMessage));
  }, 1000); // Chờ một chút để plugin đăng ký trước
});

// Xử lý tin nhắn từ text editor
client.on("data", (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log("Received message:", message.type);

    if (message.type === MessageType.EXECUTE_MENU_ACTION) {
      handleMenuAction(message);
    }
  } catch (error) {
    console.error("Error parsing message:", error);
    sendResponse("error", false, "Error parsing message");
  }
});

// Hàm xử lý lỗi kết nối
client.on("error", (error) => {
  console.error("Connection error:", error);
});

// Biến theo dõi trạng thái AutoSave
let autoSaveEnabled = false;
let autoSaveInterval: NodeJS.Timeout | null = null;

// Hàm xử lý menu action
async function handleMenuAction(message: any) {
  const { menuItemId, filePath } = message.payload;

  if (menuItemId === "autosave-plugin.toggleAutoSave") {
    if (autoSaveEnabled) {
      stopAutoSave();
      sendResponse(message.id, true, "Auto Save disabled");
    } else {
      startAutoSave(filePath);
      sendResponse(
        message.id,
        true,
        `Auto Save enabled for ${filePath || "auto-saved-file.js"}`
      );
    }
  } else {
    sendResponse(message.id, false, `Unknown menu action: ${menuItemId}`);
  }
}

// Bắt đầu tự động lưu
function startAutoSave(filePath?: string) {
  if (autoSaveEnabled) return;

  // Sử dụng file path được truyền vào hoặc giá trị mặc định
  const targetFile = filePath || "auto-saved-file.js";

  autoSaveEnabled = true;
  console.log(
    `Auto Save enabled - Will save to ${targetFile} every 10 seconds`
  );

  // Lưu ngay lập tức lần đầu
  saveFile(targetFile);

  // Sau đó cứ 10 giây lưu một lần
  autoSaveInterval = setInterval(
    () => {
      console.log(`\n--- Auto Save Trigger for ${targetFile} ---`);
      saveFile(targetFile);
    },
    10 * 1000 // 10 seconds
  );
}

// Dừng tính năng tự động lưu
function stopAutoSave() {
  if (!autoSaveEnabled) return;

  autoSaveEnabled = false;
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
  console.log("Auto Save disabled");
}

// Lưu file
function saveFile(filePath: string) {
  if (!filePath) {
    console.error("Error: No file path provided");
    return;
  }

  const timestamp = new Date().toISOString();
  const content = `// Auto-saved content
// Last saved at: ${timestamp}
// Status: AutoSave is ${autoSaveEnabled ? "enabled" : "disabled"}
// File: ${filePath}

// This is a test file to demonstrate auto-save functionality
`;

  // Xử lý đường dẫn file
  let fullPath: string;
  if (path.isAbsolute(filePath)) {
    fullPath = filePath;
  } else {
    fullPath = path.resolve(__dirname, filePath);
  }

  // Đảm bảo thư mục tồn tại
  const directory = path.dirname(fullPath);
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
      return;
    }
  }

  console.log(`Attempting to save file to: ${fullPath}`);
  console.log(`Current autoSave status: ${autoSaveEnabled ? "ON" : "OFF"}`);

  fs.writeFile(fullPath, content, (err) => {
    if (err) {
      console.error("Error saving file:", err);
    } else {
      console.log(`File saved successfully at ${timestamp}`);
      console.log(`File location: ${fullPath}`);
    }
  });
}

// Hàm gửi phản hồi
function sendResponse(
  id: string,
  success: boolean,
  message: string,
  data?: any
) {
  const response = {
    type: MessageType.RESPONSE,
    id,
    payload: {
      success,
      message,
      data,
    },
  };

  try {
    const responseJson = JSON.stringify(response);
    client.write(responseJson);
  } catch (error) {
    console.error("Error sending response:", error);
  }
}
