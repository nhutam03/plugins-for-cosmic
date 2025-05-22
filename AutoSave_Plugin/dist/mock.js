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
// Thay đổi port để khớp với port mà plugin đang kết nối
const PORT = 8080;
// Tạo server và lưu socket kết nối
const server = net.createServer();
let connectedSocket = null;
// Thêm hàm để gửi lệnh toggle với file path
function sendToggleCommand(socket, filePath) {
    const toggleMessage = {
        type: "execute-menu-action",
        id: Date.now().toString(),
        payload: {
            menuItemId: "autoSave-plugin.toggleAutoSave",
            filePath: filePath || "custom-saved-file.js", // Mặc định hoặc file được chỉ định
        },
    };
    socket.write(JSON.stringify(toggleMessage));
    console.log(`Sent toggle command to plugin with file: ${filePath || "custom-saved-file.js"}`);
}
// Thêm khả năng nhập file path từ console
process.stdin.on("data", (data) => {
    const input = data.toString().trim();
    if (input.startsWith("save ")) {
        const filePath = input.substring(5);
        console.log(`Will toggle auto-save for file: ${filePath}`);
        // Gửi lệnh với file path được chỉ định
        if (connectedSocket) {
            sendToggleCommand(connectedSocket, filePath);
        }
        else {
            console.log("No plugin connected yet");
        }
    }
    else if (input === "toggle") {
        // Gửi lệnh toggle với file mặc định
        if (connectedSocket) {
            sendToggleCommand(connectedSocket);
        }
        else {
            console.log("No plugin connected yet");
        }
    }
    else {
        console.log("Commands: 'toggle' or 'save <filepath>'");
    }
});
server.on("connection", (socket) => {
    console.log("Plugin connected");
    connectedSocket = socket;
    socket.on("data", (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log("Received message from plugin:", message.type);
        }
        catch (error) {
            console.error("Error parsing message:", error);
        }
    });
    socket.on("end", () => {
        console.log("Plugin disconnected");
        connectedSocket = null;
    });
});
// Start the server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
