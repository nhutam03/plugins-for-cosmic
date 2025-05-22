import * as net from "net";

// Thay đổi port để khớp với port mà plugin đang kết nối
const PORT = 8080;

// Tạo server và lưu socket kết nối
const server = net.createServer();
let connectedSocket: net.Socket | null = null;

// Thêm hàm để gửi lệnh toggle với file path
function sendToggleCommand(socket: net.Socket, filePath?: string) {
  const toggleMessage = {
    type: "execute-menu-action",
    id: Date.now().toString(),
    payload: {
      menuItemId: "autoSave-plugin.toggleAutoSave",
      filePath: filePath || "custom-saved-file.js", // Mặc định hoặc file được chỉ định
    },
  };
  socket.write(JSON.stringify(toggleMessage));
  console.log(
    `Sent toggle command to plugin with file: ${filePath || "custom-saved-file.js"}`
  );
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
    } else {
      console.log("No plugin connected yet");
    }
  } else if (input === "toggle") {
    // Gửi lệnh toggle với file mặc định
    if (connectedSocket) {
      sendToggleCommand(connectedSocket);
    } else {
      console.log("No plugin connected yet");
    }
  } else {
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
    } catch (error) {
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
