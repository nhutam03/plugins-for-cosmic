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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
var MessageType;
(function (MessageType) {
    MessageType["REGISTER"] = "register-plugin";
    MessageType["RESPONSE"] = "plugin-response";
    MessageType["REGISTER_MENU"] = "register-menu";
    MessageType["EXECUTE_MENU_ACTION"] = "execute-menu-action";
})(MessageType || (MessageType = {}));
// Cài đặt kết nối tới text editor
const PORT = process.argv.find((arg) => arg.startsWith("--port="))?.split("=")[1] || 8080;
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
    }
    catch (error) {
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
let autoSaveInterval = null;
// Hàm xử lý menu action
async function handleMenuAction(message) {
    const { menuItemId, filePath } = message.payload;
    if (menuItemId === "autosave-plugin.toggleAutoSave") {
        if (autoSaveEnabled) {
            stopAutoSave();
            sendResponse(message.id, true, "Auto Save disabled");
        }
        else {
            startAutoSave(filePath);
            sendResponse(message.id, true, `Auto Save enabled for ${filePath || "auto-saved-file.js"}`);
        }
    }
    else {
        sendResponse(message.id, false, `Unknown menu action: ${menuItemId}`);
    }
}
// Bắt đầu tự động lưu
function startAutoSave(filePath) {
    if (autoSaveEnabled)
        return;
    // Sử dụng file path được truyền vào hoặc giá trị mặc định
    const targetFile = filePath || "auto-saved-file.js";
    autoSaveEnabled = true;
    console.log(`Auto Save enabled - Will save to ${targetFile} every 10 seconds`);
    // Lưu ngay lập tức lần đầu
    saveFile(targetFile);
    // Sau đó cứ 10 giây lưu một lần
    autoSaveInterval = setInterval(() => {
        console.log(`\n--- Auto Save Trigger for ${targetFile} ---`);
        saveFile(targetFile);
    }, 10 * 1000 // 10 seconds
    );
}
// Dừng tính năng tự động lưu
function stopAutoSave() {
    if (!autoSaveEnabled)
        return;
    autoSaveEnabled = false;
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
    console.log("Auto Save disabled");
}
// Lưu file
function saveFile(filePath) {
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
    let fullPath;
    if (path.isAbsolute(filePath)) {
        fullPath = filePath;
    }
    else {
        fullPath = path.resolve(__dirname, filePath);
    }
    // Đảm bảo thư mục tồn tại
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
        try {
            fs.mkdirSync(directory, { recursive: true });
        }
        catch (err) {
            console.error("Error creating directory:", err);
            return;
        }
    }
    console.log(`Attempting to save file to: ${fullPath}`);
    console.log(`Current autoSave status: ${autoSaveEnabled ? "ON" : "OFF"}`);
    fs.writeFile(fullPath, content, (err) => {
        if (err) {
            console.error("Error saving file:", err);
        }
        else {
            console.log(`File saved successfully at ${timestamp}`);
            console.log(`File location: ${fullPath}`);
        }
    });
}
// Hàm gửi phản hồi
function sendResponse(id, success, message, data) {
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
    }
    catch (error) {
        console.error("Error sending response:", error);
    }
}
