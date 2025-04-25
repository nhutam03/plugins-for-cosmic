import { app, BrowserWindow } from "electron";
import * as fs from "fs";
import net from "net";

// Import pdfmake và fonts
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

// Đăng ký fonts cho pdfmake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

let mainWindow: BrowserWindow | null = null;
const CORE_PORT = 5000;

/**
 * Hàm chuẩn hóa văn bản tiếng Việt
 * Thay thế các ký tự đặc biệt bị mã hóa sai và chuyển đổi sang ASCII
 */
function normalizeVietnameseText(text: string): string {
    // Bảng đối chiếu các ký tự đặc biệt thường gặp
    const replacements: {[key: string]: string} = {
        // Các ký tự đặc biệt trong log
        'Bß║»t': 'Bat',
        '─æß║ºu': 'dau',
        'Chuß║⌐n': 'Chuan',
        'bß╗ï': 'bi',
        'm├┤i': 'moi',
        'tr╞░ß╗¥ng': 'truong',
        'ph├ít': 'phat',
        'triß╗ân': 'trien',
        'Kiß╗âm': 'Kiem',
        'kß║┐t': 'ket',
        'nß╗æi': 'noi',
        'giß╗»a': 'giua',
        'T├¡ch': 'Tich',
        'hß╗úp': 'hop',
        'v├áo': 'vao',
        'Xß╗¡': 'Xu',
        'l├╜': 'ly',
        'lß╗ùi': 'loi',
        'kiß╗âm': 'kiem',
        'thß╗¡': 'thu',
        't├¡nh': 'tinh',
        'n─âng': 'nang',
        'Ho├án': 'Hoan',
        'th├ánh': 'thanh',
        'khai': 'khai',
        'Kß║┐t': 'Ket',
        'th├║c': 'thuc'
    };

    // Bảng chuyển đổi tiếng Việt có dấu sang không dấu
    const vietnameseMap: {[key: string]: string} = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
        'Đ': 'D'
    };

    let result = text;

    // Thay thế các ký tự đặc biệt
    for (const [encoded, decoded] of Object.entries(replacements)) {
        result = result.replace(new RegExp(encoded, 'g'), decoded);
    }

    // Chuyển đổi các ký tự tiếng Việt có dấu sang không dấu
    for (const [vietnameseChar, asciiChar] of Object.entries(vietnameseMap)) {
        result = result.replace(new RegExp(vietnameseChar, 'g'), asciiChar);
    }

    return result;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    const socket = net.createConnection({ port: CORE_PORT, host: "localhost" }, () => {
        console.log("Connected to core");

        // Đăng ký plugin theo đúng định dạng giao thức
        const registerMessage = {
            type: "register-plugin",
            payload: {
                name: "export-to-pdf",
                version: "1.0.0",
                description: "Export text content to PDF",
                author: "Text Editor Team"
            }
        };

        socket.write(JSON.stringify(registerMessage));

        // Đăng ký menu item sau khi đăng ký plugin
        setTimeout(() => {
            const menuItems = [
                {
                    id: "export-to-pdf.exportToPdf",
                    label: "Export to PDF",
                    parentMenu: "file",
                    position: 100,
                    shortcut: "Ctrl+Shift+E"
                }
            ];

            const registerMenuMessage = {
                type: "register-menu",
                payload: {
                    pluginName: "export-to-pdf",
                    menuItems: menuItems
                }
            };

            console.log("Registering menu items:", menuItems);
            socket.write(JSON.stringify(registerMenuMessage));
        }, 1000); // Đợi 1 giây để đảm bảo plugin đã được đăng ký trước
    });

    socket.on("data", (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log("Received message:", message);

            if (message.type === "execute-plugin" || message.type === "execute-menu-action") {
                // Truy cập đúng cấu trúc message từ PluginManager
                const { content, filePath } = message.payload || {};

                console.log(`Received ${message.type} with content length: ${content?.length || 0}`);
                console.log(`File path: ${filePath || 'none'}`);

                // Kiểm tra xem filePath có tồn tại không
                if (!filePath) {
                    console.error("Error: No file path provided");
                    socket.write(JSON.stringify({
                        type: "plugin-response",
                        id: message.id,
                        payload: {
                            success: false,
                            message: "Error: No file path provided"
                        }
                    }));
                    return;
                }

                // Nếu là execute-menu-action, kiểm tra menuItemId
                if (message.type === "execute-menu-action") {
                    const { menuItemId } = message.payload || {};
                    console.log(`Menu item ID: ${menuItemId}`);

                    // Chỉ xử lý nếu là menu item của plugin này
                    if (menuItemId !== "export-to-pdf.exportToPdf") {
                        console.error(`Unknown menu item ID: ${menuItemId}`);
                        socket.write(JSON.stringify({
                            type: "plugin-response",
                            id: message.id,
                            payload: {
                                success: false,
                                message: `Unknown menu item ID: ${menuItemId}`
                            }
                        }));
                        return;
                    }
                }

                try {
                    // Chuẩn hóa encoding cho tiếng Việt (giữ nguyên dấu)
                    // Chỉ thay thế các ký tự bị mã hóa sai
                    const normalizedContent = content ? normalizeVietnameseText(content) : "Không có nội dung";

                    // Chia nội dung thành các dòng
                    const lines = normalizedContent.split(/\r?\n/);

                    // Tạo nội dung cho PDF
                    const docDefinition = {
                        info: {
                            title: 'Exported Document',
                            author: 'Text Editor',
                            subject: 'Text Document',
                            keywords: 'text, document, export',
                            creator: 'PDF Export Plugin'
                        },
                        content: [
                            // Tiêu đề
                            { text: 'Tài liệu xuất PDF', style: 'header', alignment: 'center' },
                            '\n',
                            // Nội dung chính
                            ...lines.map(line => ({ text: line, margin: [0, 5, 0, 0] }))
                        ],
                        defaultStyle: {
                            font: 'Roboto',
                            fontSize: 12
                        },
                        styles: {
                            header: {
                                fontSize: 18,
                                bold: true,
                                margin: [0, 0, 0, 10]
                            }
                        }
                    };

                    // Tạo PDF
                    const pdfDoc = pdfMake.createPdf(docDefinition);

                    // Xuất PDF ra file
                    pdfDoc.getBuffer((buffer: Buffer) => {
                        fs.writeFileSync(filePath, buffer);
                        console.log(`PDF exported to: ${filePath}`);

                        socket.write(JSON.stringify({
                            type: "plugin-response",
                            id: message.id,
                            payload: {
                                success: true,
                                message: `PDF exported to ${filePath}`,
                                data: { filePath }
                            }
                        }));
                    });

                    // Lưu ý: Không cần gửi phản hồi ở đây vì đã gửi trong callback getBuffer
                    // socket.write(JSON.stringify({
                    //    type: "plugin-response",
                    //    id: message.id,
                    //    payload: {
                    //        success: true,
                    //        message: `PDF exported to ${filePath}`,
                    //        data: { filePath }
                    //    }
                    // }));
                } catch (error: any) {
                    console.error("Error creating PDF:", error);
                    socket.write(JSON.stringify({
                        type: "plugin-response",
                        id: message.id,
                        payload: {
                            success: false,
                            message: `Error creating PDF: ${error.message || 'Unknown error'}`
                        }
                    }));
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    });

    socket.on("error", (err: Error) => {
        console.error("Socket error:", err);
    });

    socket.on("end", () => {
        console.log("Disconnected from core");
    });

    mainWindow.loadURL("data:text/html,<html><body></body></html>");
}

app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});