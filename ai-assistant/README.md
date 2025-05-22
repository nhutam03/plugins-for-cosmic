# AI Assistant Plugin

Plugin tích hợp trí tuệ nhân tạo (AI) cho Text Editor, cung cấp các tính năng như hoàn thành mã, giải thích mã, tạo mã và trò chuyện với AI.

## Tính năng

- **Hoàn thành mã (Complete Code)**: Tự động hoàn thành đoạn mã dựa trên ngữ cảnh hiện tại.
- **Giải thích mã (Explain Code)**: Giải thích đoạn mã được chọn bằng ngôn ngữ tự nhiên.
- **Tạo mã (Generate Code)**: Tạo mã dựa trên mô tả bằng ngôn ngữ tự nhiên.
- **Trò chuyện AI (AI Chat)**: Tương tác với AI để hỏi đáp về lập trình.

## Cài đặt

1. Cài đặt các dependencies:
   ```
   npm install
   ```
2. Build plugin:
   ```
   npm run build
   ```
3. Đóng gói plugin thành file ZIP.
4. Tải lên Firebase Storage.
5. Cài đặt plugin từ Plugin Marketplace trong Text Editor.

## Sử dụng

Sau khi cài đặt, các tính năng AI sẽ có sẵn trong menu Edit và View:

- **Edit > Complete Code** (Alt+C): Hoàn thành đoạn mã hiện tại.
- **Edit > Explain Code** (Alt+E): Giải thích đoạn mã được chọn.
- **Edit > Generate Code** (Alt+G): Mở hộp thoại để nhập mô tả và tạo mã.
- **View > AI Chat** (Alt+A): Mở giao diện trò chuyện với AI.

## Yêu cầu

- Node.js 14.0 trở lên
- Text Editor phiên bản mới nhất
- Kết nối internet để truy cập dịch vụ AI

## Cấu hình

Plugin này sử dụng một proxy server để kết nối với dịch vụ AI, do đó không yêu cầu người dùng phải cung cấp API key. Cấu hình cơ bản được lưu trong file `.env`:

```
# AI Provider Configuration
AI_PROVIDER=gemini  # Hiện tại chỉ hỗ trợ Gemini

# Model Configuration
GEMINI_MODEL=gemini-pro  # gemini-pro hoặc gemini-pro-vision
```

### Nhà cung cấp AI

Plugin hiện đang sử dụng **Google Gemini** thông qua một proxy server:
- Không yêu cầu API key từ người dùng
- Chất lượng phản hồi tốt
- Hỗ trợ tiếng Việt
- Không yêu cầu cấu hình máy tính mạnh

## Xử lý sự cố

Nếu bạn gặp vấn đề với plugin:

1. Kiểm tra kết nối internet.
2. Kiểm tra log của plugin trong console.
3. Đảm bảo bạn đang sử dụng phiên bản mới nhất của Text Editor.
4. Nếu proxy server không phản hồi, có thể do đã đạt giới hạn sử dụng hoặc đang bảo trì.

## Phát triển

Để phát triển plugin:

1. Clone repository.
2. Cài đặt dependencies: `npm install`.
3. Thực hiện các thay đổi trong thư mục `src`.
4. Build plugin: `npm run build`.
5. Kiểm tra plugin bằng cách chạy: `node dist/index.js --port=5000`.

## Giấy phép

MIT
