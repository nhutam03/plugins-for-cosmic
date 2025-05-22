const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Đường dẫn đến thư mục plugin
const pluginDir = __dirname;
// Tên plugin
const pluginName = 'ai-assistant';
// Phiên bản plugin
const pluginVersion = '1.0.0';
// Tên file ZIP
const zipFileName = `${pluginName}-${pluginVersion}.zip`;
// Đường dẫn đến file ZIP
const zipFilePath = path.join(__dirname, '..', zipFileName);

// Tạo một writeStream để ghi file ZIP
const output = fs.createWriteStream(zipFilePath);
// Tạo một archiver để nén thư mục
const archive = archiver('zip', {
  zlib: { level: 9 } // Mức độ nén tối đa
});

// Xử lý sự kiện khi nén hoàn tất
output.on('close', () => {
  console.log(`Plugin đã được đóng gói thành công: ${zipFilePath}`);
  console.log(`Kích thước: ${archive.pointer()} bytes`);
});

// Xử lý sự kiện khi có lỗi
archive.on('error', (err) => {
  throw err;
});

// Pipe archiver đến output
archive.pipe(output);

// Tạo thư mục ai-assistant trong zip
const folderName = pluginName;

// Thêm các file cần thiết vào archive với đường dẫn thư mục
archive.file(path.join(pluginDir, 'package.json'), { name: `${folderName}/package.json` });
archive.file(path.join(pluginDir, 'README.md'), { name: `${folderName}/README.md` });
// Thêm file .env đã được cập nhật (không còn chứa API key)
archive.file(path.join(pluginDir, '.env'), { name: `${folderName}/.env` });

// Thêm thư mục dist
archive.directory(path.join(pluginDir, 'dist'), `${folderName}/dist`);

// Thêm các thư mục node_modules nếu cần
// archive.directory(path.join(pluginDir, 'node_modules'), 'node_modules');

// Hoàn tất quá trình nén
archive.finalize();
