const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a zip file with the plugin contents
console.log('Packaging plugin for distribution...');

// Files and directories to include in the zip
const filesToInclude = [
  'dist',
  'manifest.json',
  'README.md',
  'package.json',
  'package-lock.json'
];

// Create a temporary directory for packaging
const tempDir = path.join(__dirname, 'temp-package');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Copy files to the temporary directory
filesToInclude.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(tempDir, file);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // If it's a directory, create it and copy contents recursively
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      
      const files = fs.readdirSync(sourcePath);
      files.forEach(subFile => {
        const subSourcePath = path.join(sourcePath, subFile);
        const subDestPath = path.join(destPath, subFile);
        
        if (fs.lstatSync(subSourcePath).isFile()) {
          fs.copyFileSync(subSourcePath, subDestPath);
        }
      });
    } else {
      // If it's a file, just copy it
      fs.copyFileSync(sourcePath, destPath);
    }
  }
});

// Create a package.json with only the necessary dependencies
const packageJson = require('./package.json');
const minimalPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description || 'Export to PDF plugin',
  main: packageJson.main,
  author: packageJson.author || 'Text Editor Team',
  license: packageJson.license,
  dependencies: {
    'pdfmake': packageJson.dependencies.pdfmake,
    'electron': packageJson.dependencies.electron
  }
};

fs.writeFileSync(
  path.join(tempDir, 'package.json'),
  JSON.stringify(minimalPackageJson, null, 2)
);

// Create the zip file
const zipFileName = `${packageJson.name}-${packageJson.version}.zip`;
const zipFilePath = path.join(__dirname, zipFileName);

try {
  // Remove existing zip file if it exists
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  
  // Use PowerShell to create the zip file (Windows compatible)
  const command = `powershell -command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFilePath}'"`;
  execSync(command);
  
  console.log(`Successfully created ${zipFileName}`);
} catch (error) {
  console.error('Error creating zip file:', error);
}

// Clean up the temporary directory
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Cleaned up temporary files');
} catch (error) {
  console.error('Error cleaning up:', error);
}

console.log('Packaging complete!');
console.log(`You can now upload ${zipFileName} to Firebase storage.`);
