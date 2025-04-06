const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourceWasmPath = path.join(__dirname, 'node_modules', '@babylonjs', 'havok', 'lib', 'esm', 'HavokPhysics.wasm');
const destDir = path.join(__dirname, 'public', 'assets');
const destWasmPath = path.join(destDir, 'HavokPhysics.wasm');

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy the WASM file
try {
    fs.copyFileSync(sourceWasmPath, destWasmPath);
    console.log('Successfully copied Havok WASM file to public/assets/');
} catch (error) {
    console.error('Error copying Havok WASM file:', error);
} 