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

// Tạo thư mục tạm thời
const tempDir = path.join(__dirname, 'temp-package');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Sao chép các file cần thiết
console.log('Sao chép các file cần thiết...');

// Sao chép package.json với main trỏ đến index.js
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
packageJson.main = 'index.js';
fs.writeFileSync(
  path.join(tempDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Sao chép dist/index.js thành index.js
fs.copyFileSync(
  path.join(__dirname, 'dist', 'index.js'),
  path.join(tempDir, 'index.js')
);

// Sao chép README.md
fs.copyFileSync(
  path.join(__dirname, 'README.md'),
  path.join(tempDir, 'README.md')
);

// Sao chép .env
fs.copyFileSync(
  path.join(__dirname, '.env'),
  path.join(tempDir, '.env')
);

// Tạo file zip
console.log('Tạo file zip...');
try {
  // Xóa file zip cũ nếu tồn tại
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  // Sử dụng PowerShell để tạo file zip
  const command = `powershell -command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFilePath}'"`;
  execSync(command);

  console.log(`Đã tạo file zip thành công: ${zipFilePath}`);
} catch (error) {
  console.error('Lỗi khi tạo file zip:', error);
}

// Xóa thư mục tạm thời
console.log('Xóa thư mục tạm thời...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('Hoàn tất!');
