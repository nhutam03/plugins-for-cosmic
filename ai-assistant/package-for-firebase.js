const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Tên plugin
const pluginName = 'ai-assistant';
// Phiên bản plugin
const pluginVersion = '1.0.0';
// Tên file ZIP
const zipFileName = `${pluginName}-${pluginVersion}-firebase.zip`;
// Đường dẫn đến file ZIP
const zipFilePath = path.join(__dirname, '..', zipFileName);

console.log('🚀 Đóng gói AI Assistant Plugin cho Firebase Storage...');

// Tạo thư mục tạm thời
const tempDir = path.join(__dirname, 'temp-firebase-package');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Sao chép các file cần thiết
console.log('📦 Sao chép các file cần thiết...');

// 1. Sao chép package.json với dependencies đầy đủ
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
packageJson.main = 'index.js';
fs.writeFileSync(
  path.join(tempDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// 2. Sao chép file dist/index.js (đã được build và có mock AI)
fs.copyFileSync(
  path.join(__dirname, 'dist', 'index.js'),
  path.join(tempDir, 'index.js')
);

// 3. Sao chép README.md
fs.copyFileSync(
  path.join(__dirname, 'README.md'),
  path.join(tempDir, 'README.md')
);

// 4. Tạo file .env.example
fs.writeFileSync(
  path.join(tempDir, '.env.example'),
  `# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-pro

# Optional: Other AI providers
# OPENAI_API_KEY=your_openai_api_key_here
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama2
# HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Plugin Configuration
NODE_ENV=production
`
);

// 5. Tạo file start script
fs.writeFileSync(
  path.join(tempDir, 'start.bat'),
  `@echo off
echo Starting AI Assistant Plugin...
node index.js --port=5001
`
);

console.log('✅ Đã sao chép tất cả files cần thiết');

// Tạo file zip
console.log('🗜️ Tạo file zip...');
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
console.log('🎊 Hoàn tất đóng gói AI Assistant Plugin!');
console.log('');
console.log('📋 Thông tin plugin:');
console.log(`   - Tên: ${pluginName}`);
console.log(`   - Phiên bản: ${pluginVersion}`);
console.log(`   - File: ${zipFileName}`);
console.log('');
console.log('🚀 Plugin đã sẵn sàng để upload lên Firebase Storage!');
console.log('');
console.log('💡 Tính năng:');
console.log('   ✅ Kết nối với text editor');
console.log('   ✅ Đăng ký menu items (4 tính năng AI)');
console.log('   ✅ Xử lý AI requests với mock response');
console.log('   ✅ Hỗ trợ multiple AI providers');
console.log('   ✅ Auto-reconnect khi mất kết nối');
